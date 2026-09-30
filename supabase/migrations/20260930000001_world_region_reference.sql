-- World Region Reference -- resolves a gap flagged repeatedly across
-- this build: Export's target market countries, Investment's market
-- countries, and Import's sourcing countries have all been plain free
-- text with no backing reference list, since one didn't exist. This is
-- genuinely global reference data (no country_id), the second slice
-- of Phase 1 (Master Data) after the global Sector Master, and a
-- different concept from the existing `countries` table -- `countries`
-- represents platform-ONBOARDED countries (Oman, India, Tanzania: the
-- ones elev8 is actually deployed in and configured for), while this
-- table is every country a company might reference for trade purposes
-- (a target export market, a sourcing origin) whether or not elev8 is
-- deployed there at all.
--
-- world_regions / world_sub_regions / world_countries, not "regions"/
-- "countries" alone -- the "world_" prefix keeps this unmistakably
-- separate from the existing `countries` table in every query and
-- migration that touches either, since confusing the two would be a
-- real, easy-to-make modeling mistake.
--
-- Sub-regions are genuinely optional, not universal: South Asia and
-- Central Asia are already narrow enough that most standard geo-schemes
-- (UN M49 among them) nest them inside a broader Asia grouping rather
-- than giving them their own sub-region layer -- countries in those two
-- regions attach directly to the region with sub_region_id null.
--
-- Seed data is deliberately NOT an attempt at all ~195 world countries
-- -- that would risk a half-verified list being worse than a clearly-
-- scoped one. This seeds a real, curated set: elev8's actual current
-- footprint (Oman, India, Tanzania) plus every country already named in
-- sample data or test fixtures across Export/Import/Investment/B2B
-- throughout this build (Kenya, Tanzania, Saudi Arabia, UAE, China,
-- Turkey, Germany, etc), so nothing here is invented, and extending it
-- to more countries is a new migration, same discipline as the Sector
-- Master and every other master-data table in this project.
--
-- RLS: read-only for every authenticated user, same pattern as
-- sectors and countries. No write policy for the same honest reason as
-- Sector Master -- no Portal Admin / Super Admin role exists yet to
-- correctly gate it against.
--
-- Rollback:
--   drop table if exists public.world_countries;
--   drop table if exists public.world_sub_regions;
--   drop table if exists public.world_regions;

create table public.world_regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0
);

create table public.world_sub_regions (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.world_regions(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  unique (region_id, name)
);

create table public.world_countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  iso2 text unique,
  iso3 text unique,
  region_id uuid not null references public.world_regions(id) on delete restrict,
  sub_region_id uuid references public.world_sub_regions(id) on delete restrict,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

alter table public.world_regions enable row level security;
alter table public.world_sub_regions enable row level security;
alter table public.world_countries enable row level security;

create policy "world_regions_select_any_authenticated"
  on public.world_regions for select
  to authenticated
  using (true);

create policy "world_sub_regions_select_any_authenticated"
  on public.world_sub_regions for select
  to authenticated
  using (true);

create policy "world_countries_select_any_authenticated"
  on public.world_countries for select
  to authenticated
  using (true);

-- Regions
insert into world_regions (name, sort_order) values
  ('Middle East', 10),
  ('Africa', 20),
  ('Asia Pacific', 30),
  ('Europe', 40),
  ('Americas', 50),
  ('South Asia', 60),
  ('Central Asia', 70);

-- Sub-regions -- South Asia and Central Asia deliberately have none.
insert into world_sub_regions (region_id, name, sort_order)
select id, sub.name, sub.sort_order
from world_regions, (values
  ('Middle East', 'GCC', 10),
  ('Middle East', 'Levant', 20),
  ('Middle East', 'Iran & Iraq', 30),
  ('Africa', 'North Africa', 10),
  ('Africa', 'West Africa', 20),
  ('Africa', 'East Africa', 30),
  ('Africa', 'Central Africa', 40),
  ('Africa', 'Southern Africa', 50),
  ('Asia Pacific', 'East Asia', 10),
  ('Asia Pacific', 'Southeast Asia', 20),
  ('Asia Pacific', 'Oceania & Pacific', 30),
  ('Europe', 'Western Europe', 10),
  ('Europe', 'Northern Europe', 20),
  ('Europe', 'Southern Europe', 30),
  ('Europe', 'Eastern Europe', 40),
  ('Americas', 'North America', 10),
  ('Americas', 'Central America & Caribbean', 20),
  ('Americas', 'South America', 30)
) as sub(region_name, name, sort_order)
where world_regions.name = sub.region_name;

-- Countries -- elev8's actual footprint plus every country already
-- named in sample/test data across this build (grepped for real names
-- used in Export/Import/Investment/B2B fixtures, not invented).
insert into world_countries (name, iso2, iso3, region_id, sub_region_id, sort_order)
select c.name, c.iso2, c.iso3, r.id, sr.id, c.sort_order
from (values
  -- Middle East / GCC
  ('Oman', 'OM', 'OMN', 'Middle East', 'GCC', 10),
  ('Saudi Arabia', 'SA', 'SAU', 'Middle East', 'GCC', 20),
  ('United Arab Emirates', 'AE', 'ARE', 'Middle East', 'GCC', 30),
  ('Qatar', 'QA', 'QAT', 'Middle East', 'GCC', 40),
  ('Kuwait', 'KW', 'KWT', 'Middle East', 'GCC', 50),
  ('Bahrain', 'BH', 'BHR', 'Middle East', 'GCC', 60),
  -- Middle East / Levant
  ('Jordan', 'JO', 'JOR', 'Middle East', 'Levant', 10),
  ('Lebanon', 'LB', 'LBN', 'Middle East', 'Levant', 20),
  -- Middle East / Iran & Iraq
  ('Iraq', 'IQ', 'IRQ', 'Middle East', 'Iran & Iraq', 10),
  -- Africa / East Africa
  ('Kenya', 'KE', 'KEN', 'Africa', 'East Africa', 10),
  ('Tanzania', 'TZ', 'TZA', 'Africa', 'East Africa', 20),
  ('Uganda', 'UG', 'UGA', 'Africa', 'East Africa', 30),
  ('Ethiopia', 'ET', 'ETH', 'Africa', 'East Africa', 40),
  -- Africa / North Africa
  ('Egypt', 'EG', 'EGY', 'Africa', 'North Africa', 10),
  ('Libya', 'LY', 'LBY', 'Africa', 'North Africa', 20),
  -- Africa / West Africa
  ('Nigeria', 'NG', 'NGA', 'Africa', 'West Africa', 10),
  ('Ghana', 'GH', 'GHA', 'Africa', 'West Africa', 20),
  -- Africa / Southern Africa
  ('South Africa', 'ZA', 'ZAF', 'Africa', 'Southern Africa', 10),
  -- Asia Pacific / East Asia
  ('China', 'CN', 'CHN', 'Asia Pacific', 'East Asia', 10),
  ('Japan', 'JP', 'JPN', 'Asia Pacific', 'East Asia', 20),
  ('South Korea', 'KR', 'KOR', 'Asia Pacific', 'East Asia', 30),
  -- Asia Pacific / Southeast Asia
  ('Singapore', 'SG', 'SGP', 'Asia Pacific', 'Southeast Asia', 10),
  ('Malaysia', 'MY', 'MYS', 'Asia Pacific', 'Southeast Asia', 20),
  ('Vietnam', 'VN', 'VNM', 'Asia Pacific', 'Southeast Asia', 30),
  ('Thailand', 'TH', 'THA', 'Asia Pacific', 'Southeast Asia', 40),
  -- Asia Pacific / Oceania
  ('Australia', 'AU', 'AUS', 'Asia Pacific', 'Oceania & Pacific', 10),
  -- Europe / Western Europe
  ('Germany', 'DE', 'DEU', 'Europe', 'Western Europe', 10),
  ('France', 'FR', 'FRA', 'Europe', 'Western Europe', 20),
  ('Netherlands', 'NL', 'NLD', 'Europe', 'Western Europe', 30),
  -- Europe / Northern Europe
  ('United Kingdom', 'GB', 'GBR', 'Europe', 'Northern Europe', 10),
  -- Europe / Southern Europe
  ('Italy', 'IT', 'ITA', 'Europe', 'Southern Europe', 10),
  ('Spain', 'ES', 'ESP', 'Europe', 'Southern Europe', 20),
  -- Europe / Eastern Europe
  ('Turkey', 'TR', 'TUR', 'Europe', 'Eastern Europe', 10),
  -- Americas / North America
  ('United States', 'US', 'USA', 'Americas', 'North America', 10),
  ('Canada', 'CA', 'CAN', 'Americas', 'North America', 20),
  -- Americas / South America
  ('Brazil', 'BR', 'BRA', 'Americas', 'South America', 10),
  -- South Asia (no sub-region)
  ('India', 'IN', 'IND', 'South Asia', null, 10),
  ('Pakistan', 'PK', 'PAK', 'South Asia', null, 20),
  ('Bangladesh', 'BD', 'BGD', 'South Asia', null, 30),
  ('Sri Lanka', 'LK', 'LKA', 'South Asia', null, 40),
  -- Central Asia (no sub-region)
  ('Kazakhstan', 'KZ', 'KAZ', 'Central Asia', null, 10),
  ('Uzbekistan', 'UZ', 'UZB', 'Central Asia', null, 20)
) as c(name, iso2, iso3, region_name, sub_region_name, sort_order)
join world_regions r on r.name = c.region_name
left join world_sub_regions sr on sr.region_id = r.id and sr.name = c.sub_region_name;
