-- Phase 0.5 -- Country Master Data: Economic & Industrial Zones, and
-- Ports/Airports & Customs Points.
--
-- Source: elev8-country-admin-config_3.html's own two sections. Zones
-- are "Referenced by Investment's Special Economic Zones / Free Zones
-- picker" (the mockup's own note); Ports/Airports are "Referenced by
-- Import's Customs Entry Points picker and Export's per-corridor
-- logistics gateway."
--
-- Both normalized as real tables (not jsonb), same reasoning as every
-- other Master Data list built so far: Investment, Import, and Export
-- will all query these relationally once those pillars exist.
--
-- Rollback:
--   drop table if exists public.country_ports_airports;
--   drop table if exists public.country_zones;

create table public.country_zones (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  type text not null,
  location text,
  sector text,
  incentives text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint country_zones_type_check check (
    type in ('Special Economic Zone', 'Free Zone', 'Industrial Zone', 'Free Trade Zone')
  )
);

create index on public.country_zones (country_id);

alter table public.country_zones enable row level security;

create policy "country_zones_select_any_authenticated"
  on public.country_zones for select
  to authenticated
  using (true);

create policy "country_zones_write_country_admin_only"
  on public.country_zones for all
  to authenticated
  using (is_country_admin(country_id))
  with check (is_country_admin(country_id));

create table public.country_ports_airports (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  type text not null,
  location text,
  is_customs_point boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint country_ports_airports_type_check check (
    type in ('Sea Port', 'Airport', 'Land Border', 'Dry Port')
  )
);

create index on public.country_ports_airports (country_id);

alter table public.country_ports_airports enable row level security;

create policy "country_ports_airports_select_any_authenticated"
  on public.country_ports_airports for select
  to authenticated
  using (true);

create policy "country_ports_airports_write_country_admin_only"
  on public.country_ports_airports for all
  to authenticated
  using (is_country_admin(country_id))
  with check (is_country_admin(country_id));
