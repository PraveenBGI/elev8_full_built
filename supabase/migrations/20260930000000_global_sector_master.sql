-- Global Sector Master -- the first real slice of Phase 1 (Master
-- Data) from 02-MODULE-ROADMAP.md, and the first piece of the Portal
-- Admin / Super Admin tier confirmed to exist in the legacy
-- architecture (LyPIS Architecture / elev8 Website & Stakeholder
-- diagrams: Portal Admin's own "3. MASTER MAINTENANCE" panel lists
-- "4. Sector Master -> 4.1 Sector, 4.2 Industry, 4.3 Activity") but not
-- yet built anywhere in this codebase.
--
-- Directly resolves a gap flagged repeatedly across this build and
-- confirmed explicitly by the FRD itself (3.1 Step 1, Business
-- Identity): "Sector can be selected from the dropdown list. The data
-- will be pulled from the database -- Active Sectors." Business
-- Identity currently uses a hardcoded 11-value enum
-- (COMPANY_SECTORS in company-config/schemas.ts) instead.
--
-- Deliberately scoped to the flat Sector level only, not the full
-- Sector -> Industry -> Activity hierarchy the architecture diagram
-- shows -- that three-level structure is a real, larger piece of work
-- and building it speculatively here, ungrounded in an actual
-- consumer needing Industry/Activity granularity yet, would be
-- guessing at a shape rather than building what's actually needed.
-- is_active on this table is what "Active Sectors" in the FRD's own
-- wording means: a sector can be retired without deleting history that
-- references it.
--
-- This is genuinely GLOBAL reference data (unlike country_hs_codes,
-- country_ports_airports, etc, which are per-country under a specific
-- country_id) -- it has no country_id at all, matching the
-- architecture's own placement of Sector Master under Portal Admin
-- (above every country), not Country Admin.
--
-- RLS: read-only for every authenticated user, same
-- select_any_authenticated pattern as the countries table itself
-- (20260918000000_config_engine_foundation.sql), since this is
-- reference data every company and every country reads. Writes are
-- deliberately NOT exposed through any RLS policy yet -- there is no
-- Portal Admin / Super Admin role built anywhere in this codebase to
-- correctly gate a write policy against (is_country_admin() exists,
-- is_portal_admin() does not), so inventing one now would be a fake
-- permission check protecting nothing real. Seed rows are inserted
-- directly in this migration; until a real Portal Admin tier is built,
-- corrections go through a new migration, the same discipline already
-- used for every other master-data correction in this project.
--
-- Rollback:
--   drop table if exists public.sectors;

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sectors enable row level security;

create policy "sectors_select_any_authenticated"
  on public.sectors for select
  to authenticated
  using (true);

-- Seed: a real, broad-enough starting set covering the sectors already
-- referenced across this build (the old COMPANY_SECTORS enum, plus
-- ones named in Investment/Export/ICV sample data -- Renewable Energy,
-- Solar, etc were always free text sitting on top of these broader
-- sectors, not sectors themselves) -- not exhaustive, extended the same
-- way every other master-data table in this project grows: a new
-- migration, never an edit to this one.
insert into public.sectors (name, sort_order) values
  ('Energy', 10),
  ('Oil & Gas', 20),
  ('Renewable & Clean Energy', 30),
  ('Manufacturing', 40),
  ('Construction & Infrastructure', 50),
  ('Information & Communications Technology', 60),
  ('Healthcare & Life Sciences', 70),
  ('Logistics & Transportation', 80),
  ('Food & Agriculture', 90),
  ('Tourism & Hospitality', 100),
  ('Mining & Minerals', 110),
  ('Financial Services', 120),
  ('Real Estate', 130),
  ('Retail & Consumer Goods', 140),
  ('Education', 150),
  ('Government & Public Sector', 160),
  ('Other', 999);
