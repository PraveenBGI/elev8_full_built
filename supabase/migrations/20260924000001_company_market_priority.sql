-- Company Configuration -- Enterprise Configuration step 5: Target
-- Market Priority. Fifth of 7 (Business Identity, Role, Trade Intent,
-- Geography & Corridors already built).
--
-- Genuinely simple by design: this step has no data of its own beyond a
-- priority ranking. It reuses Geography & Corridors' own home_country_id/
-- corridor_country_ids (which countries to rank) and corridor_states
-- (which countries get a state-level sub-ranking too) rather than
-- asking the same question twice, exactly like the mockup's own
-- comment: "Reuses that selection rather than asking again."
--
-- Keyed by country UUID (as a jsonb object key, i.e. a string), not the
-- mockup's own 2-letter country codes -- consistent with how Geography's
-- own corridor_states is already keyed by this schema's real country
-- ids, not the mockup's CNAMES codes.
--
-- Rollback:
--   alter table public.companies drop column if exists market_priority;
--   alter table public.companies drop column if exists state_priority;

alter table public.companies
  add column market_priority jsonb not null default '{}',
  add column state_priority jsonb not null default '{}';
