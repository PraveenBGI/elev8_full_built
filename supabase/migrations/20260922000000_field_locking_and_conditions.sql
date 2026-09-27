-- Phase 0.5 -- field-level locking and sector/location-conditional
-- overrides on top of the existing country -> state delegation model.
--
-- Two real gaps in the original design, found by walking through the
-- actual intended outcome with Praveen:
--
-- 1. Delegation was previously all-or-nothing per pillar: a delegated
--    state either inherits the WHOLE country config or replaces the
--    WHOLE thing with their own. There was no way for a country to say
--    "this specific field is mandatory everywhere, but everything else
--    in this pillar is open for states to set."
-- 2. Nothing varied by a company's own attributes (sector, location) --
--    every company in the same state got an identical resolved config.
--
-- Rollback:
--   drop function if exists public.resolve_pillar_config(uuid, uuid, public.pillar_id, text, text);
--   drop table if exists public.pillar_config_conditions;
--   alter table public.pillar_configs drop column if exists locked_fields;
--   -- then re-create the original 3-argument resolve_pillar_config from
--   -- the foundation migration if truly rolling all the way back.

-- ── Field-level locking ──────────────────────────────────────────────────
-- Meaningful on country-level rows (state_id is null) -- these are the
-- dot-notation paths within THAT pillar's payload (e.g. 'evalWeights.icv',
-- 'thresholds.directAward') that a delegated state may not override. The
-- state's own payload can still set anything else freely.

alter table public.pillar_configs
  add column locked_fields text[] not null default '{}';

-- ── Sector/location-conditional overrides ────────────────────────────────
-- A country (or a delegated state, for their own pillar) can declare
-- rule variations by a company's own attributes. override_payload is
-- shallow-merged (jsonb `||`, top-level keys only, matching the same
-- documented limitation as updateCountryTaxSettings' merge-on-write) onto
-- the resolved base config when the condition matches. Multiple matching
-- conditions apply in ascending priority order, later ones winning on any
-- key they both touch.
--
-- condition_type is deliberately just 'sector' | 'location' for now, not
-- an open-ended rules engine -- exactly the two dimensions actually
-- requested. Extending to more dimensions later means adding another
-- allowed condition_type value and a matching WHEN branch in the
-- resolver, not a schema redesign.

create table public.pillar_config_conditions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  -- null = a country-wide condition (applies regardless of which state a
  -- company is under). Set = a condition this specific delegated state
  -- defined for their own pillar, same "state may customize within what
  -- they're allowed to" principle as pillar_configs itself.
  state_id uuid references public.states(id) on delete cascade,
  pillar public.pillar_id not null,
  condition_type text not null check (condition_type in ('sector', 'location')),
  condition_value text not null,
  override_payload jsonb not null,
  priority int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.pillar_config_conditions (country_id, pillar);
create index on public.pillar_config_conditions (state_id, pillar);

alter table public.pillar_config_conditions enable row level security;

-- Same boundary as pillar_configs itself: NOT broadly readable (these are
-- still rules, sensitive the same way pillar payloads are), only readable
-- via the resolver. Country Admin manages their own country-wide
-- conditions; a State Admin manages only conditions scoped to their own
-- delegated state; Country Admin can still see (rollup) a state's
-- conditions, matching pillar_configs' existing rollup policy.

create policy "pillar_config_conditions_country_admin_rw"
  on public.pillar_config_conditions for all
  to authenticated
  using (state_id is null and is_country_admin(country_id))
  with check (state_id is null and is_country_admin(country_id));

create policy "pillar_config_conditions_state_admin_rw"
  on public.pillar_config_conditions for all
  to authenticated
  using (state_id is not null and is_state_admin(state_id))
  with check (state_id is not null and is_state_admin(state_id));

create policy "pillar_config_conditions_country_admin_rollup_read"
  on public.pillar_config_conditions for select
  to authenticated
  using (state_id is not null and is_country_admin_of_state(state_id));

-- ── The updated resolver ─────────────────────────────────────────────────
-- IMPORTANT: CREATE OR REPLACE does not overwrite a function with a
-- different signature -- it creates a second overload alongside it,
-- which would leave the original 3-argument resolve_pillar_config()
-- callable and ambiguous next to this 5-argument version. The old
-- signature is dropped explicitly first, so there is exactly one
-- resolve_pillar_config() going forward.
drop function if exists public.resolve_pillar_config(uuid, uuid, public.pillar_id);

-- Backward compatible: called with just the original 3 arguments (as
-- every existing test and caller does), p_sector/p_location default to
-- null, no conditions match, and locked_fields being empty on any
-- pre-existing pillar_configs row means the locking step is a no-op --
-- identical behavior to before this migration. Existing tests in
-- config-engine-rls.test.sql and config-engine-workflow.test.sql are not
-- touched and must still pass unchanged.

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

  -- Step 1: pick the base -- state's own payload if delegated and they
  -- have one, else the country's.
  v_result := null;
  if p_state_id is not null then
    select config_control into v_control from states
    where id = p_state_id and country_id = p_country_id;

    if v_control = 'state' then
      select payload into v_result
      from pillar_configs
      where state_id = p_state_id and pillar = p_pillar;
    end if;
  end if;

  if v_result is null then
    -- Not delegated, or delegated but this pillar's state pack doesn't
    -- exist yet -- same "never show a broken/empty config" fallback the
    -- original resolver already had.
    v_result := v_country_payload;
  else
    -- Step 2: enforce locked fields -- force each locked path back to the
    -- country's value, but only if the country actually has a value
    -- there (locking an unset path would otherwise inject an explicit
    -- null rather than leaving the state's own value alone).
    foreach v_path in array v_locked_fields loop
      v_locked_value := v_country_payload #> string_to_array(v_path, '.');
      if v_locked_value is not null then
        v_result := jsonb_set(v_result, string_to_array(v_path, '.'), v_locked_value, true);
      end if;
    end loop;
  end if;

  -- Step 3: sector/location conditions, country-wide and (if this state
  -- is delegated) this state's own, applied together in one priority
  -- order -- a delegated state's own conditions don't get a separate
  -- pass, they compete on equal footing via priority, per the "state
  -- customizes within what the country allows" model.
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
