-- Company Configuration -- Export Pillar, fifth of 8 per-pillar
-- preference sub-groups. Four sub-pages: Products & Services, Trade
-- Corridors, Logistics Preferences, Export Preferences.
--
-- export_products reuses B2B's own "sell" item shape exactly, same
-- reasoning as Import reusing the "source" shape. export_corridors
-- reuses Import's own corridor shape exactly (origin/destination/
-- Incoterm/port/products/duty/freight/transit/demand/risk/budget/
-- timeline) -- confirmed identical in the mockup's own source, right
-- down to allCorridors() merging S.importCorridors and S.exportCorridors
-- into one combined list for Risk Intelligence, Landed Cost, Corridor
-- Comparison and global search. export_logistics reuses Import's own
-- logistics shape exactly too.
--
-- export_countries is genuinely different from Import's flat
-- requirement object: Export Preferences tracks per-country priority
-- tier (reusing MARKET_TIERS, the same enum Target Market Priority
-- already uses at the company level), plus a per-country budget and
-- timeline -- three separate jsonb maps keyed by country name, not one
-- flat object, because each export market gets its own independent
-- values.
--
-- Rollback:
--   alter table public.companies drop column if exists export_products;
--   alter table public.companies drop column if exists export_corridors;
--   alter table public.companies drop column if exists export_logistics;
--   alter table public.companies drop column if exists export_countries;
--   alter table public.companies drop column if exists export_tier;
--   alter table public.companies drop column if exists export_budget;
--   alter table public.companies drop column if exists export_timeline;

alter table public.companies
  add column export_products jsonb not null default '[]',
  add column export_corridors jsonb not null default '[]',
  add column export_logistics jsonb not null default '{}',
  add column export_countries text[] not null default '{}',
  add column export_tier jsonb not null default '{}',
  add column export_budget jsonb not null default '{}',
  add column export_timeline jsonb not null default '{}';
