-- Phase 0.5 -- Country Master Data: HS Code Coverage
--
-- Source: elev8-country-admin-config_3.html's masterdata__hs-code-coverage
-- section -- a per-country list of HS codes (code, description, category),
-- explicitly stated in the mockup's own note as "referenced by Import's HS
-- Code Coverage and Export's Priority HS Codes."
--
-- Normalized as a real table (not folded into countries.master_data
-- jsonb like the other Master Data sections not yet built) because it's
-- a genuine list of records with add/remove semantics, not a handful of
-- settings -- same reasoning as country_ftas in the foundation migration.
--
-- Not yet foreign-keyed to any global HS code master, because Phase 1
-- (Master Data, the platform-wide reference-data phase, distinct from
-- this Phase 0.5 "Country Master Data" stage) doesn't exist yet. This
-- table holds each country's own ad hoc entries for now, matching what
-- the mockup itself does. See docs/modules/config-engine/README.md for
-- the reconciliation note once Phase 1 exists.
--
-- Rollback: drop table if exists public.country_hs_codes;

create table public.country_hs_codes (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  code text not null,
  description text not null,
  category text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (country_id, code)
);

create index on public.country_hs_codes (country_id);

alter table public.country_hs_codes enable row level security;

-- Same shape as country_ftas: broadly readable (Import/Export pillars and,
-- later, company-facing product/service forms all need to read this),
-- writable only by that country's Country Admin.
create policy "country_hs_codes_select_any_authenticated"
  on public.country_hs_codes for select
  to authenticated
  using (true);

create policy "country_hs_codes_write_country_admin_only"
  on public.country_hs_codes for all
  to authenticated
  using (is_country_admin(country_id))
  with check (is_country_admin(country_id));
