-- Company Configuration -- Procurement Pillar, second of 8 per-pillar
-- preference sub-groups. Three sub-pages: RFQ/RFx Preferences, Tender
-- Preferences, Contract Interests.
--
-- Three jsonb columns, one per sub-page, same reasoning as every other
-- sub-group so far: each is always read/written together as one unit.
--
-- "Live RFQ Matches" in the mockup's own RFQ Preferences page is
-- hardcoded illustrative sample data (three fixed example RFQs with no
-- S.field backing them at all) -- deliberately NOT reproduced here,
-- same principle as Governance's "Documents Held on File": presenting
-- fabricated live matches as real would be actively misleading, not
-- just an incomplete feature.
--
-- Rollback:
--   alter table public.companies drop column if exists procurement_rfq_prefs;
--   alter table public.companies drop column if exists procurement_tender_prefs;
--   alter table public.companies drop column if exists procurement_contract_prefs;

alter table public.companies
  add column procurement_rfq_prefs jsonb not null default '{}',
  add column procurement_tender_prefs jsonb not null default '{}',
  add column procurement_contract_prefs jsonb not null default '{}';
