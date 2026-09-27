-- Company Configuration -- Enterprise Configuration step 7: Commercial
-- Terms. The LAST of 7 Enterprise Configuration steps (Business
-- Identity, Role, Trade Intent, Geography & Corridors, Target Market
-- Priority, Business Objectives already built).
--
-- One jsonb column rather than ~9 separate columns -- these fields are
-- always read/written together as one coherent "commercial preferences"
-- unit (matching the mockup's own S.commercial sub-object), never
-- queried individually elsewhere, so there's no reason to flatten them
-- into the companies table's own column list the way Identity's fields
-- were. incotermsPreferred/incotermsAccepted are stored inside this same
-- jsonb blob too, even though the mockup keeps them as siblings of
-- S.commercial rather than inside it (S.incotermsPreferred, not
-- S.commercial.incotermsPreferred) -- a minor reshaping for a cleaner
-- single column, not a behavior change.
--
-- Rollback: alter table public.companies drop column if exists commercial_terms;

alter table public.companies add column commercial_terms jsonb not null default '{}';
