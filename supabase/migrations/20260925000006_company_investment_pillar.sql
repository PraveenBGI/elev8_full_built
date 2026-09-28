-- Company Configuration -- Investment Pillar, sixth of 8 per-pillar
-- preference sub-groups. Four sub-pages: Investment Preferences,
-- Landed Cost & Margin Calculator, Corridor Comparison, Trade Finance
-- & Payments.
--
-- Investment Preferences mirrors Export Preferences' per-country
-- table shape (reusing MARKET_TIERS) plus its own deal-structure
-- object (investment type, ownership preference, sector focus, budget,
-- timeline).
--
-- Landed Cost is a genuine live calculator: cost/qty/freight/insurance%/
-- duty%/tax%/port/banking/selling-price inputs, with landed cost, total
-- landed, gross profit and margin % computed and shown live as the
-- user types -- reproduced client-side exactly (goods -> insurance ->
-- CIF -> duty -> tax -> landed total -> profit -> margin), not
-- server-computed, since it's pure arithmetic with no reason to round
-- trip. Only the inputs are persisted, not the computed outputs (which
-- are always derived, never stored, avoiding the classic bug of a
-- stored calculation drifting from its own formula).
--
-- Corridor Comparison has genuinely no persisted data of its own -- it
-- compares two of the company's REAL corridors (import_corridors +
-- export_corridors combined, mirroring the mockup's own allCorridors())
-- entirely client-side. Same honest pattern as Governance's Risk
-- Intelligence: just an acknowledgment boolean.
--
-- Trade Finance: financeInstruments is the one real field (a chip
-- picker). 'Upcoming Exposure' and 'Payment & Receivables Monitoring'
-- in the mockup are hardcoded illustrative sample data with zero
-- backing fields -- not reproduced, same principle applied throughout
-- this build (Governance's documents, Procurement's RFQ matches, B2B's
-- sample matched buyers/suppliers).
--
-- Rollback:
--   alter table public.companies drop column if exists investment_countries;
--   alter table public.companies drop column if exists investment_tier;
--   alter table public.companies drop column if exists investment_budget;
--   alter table public.companies drop column if exists investment_timeline;
--   alter table public.companies drop column if exists investment_req;
--   alter table public.companies drop column if exists landed_cost;
--   alter table public.companies drop column if exists corridor_compare_reviewed;
--   alter table public.companies drop column if exists finance_instruments;

alter table public.companies
  add column investment_countries text[] not null default '{}',
  add column investment_tier jsonb not null default '{}',
  add column investment_budget jsonb not null default '{}',
  add column investment_timeline jsonb not null default '{}',
  add column investment_req jsonb not null default '{}',
  add column landed_cost jsonb not null default '{}',
  add column corridor_compare_reviewed boolean not null default false,
  add column finance_instruments text[] not null default '{}';
