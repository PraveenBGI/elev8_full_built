-- Company Configuration -- Import Pillar, fourth of 8 per-pillar
-- preference sub-groups. Four sub-pages: Products & Services, Trade
-- Corridors, Logistics Preferences, Import Preferences.
--
-- import_products reuses B2B's own "source" item shape exactly (cat,
-- name, hs, price, lead, src, budget, timeline) -- it's the identical
-- concept (products I want to buy/import), not a coincidence.
--
-- import_corridors is the richest structure yet: each corridor carries
-- origin/destination, Incoterm, port route, products, customs duty %,
-- freight cost, transit time, demand and risk ratings, plus its own
-- budget band and target timeline. This is exactly the data
-- Governance's Risk Intelligence page (built earlier this build-out)
-- needs but has none of yet -- once a company adds corridors here,
-- that page's empty state ("Add trade corridors to see risk ratings")
-- has real data to work with, though wiring that read is not done in
-- this migration.
--
-- Rollback:
--   alter table public.companies drop column if exists import_products;
--   alter table public.companies drop column if exists import_corridors;
--   alter table public.companies drop column if exists import_logistics;
--   alter table public.companies drop column if exists import_countries;
--   alter table public.companies drop column if exists import_req;

alter table public.companies
  add column import_products jsonb not null default '[]',
  add column import_corridors jsonb not null default '[]',
  add column import_logistics jsonb not null default '{}',
  add column import_countries text[] not null default '{}',
  add column import_req jsonb not null default '{}';
