-- Phase 0.5 -- Country/State Configuration Engine: schema spine
--
-- Source of truth for this migration: elev8-country-admin-config_3.html and
-- elev8-state-config-muscat_3.html (the working mockups), read field-by-field,
-- not guessed. See docs/modules/config-engine/README.md for the full mapping
-- notes and the architecture decisions explained below.
--
-- Rollback: drop in reverse dependency order --
--   drop function if exists public.resolve_pillar_config;
--   drop table if exists public.config_approval_events;
--   drop table if exists public.config_templates;
--   drop table if exists public.pillar_configs;
--   drop table if exists public.config_admin_roles;
--   drop table if exists public.states;
--   drop table if exists public.countries;
--   drop type if exists public.config_control;
--   drop type if exists public.approval_status;
--   drop type if exists public.readiness_level;
--   drop type if exists public.pillar_id;
--   drop type if exists public.config_admin_role;

-- ── Enums, taken verbatim from the mockup's own constant lists ──────────────

create type public.pillar_id as enum (
  'governance','procurement','b2b','import','export',
  'investment','sustainability','icv'
);

create type public.readiness_level as enum (
  'not_started','basic_setup','configuration_in_progress',
  'validation_required','ready_for_review','production_ready','published'
);

create type public.approval_status as enum (
  'draft','submitted','under_review','clarification_required',
  'approved','published','superseded'
);

create type public.config_control as enum ('central','state');

create type public.config_admin_role as enum ('country_admin','state_admin');

-- ── Countries ────────────────────────────────────────────────────────────
-- Country Identity + Master Data fields from mockup stage 1 & 2. Master-data
-- sub-lists that Phase 1 (Master Data) will properly normalize on its own
-- (HS codes, zones, ports, registration types, units of measurement) are
-- deliberately kept as jsonb placeholders here rather than duplicated as
-- half-built tables now -- see the README for exactly which fields that
-- applies to. FTAs are the one exception: normalized as their own table
-- below because Phase 5/7's Classification & ICV engines need to query
-- them relationally (join on partner country, check an effective date),
-- not just display them.

create table public.countries (
  id uuid primary key default gen_random_uuid(),

  -- Identity (mockup stage: identity)
  name text not null,
  country_code text,
  wb_code text,
  official_language text,
  master_currency text not null,
  ancillary_currency text,
  time_zone text,
  dial_code text,
  geozone text,
  gps_location point,
  income_group text,
  system_of_trade text,
  wto_member boolean default false,
  financial_year_model text,
  current_financial_year text,
  working_week text,
  logo_path text,

  -- Corporate classification & strategic control (mockup stage: identity)
  corporate_classification jsonb not null default '{}'::jsonb,
  strategic_control jsonb not null default '{}'::jsonb,
  thrust_sectors jsonb not null default '[]'::jsonb,

  -- Country Master Data placeholders -- Phase 1 owns the real normalized
  -- version of hs_codes/zones/ports/registration_types/uom. This column
  -- exists so Phase 0.5 has somewhere real to save what the mockup
  -- collects, without inventing a second HS-code master to reconcile later.
  master_data jsonb not null default '{}'::jsonb,

  -- Workflow (mockup: Draft -> Submitted -> ... -> Published)
  approval_status public.approval_status not null default 'draft',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.countries.master_data is
  'Placeholder for HS code packs, economic/industrial zones, ports & customs points, tax/VAT system, registration types, units of measurement. Phase 1 (Master Data) normalizes these properly; do not build new relational tables against this jsonb blob in the meantime -- read it as opaque, write it as opaque.';

-- ── Free Trade Agreements ────────────────────────────────────────────────
-- Normalized (not jsonb) because Phase 5/7's Classification & ICV AI
-- engines query this relationally (03-AI-ENGINES-CLAUDE-API.md: HS Code /
-- CEPA-Tariff Mapping).

create table public.country_ftas (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  partner_country text not null,
  agreement_name text not null,
  effective_date date,
  tariff_schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on public.country_ftas (country_id);

-- ── States ───────────────────────────────────────────────────────────────
-- One config_control switch per state, per the actual mockup (not a
-- per-pillar toggle -- see docs/modules/config-engine/README.md for why
-- the roadmap doc originally said per-pillar and why that was wrong).

create table public.states (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  is_thrust_cluster boolean not null default false,
  partner_network jsonb not null default '[]'::jsonb,

  config_control public.config_control not null default 'central',
  -- Only meaningful when config_control = 'state': whether the State Admin
  -- will complete their pack later from their own login ('admin') or the
  -- Country Admin is opening/starting it now on their behalf ('now').
  state_config_mode text check (state_config_mode in ('admin', 'now')),

  approval_status public.approval_status not null default 'draft',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (country_id, name)
);

create index on public.states (country_id);

-- ── Config admin roles ───────────────────────────────────────────────────
-- Deliberately its own table, not a Supabase Auth custom claim. A claim
-- would work today but ties the RBAC model to Supabase Auth's JWT shape;
-- a plain table with RLS reads the same way regardless of which auth
-- provider issues the session (Supabase now, Cognito/custom JWT later --
-- see 01-ARCHITECTURE-AND-PORTABILITY.md sec 3).

create table public.config_admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.config_admin_role not null,
  country_id uuid not null references public.countries(id) on delete cascade,
  -- Required when role = 'state_admin', null when role = 'country_admin'.
  state_id uuid references public.states(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint state_admin_requires_state
    check (
      (role = 'country_admin' and state_id is null)
      or (role = 'state_admin' and state_id is not null)
    ),
  unique (user_id, role, country_id, state_id)
);

create index on public.config_admin_roles (user_id);

-- Helper functions for RLS policies below. STABLE, not SECURITY DEFINER --
-- they only read rows the calling user is already allowed to see via
-- config_admin_roles' own (permissive, self-row) policy.

create or replace function public.is_country_admin(p_country_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from config_admin_roles
    where user_id = auth.uid()
      and role = 'country_admin'
      and country_id = p_country_id
  );
$$;

create or replace function public.is_state_admin(p_state_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from config_admin_roles
    where user_id = auth.uid()
      and role = 'state_admin'
      and state_id = p_state_id
  );
$$;

-- Country Admins can also see (audit/rollup) events and roles for states
-- under their own country -- this is the "country admin can see what a
-- state admin overrode" requirement, not write access to the state's pack.
create or replace function public.is_country_admin_of_state(p_state_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from states s
    where s.id = p_state_id
      and is_country_admin(s.country_id)
  );
$$;

-- ── Pillar configs ───────────────────────────────────────────────────────
-- One row per (scope, pillar). scope is either a country (state_id null)
-- or a state (state_id set). Kept as jsonb per pillar rather than fully
-- normalized: each pillar's payload is itself a deeply nested document
-- (see CONFIG_TEMPLATES' patch shape in the mockup -- e.g.
-- procurement.evalWeights.technical), and normalizing every nested field
-- into columns now would mean a schema migration for every future field
-- tweak to a still-evolving spec. Postgres jsonb is plain Postgres, so
-- this is still fully portable to RDS -- see
-- 01-ARCHITECTURE-AND-PORTABILITY.md sec 2. Zod schemas per pillar (built
-- pillar-by-pillar, not all at once) validate the shape at the app layer
-- before it's ever written here.

create table public.pillar_configs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  state_id uuid references public.states(id) on delete cascade,
  pillar public.pillar_id not null,
  payload jsonb not null default '{}'::jsonb,
  readiness_level public.readiness_level not null default 'not_started',
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One row per pillar per scope. Postgres treats every null as distinct
  -- for uniqueness purposes, so the partial indexes below (not this
  -- constraint alone) are what actually enforce "one country-level row"
  -- and "one state-level row" separately -- see the two unique indexes
  -- immediately after this table.
  unique (country_id, state_id, pillar)
);

create unique index pillar_configs_country_scope_uidx
  on public.pillar_configs (country_id, pillar)
  where state_id is null;

create unique index pillar_configs_state_scope_uidx
  on public.pillar_configs (state_id, pillar)
  where state_id is not null;

create index on public.pillar_configs (country_id);
create index on public.pillar_configs (state_id);

-- ── Config templates ─────────────────────────────────────────────────────
-- Curated centrally (BGI), not by country admins -- see README open
-- question on who is allowed to author these. Applying one deep-merges
-- `patch` onto specific pillars' payloads and resets those pillars'
-- readiness_level, exactly per the mockup's confirmApplyTemplate() warning
-- text ("puts those stages back into Configuration In Progress").

create table public.config_templates (
  id text primary key,
  label text not null,
  icon text,
  tags text[] not null default '{}',
  description text not null,
  target_pillars public.pillar_id[] not null,
  patch jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Approval / audit event log ───────────────────────────────────────────
-- Append-only. This is both the workflow engine (each event carries the
-- from/to status) and the audit/rollup view a Country Admin needs to see
-- what a State Admin changed -- one table does both jobs, deliberately,
-- rather than a separate "audit log" bolted on afterward.

create table public.config_approval_events (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  state_id uuid references public.states(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  from_status public.approval_status,
  to_status public.approval_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create index on public.config_approval_events (country_id, created_at desc);
create index on public.config_approval_events (state_id, created_at desc);

-- ── The resolver ─────────────────────────────────────────────────────────
-- THE ONLY WAY company-facing code reads a pillar's effective configuration.
-- SECURITY DEFINER so it can read pillar_configs/states even though those
-- tables' own RLS (below) blocks company-scoped sessions from querying
-- them directly. Returns only the resolved jsonb payload -- never row
-- identity, never the ability to see what other scopes have configured.

create or replace function public.resolve_pillar_config(
  p_country_id uuid,
  p_state_id uuid,
  p_pillar public.pillar_id
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_control public.config_control;
  v_payload jsonb;
begin
  if p_state_id is not null then
    select config_control into v_control
    from states
    where id = p_state_id and country_id = p_country_id;

    if v_control = 'state' then
      select payload into v_payload
      from pillar_configs
      where state_id = p_state_id and pillar = p_pillar;

      if v_payload is not null then
        return v_payload;
      end if;
      -- Falls through to country-level below if the state's pack for
      -- this pillar doesn't exist yet (e.g. state_config_mode = 'admin'
      -- and the State Admin hasn't completed it) -- a company should
      -- never see an empty/broken config just because a state's pack is
      -- still in progress.
    end if;
  end if;

  select payload into v_payload
  from pillar_configs
  where country_id = p_country_id and state_id is null and pillar = p_pillar;

  return coalesce(v_payload, '{}'::jsonb);
end;
$$;

grant execute on function public.resolve_pillar_config(uuid, uuid, public.pillar_id)
  to authenticated;

-- ── Row Level Security ───────────────────────────────────────────────────

alter table public.countries enable row level security;
alter table public.country_ftas enable row level security;
alter table public.states enable row level security;
alter table public.config_admin_roles enable row level security;
alter table public.pillar_configs enable row level security;
alter table public.config_templates enable row level security;
alter table public.config_approval_events enable row level security;

-- countries / country_ftas: identity & FTA data is broadly readable --
-- every other module (currency formatting, tax calc, FTA eligibility)
-- depends on it, per 02-MODULE-ROADMAP.md Phase 0.5. Writes are
-- country-admin-only for that exact country.
create policy "countries_select_any_authenticated"
  on public.countries for select
  to authenticated
  using (true);

create policy "countries_write_country_admin_only"
  on public.countries for all
  to authenticated
  using (is_country_admin(id))
  with check (is_country_admin(id));

create policy "country_ftas_select_any_authenticated"
  on public.country_ftas for select
  to authenticated
  using (true);

create policy "country_ftas_write_country_admin_only"
  on public.country_ftas for all
  to authenticated
  using (is_country_admin(country_id))
  with check (is_country_admin(country_id));

-- states: same reasoning -- name/thrust-cluster status is broadly
-- readable (a company's registration form needs a state dropdown), the
-- config_control switch itself is only writable by that state's country
-- admin (a State Admin doesn't get to promote themselves to 'state'
-- control -- that decision belongs one level up).
create policy "states_select_any_authenticated"
  on public.states for select
  to authenticated
  using (true);

create policy "states_write_country_admin_only"
  on public.states for all
  to authenticated
  using (is_country_admin(country_id))
  with check (is_country_admin(country_id));

-- config_admin_roles: a user can see their own role rows (so the app can
-- render "you are the Country Admin for X"); a Country Admin can also see
-- role rows for states under their own country (the audit/rollup
-- requirement). No one except a service-role migration/seed script
-- creates these rows in Phase 0.5 -- there is no self-service "become an
-- admin" flow, intentionally.
create policy "config_admin_roles_select_own_or_rollup"
  on public.config_admin_roles for select
  to authenticated
  using (
    user_id = auth.uid()
    or is_country_admin(country_id)
  );

-- pillar_configs: THE STRUCTURAL BOUNDARY. No select policy for ordinary
-- authenticated users at all -- company-facing code must go through
-- resolve_pillar_config(), never this table. Admins can read/write only
-- their own exact scope; a Country Admin can additionally read (not
-- write) a state's pillar_configs under their own country, for the
-- audit/rollup view.
create policy "pillar_configs_country_admin_rw"
  on public.pillar_configs for all
  to authenticated
  using (state_id is null and is_country_admin(country_id))
  with check (state_id is null and is_country_admin(country_id));

create policy "pillar_configs_state_admin_rw"
  on public.pillar_configs for all
  to authenticated
  using (state_id is not null and is_state_admin(state_id))
  with check (state_id is not null and is_state_admin(state_id));

create policy "pillar_configs_country_admin_rollup_read"
  on public.pillar_configs for select
  to authenticated
  using (state_id is not null and is_country_admin_of_state(state_id));

-- config_templates: centrally curated, read-only to admins for now (no
-- country/state admin can author templates in Phase 0.5 -- see README
-- open question). Writes happen via service role only until a proper
-- platform-admin role exists.
create policy "config_templates_select_admins"
  on public.config_templates for select
  to authenticated
  using (
    exists (select 1 from config_admin_roles where user_id = auth.uid())
  );

-- config_approval_events: same shape as pillar_configs -- write your own
-- scope, Country Admin also reads state-level events under their country.
create policy "config_approval_events_country_admin_rw"
  on public.config_approval_events for all
  to authenticated
  using (state_id is null and is_country_admin(country_id))
  with check (state_id is null and is_country_admin(country_id));

create policy "config_approval_events_state_admin_rw"
  on public.config_approval_events for all
  to authenticated
  using (state_id is not null and is_state_admin(state_id))
  with check (state_id is not null and is_state_admin(state_id));

create policy "config_approval_events_country_admin_rollup_read"
  on public.config_approval_events for select
  to authenticated
  using (state_id is not null and is_country_admin_of_state(state_id));
