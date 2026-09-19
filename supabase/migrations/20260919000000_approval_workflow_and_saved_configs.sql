-- Phase 0.5 addendum -- approval workflow as an enforced state machine, plus
-- country-scoped saved configurations ("my templates", distinct from the
-- centrally curated config_templates).
--
-- Why this is a separate migration, not an edit to
-- 20260918000000_config_engine_foundation.sql: that migration is already
-- applied to the real Supabase project. Per 04-BUILD-STANDARDS.md sec 2,
-- a merged migration is never edited -- fix forward with a new one.
--
-- Rollback:
--   drop trigger if exists trg_reset_approval_on_pillar_edit on public.pillar_configs;
--   drop function if exists public.reset_approval_status_on_pillar_edit;
--   drop function if exists public.set_state_config_control;
--   drop function if exists public.publish_state_config;
--   drop function if exists public.approve_state_config;
--   drop function if exists public.start_state_review;
--   drop function if exists public.request_state_clarification;
--   drop function if exists public.submit_state_config_for_approval;
--   drop function if exists public.publish_country_config;
--   drop function if exists public.approve_country_config;
--   drop function if exists public.request_country_clarification;
--   drop function if exists public.submit_country_config_for_approval;
--   drop table if exists public.country_saved_configs;

-- ── Why approval_status was never directly writable by the actor who
-- needs to move it ──────────────────────────────────────────────────────
-- countries/states RLS only grants write access to country_admin (see
-- states_write_country_admin_only in the previous migration). A State
-- Admin has NO write access to the states table at all -- meaning there
-- was previously no path for a State Admin to submit their own config for
-- approval. This migration doesn't loosen that table-level RLS (a State
-- Admin still cannot UPDATE states directly); instead it adds narrow,
-- SECURITY DEFINER functions that perform one specific, audited
-- transition each, with their own internal authorization check. This is
-- the correct pattern for "this actor may cause exactly this state
-- change, nothing else" -- broader than that would let a State Admin (or
-- a Country Admin) write any column, including self-approving.

-- ── State-level transitions ──────────────────────────────────────────────

create or replace function public.submit_state_config_for_approval(
  p_state_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id uuid;
  v_current public.approval_status;
  v_incomplete_pillars text;
begin
  if not is_state_admin(p_state_id) then
    raise exception 'Only that state''s State Admin may submit it for approval.';
  end if;

  select country_id, approval_status into v_country_id, v_current
  from states where id = p_state_id;

  if v_current not in ('draft', 'clarification_required') then
    raise exception 'Cannot submit from status %. Must be draft or clarification_required.', v_current;
  end if;

  -- Completeness gate: all 8 pillars must exist for this state and be at
  -- least ready_for_review. Matches the mockup's own READINESS_LEVELS
  -- progression existing specifically to gate this step.
  select string_agg(p::text, ', ')
  into v_incomplete_pillars
  from unnest(enum_range(null::public.pillar_id)) as p
  where not exists (
    select 1 from pillar_configs pc
    where pc.state_id = p_state_id
      and pc.pillar = p
      and pc.readiness_level in ('ready_for_review', 'production_ready', 'published')
  );

  if v_incomplete_pillars is not null then
    raise exception 'Cannot submit: these pillars are not ready for review yet: %', v_incomplete_pillars;
  end if;

  update states set approval_status = 'submitted', updated_at = now() where id = p_state_id;

  insert into config_approval_events (country_id, state_id, actor_user_id, from_status, to_status, notes)
  values (v_country_id, p_state_id, auth.uid(), v_current, 'submitted', p_notes);
end;
$$;

create or replace function public.start_state_review(p_state_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id uuid;
  v_current public.approval_status;
begin
  if not is_country_admin_of_state(p_state_id) then
    raise exception 'Only that state''s Country Admin may start review.';
  end if;

  select country_id, approval_status into v_country_id, v_current from states where id = p_state_id;

  if v_current != 'submitted' then
    raise exception 'Cannot start review from status %. Must be submitted.', v_current;
  end if;

  update states set approval_status = 'under_review', updated_at = now() where id = p_state_id;

  insert into config_approval_events (country_id, state_id, actor_user_id, from_status, to_status)
  values (v_country_id, p_state_id, auth.uid(), v_current, 'under_review');
end;
$$;

create or replace function public.request_state_clarification(p_state_id uuid, p_notes text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id uuid;
  v_current public.approval_status;
begin
  if not is_country_admin_of_state(p_state_id) then
    raise exception 'Only that state''s Country Admin may request clarification.';
  end if;
  if p_notes is null or length(trim(p_notes)) = 0 then
    raise exception 'A clarification request must explain what needs to change.';
  end if;

  select country_id, approval_status into v_country_id, v_current from states where id = p_state_id;

  if v_current not in ('submitted', 'under_review') then
    raise exception 'Cannot request clarification from status %.', v_current;
  end if;

  update states set approval_status = 'clarification_required', updated_at = now() where id = p_state_id;

  insert into config_approval_events (country_id, state_id, actor_user_id, from_status, to_status, notes)
  values (v_country_id, p_state_id, auth.uid(), v_current, 'clarification_required', p_notes);
end;
$$;

create or replace function public.approve_state_config(p_state_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id uuid;
  v_current public.approval_status;
begin
  if not is_country_admin_of_state(p_state_id) then
    raise exception 'Only that state''s Country Admin may approve it.';
  end if;

  select country_id, approval_status into v_country_id, v_current from states where id = p_state_id;

  if v_current not in ('submitted', 'under_review') then
    raise exception 'Cannot approve from status %.', v_current;
  end if;

  update states set approval_status = 'approved', updated_at = now() where id = p_state_id;

  insert into config_approval_events (country_id, state_id, actor_user_id, from_status, to_status, notes)
  values (v_country_id, p_state_id, auth.uid(), v_current, 'approved', p_notes);
end;
$$;

create or replace function public.publish_state_config(p_state_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id uuid;
  v_current public.approval_status;
begin
  if not is_country_admin_of_state(p_state_id) then
    raise exception 'Only that state''s Country Admin may publish it.';
  end if;

  select country_id, approval_status into v_country_id, v_current from states where id = p_state_id;

  if v_current != 'approved' then
    raise exception 'Cannot publish from status %. Must be approved first.', v_current;
  end if;

  update states set approval_status = 'published', updated_at = now() where id = p_state_id;
  update pillar_configs set readiness_level = 'published' where state_id = p_state_id;

  insert into config_approval_events (country_id, state_id, actor_user_id, from_status, to_status, notes)
  values (v_country_id, p_state_id, auth.uid(), v_current, 'published', p_notes);
end;
$$;

-- Lever #2 from the design discussion: revoke/grant delegation without
-- ever touching what the State Admin authored. Country Admin only.
create or replace function public.set_state_config_control(
  p_state_id uuid,
  p_control public.config_control,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country_id uuid;
begin
  select country_id into v_country_id from states where id = p_state_id;

  if not is_country_admin(v_country_id) then
    raise exception 'Only this state''s Country Admin may change its configuration control.';
  end if;

  update states set config_control = p_control, updated_at = now() where id = p_state_id;

  insert into config_approval_events (country_id, state_id, actor_user_id, to_status, notes)
  select v_country_id, p_state_id, auth.uid(), approval_status,
    coalesce(p_notes, 'Configuration control changed to ' || p_control::text || ' by Country Admin.')
  from states where id = p_state_id;
end;
$$;

-- ── Country-level transitions ────────────────────────────────────────────
-- Submitting is symmetric with the state flow (Country Admin submits their
-- own country). Approving/publishing a COUNTRY's config has no defined
-- reviewer role yet in this schema -- there is no platform-wide admin role
-- built (see docs/modules/config-engine/README.md open questions). Rather
-- than let a Country Admin approve their own submission (the same
-- self-approval problem this whole migration exists to prevent) or invent
-- an unrequested role, these two are SECURITY DEFINER functions that exist
-- for schema completeness and audit-trail consistency, but EXECUTE is
-- deliberately revoked from PUBLIC below (Postgres grants EXECUTE on new
-- functions to PUBLIC by default -- omitting a GRANT is not enough on its
-- own) -- only reachable via
-- the Supabase service role (an internal ops action), until a platform
-- admin role is explicitly decided.

create or replace function public.submit_country_config_for_approval(
  p_country_id uuid,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.approval_status;
  v_incomplete_pillars text;
begin
  if not is_country_admin(p_country_id) then
    raise exception 'Only that country''s Country Admin may submit it for approval.';
  end if;

  select approval_status into v_current from countries where id = p_country_id;

  if v_current not in ('draft', 'clarification_required') then
    raise exception 'Cannot submit from status %. Must be draft or clarification_required.', v_current;
  end if;

  select string_agg(p::text, ', ')
  into v_incomplete_pillars
  from unnest(enum_range(null::public.pillar_id)) as p
  where not exists (
    select 1 from pillar_configs pc
    where pc.country_id = p_country_id
      and pc.state_id is null
      and pc.pillar = p
      and pc.readiness_level in ('ready_for_review', 'production_ready', 'published')
  );

  if v_incomplete_pillars is not null then
    raise exception 'Cannot submit: these pillars are not ready for review yet: %', v_incomplete_pillars;
  end if;

  update countries set approval_status = 'submitted', updated_at = now() where id = p_country_id;

  insert into config_approval_events (country_id, actor_user_id, from_status, to_status, notes)
  values (p_country_id, auth.uid(), v_current, 'submitted', p_notes);
end;
$$;

create or replace function public.request_country_clarification(p_country_id uuid, p_notes text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.approval_status;
begin
  if p_notes is null or length(trim(p_notes)) = 0 then
    raise exception 'A clarification request must explain what needs to change.';
  end if;

  select approval_status into v_current from countries where id = p_country_id;

  if v_current not in ('submitted', 'under_review') then
    raise exception 'Cannot request clarification from status %.', v_current;
  end if;

  update countries set approval_status = 'clarification_required', updated_at = now() where id = p_country_id;

  insert into config_approval_events (country_id, actor_user_id, from_status, to_status, notes)
  values (p_country_id, auth.uid(), v_current, 'clarification_required', p_notes);
end;
$$;

create or replace function public.approve_country_config(p_country_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.approval_status;
begin
  select approval_status into v_current from countries where id = p_country_id;

  if v_current not in ('submitted', 'under_review') then
    raise exception 'Cannot approve from status %.', v_current;
  end if;

  update countries set approval_status = 'approved', updated_at = now() where id = p_country_id;

  insert into config_approval_events (country_id, actor_user_id, from_status, to_status, notes)
  values (p_country_id, auth.uid(), v_current, 'approved', p_notes);
end;
$$;

create or replace function public.publish_country_config(p_country_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.approval_status;
begin
  select approval_status into v_current from countries where id = p_country_id;

  if v_current != 'approved' then
    raise exception 'Cannot publish from status %. Must be approved first.', v_current;
  end if;

  update countries set approval_status = 'published', updated_at = now() where id = p_country_id;
  update pillar_configs set readiness_level = 'published' where country_id = p_country_id and state_id is null;

  insert into config_approval_events (country_id, actor_user_id, from_status, to_status, notes)
  values (p_country_id, auth.uid(), v_current, 'published', p_notes);
end;
$$;

-- Grants: everyone gets the submit + revoke-delegation functions (their own
-- internal checks do the real gating). Country-level approve/publish/
-- clarification are intentionally NOT granted to authenticated -- see the
-- comment above.
grant execute on function public.submit_state_config_for_approval(uuid, text) to authenticated;
grant execute on function public.start_state_review(uuid) to authenticated;
grant execute on function public.request_state_clarification(uuid, text) to authenticated;
grant execute on function public.approve_state_config(uuid, text) to authenticated;
grant execute on function public.publish_state_config(uuid, text) to authenticated;
grant execute on function public.set_state_config_control(uuid, public.config_control, text) to authenticated;
grant execute on function public.submit_country_config_for_approval(uuid, text) to authenticated;

-- IMPORTANT: Postgres grants EXECUTE on every newly created function to
-- PUBLIC by default (unlike tables, which default to no access), AND many
-- Supabase projects have default privileges configured that additionally
-- auto-grant EXECUTE to `authenticated` specifically on every new public
-- schema function -- a well-known Supabase footgun. Revoking from PUBLIC
-- alone is not sufficient if that second mechanism is active (confirmed
-- as an actual problem, not a hypothetical one, by this migration's own
-- verification -- see tests/db/config-engine-workflow.test.sql TEST 9,
-- which failed on the first version of this migration until both revokes
-- were added). Revoke from every relevant role explicitly.
revoke execute on function public.request_country_clarification(uuid, text) from public, authenticated, anon;
revoke execute on function public.approve_country_config(uuid, text) from public, authenticated, anon;
revoke execute on function public.publish_country_config(uuid, text) from public, authenticated, anon;

-- ── Auto-revert to draft on post-approval edit ───────────────────────────
-- Matches the mockup's own confirmApplyTemplate() behavior ("puts those
-- stages back into Configuration In Progress") generalized to any pillar
-- edit, not just template application: editing a pillar's payload after
-- its scope has been approved/published silently invalidates that
-- approval, so it must go through review again rather than let an edited,
-- unreviewed config sit there still marked "Published".

create or replace function public.reset_approval_status_on_pillar_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.approval_status;
begin
  if new.state_id is not null then
    select approval_status into v_current from states where id = new.state_id;
    if v_current in ('approved', 'published') then
      update states set approval_status = 'draft', updated_at = now() where id = new.state_id;
      insert into config_approval_events (country_id, state_id, actor_user_id, from_status, to_status, notes)
      values (new.country_id, new.state_id, auth.uid(), v_current, 'draft',
        'Automatically reverted: pillar configuration edited after approval/publish.');
    end if;
  else
    select approval_status into v_current from countries where id = new.country_id;
    if v_current in ('approved', 'published') then
      update countries set approval_status = 'draft', updated_at = now() where id = new.country_id;
      insert into config_approval_events (country_id, actor_user_id, from_status, to_status, notes)
      values (new.country_id, auth.uid(), v_current, 'draft',
        'Automatically reverted: pillar configuration edited after approval/publish.');
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_reset_approval_on_pillar_edit
  after update of payload on public.pillar_configs
  for each row
  when (old.payload is distinct from new.payload)
  execute function public.reset_approval_status_on_pillar_edit();

-- ── Country-scoped saved configurations ("my templates") ─────────────────
-- Distinct from config_templates (BGI-curated, global, read-only to
-- admins). This is a Country Admin's own reusable presets, scoped
-- entirely to their own country -- never visible to any other country,
-- never promoted to the global library automatically.

create table public.country_saved_configs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  pillar public.pillar_id not null,
  name text not null,
  description text,
  payload jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),

  unique (country_id, pillar, name)
);

create index on public.country_saved_configs (country_id);

alter table public.country_saved_configs enable row level security;

create policy "country_saved_configs_owner_only"
  on public.country_saved_configs for all
  to authenticated
  using (is_country_admin(country_id))
  with check (is_country_admin(country_id));
