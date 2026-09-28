-- Company Configuration -- Enterprise Configuration step 4: Geography &
-- Corridors. Fourth of 7 Enterprise Configuration steps (Business
-- Identity, Role, Trade Intent already built).
--
-- home_country_id is DELIBERATELY separate from companies.country_id
-- (Business Identity's registration country) -- the mockup's own state
-- object keeps S.company.country and S.homeCountry as two distinct
-- fields, not the same value duplicated. A company could register
-- under one country's jurisdiction but operate primarily from another;
-- collapsing them into one field would be a real modeling decision, not
-- a harmless simplification, so this migration keeps the mockup's own
-- distinction rather than guessing they're interchangeable.
--
-- home_state and corridor_states are text (state NAMES), not foreign
-- keys to the real `states` table -- same reasoning as every other
-- Master Data picker in this project (country_ftas' partner_countries,
-- country_ports_airports references in Import/Export): matched by name
-- string, so the UI can offer a real picker when the country has actual
-- platform states configured, and fall back to free text when it
-- doesn't, without the schema itself needing to know which case applies.
--
-- Rollback:
--   alter table public.companies drop column if exists home_country_id;
--   alter table public.companies drop column if exists home_state;
--   alter table public.companies drop column if exists home_city;
--   alter table public.companies drop column if exists corridor_country_ids;
--   alter table public.companies drop column if exists corridor_states;

alter table public.companies
  add column home_country_id uuid references public.countries(id),
  add column home_state text,
  add column home_city text,
  add column corridor_country_ids uuid[] not null default '{}',
  add column corridor_states jsonb not null default '{}';
