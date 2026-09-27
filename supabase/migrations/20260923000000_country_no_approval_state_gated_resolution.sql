-- Phase 0.5 -- two real product decisions, made directly with Praveen:
--
-- 1. Country configuration needs no approval at all. There is no
--    authority above a Country Admin in this system to approve their own
--    country, so the submit -> approve -> publish workflow built for
--    country-level configs was always going to end up either fake
--    (rubber-stamped by whoever holds it) or permanently unreachable
--    (which is exactly what happened -- approve_country_config() and
--    publish_country_config() were service-role-only with no real
--    caller). Collapsed to one action: publish directly.
--
-- 2. State configuration keeps its existing approval workflow -- a
--    state's decisions affect real third parties (every company in that
--    state), and a real reviewing authority already exists (the Country
--    Admin who set the baseline the state is customizing within). But
--    until now, approval_status was PURELY an audit/workflow label --
--    resolve_pillar_config() never actually checked it, so a state's
--    in-review draft edits were already live for every company the
--    instant they were saved. That made the review step theater. Now
--    the resolver only uses a delegated state's own payload once that
--    state's approval_status is 'published'; otherwise it falls back to
--    the country's config, exactly as if that state were not delegated.
--
-- Real, known limitation of #2, not silently ignored: pillar_configs
-- has no version history. The moment a state's payload is edited,
-- reset_approval_status_on_pillar_edit() (previous migration) reverts
-- approval_status to 'draft' AND the new payload has already overwritten
-- the old one -- there is no "last published snapshot" to fall back to
-- during review. So while a state's edits are under review, that state's
-- companies see the country's config, not the state's last-known-good
-- customization. Proper fix is a real versioning table, flagged in
-- docs/modules/config-engine/README.md, not built here.
--
-- Rollback:
--   -- restore the previous 3 country functions from
--   -- 20260919000000_approval_workflow_and_saved_configs.sql
--   -- restore the previous resolve_pillar_config() from
--   -- 20260922000000_field_locking_and_conditions.sql

-- ── Country: collapse to a single publish action ────────────────────────

drop function if exists public.submit_country_config_for_approval(uuid, text);
drop function if exists public.request_country_clarification(uuid, text);
drop function if exists public.approve_country_config(uuid, text);

-- Same signature as the old service-role-only publish_country_config(),
-- so this is a true in-place replace, not a second overload -- confirmed
-- via pg_proc after this migration, same check used when
-- resolve_pillar_config() grew new arguments.
create or replace function public.publish_country_config(
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
    raise exception 'Only that country''s Country Admin may publish it.';
  end if;

  select approval_status into v_current from countries where id = p_country_id;

  -- Same completeness gate submit_country_config_for_approval() used --
  -- all 8 pillars must exist and be at least ready_for_review. The
  -- outcome (published) changed; the bar to clear did not.
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
    raise exception 'Cannot publish: these pillars are not ready for review yet: %', v_incomplete_pillars;
  end if;

  update countries set approval_status = 'published', updated_at = now() where id = p_country_id;
  update pillar_configs set readiness_level = 'published' where country_id = p_country_id and state_id is null;

  insert into config_approval_events (country_id, actor_user_id, from_status, to_status, notes)
  values (p_country_id, auth.uid(), v_current, 'published', p_notes);
end;
$$;

-- The previous migration REVOKEd execute on this function's old
-- (service-role-only) version. CREATE OR REPLACE does not restore
-- grants -- a Country Admin must be explicitly re-granted access to the
-- function they can now actually call.
grant execute on function public.publish_country_config(uuid, text) to authenticated;

-- ── State: resolver now actually enforces approval_status ───────────────

create or replace function public.resolve_pillar_config(
  p_country_id uuid,
  p_state_id uuid,
  p_pillar public.pillar_id,
  p_sector text default null,
  p_location text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_control public.config_control;
  v_state_approval_status public.approval_status;
  v_country_payload jsonb;
  v_locked_fields text[];
  v_result jsonb;
  v_path text;
  v_locked_value jsonb;
  v_condition record;
begin
  select payload, locked_fields into v_country_payload, v_locked_fields
  from pillar_configs
  where country_id = p_country_id and state_id is null and pillar = p_pillar;

  v_country_payload := coalesce(v_country_payload, '{}'::jsonb);
  v_locked_fields := coalesce(v_locked_fields, '{}'::text[]);

  -- Step 1: pick the base -- state's own payload only if delegated AND
  -- that state's approval_status is 'published'. Not published (still
  -- draft, submitted, under_review, or clarification_required) falls
  -- back to the country's config, same as a non-delegated state -- the
  -- real behavior change from before this migration.
  v_result := null;
  if p_state_id is not null then
    select config_control, approval_status into v_control, v_state_approval_status
    from states
    where id = p_state_id and country_id = p_country_id;

    if v_control = 'state' and v_state_approval_status = 'published' then
      select payload into v_result
      from pillar_configs
      where state_id = p_state_id and pillar = p_pillar;
    end if;
  end if;

  if v_result is null then
    v_result := v_country_payload;
  else
    -- Step 2: enforce locked fields -- only reached when actually using
    -- a delegated, published state payload.
    foreach v_path in array v_locked_fields loop
      v_locked_value := v_country_payload #> string_to_array(v_path, '.');
      if v_locked_value is not null then
        v_result := jsonb_set(v_result, string_to_array(v_path, '.'), v_locked_value, true);
      end if;
    end loop;
  end if;

  -- Step 3: sector/location conditions, unchanged from the previous
  -- migration.
  if p_sector is not null or p_location is not null then
    for v_condition in
      select override_payload from pillar_config_conditions
      where country_id = p_country_id
        and pillar = p_pillar
        and (state_id is null or state_id = p_state_id)
        and (
          (condition_type = 'sector' and condition_value = p_sector)
          or (condition_type = 'location' and condition_value = p_location)
        )
      order by priority asc
    loop
      v_result := v_result || v_condition.override_payload;
    end loop;
  end if;

  return v_result;
end;
$$;

grant execute on function public.resolve_pillar_config(uuid, uuid, public.pillar_id, text, text)
  to authenticated;
