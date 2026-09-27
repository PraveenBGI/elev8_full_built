-- Company Configuration -- Enterprise Configuration step 6: Business
-- Objectives (Goals). Sixth of 7 (Business Identity, Role, Trade
-- Intent, Geography & Corridors, Target Market Priority already built).
--
-- The mockup's own "top 3 priorities" framing is guidance text, not a
-- hard technical limit -- its own save gate only requires at least 1
-- selected (disabled only when goals.length === 0), no upper bound
-- enforced anywhere. This migration and its schema deliberately don't
-- invent a stricter max-3 constraint the mockup itself doesn't have.
--
-- This is also the field that will matter most once Pillar Selection is
-- built: GOAL_PILLAR_MAP (already documented in
-- docs/modules/company-config/README.md) reads a company's goals
-- directly to help recommend which of the 8 pillars are relevant to
-- them.
--
-- Rollback: alter table public.companies drop column if exists goals;

alter table public.companies add column goals text[] not null default '{}';
