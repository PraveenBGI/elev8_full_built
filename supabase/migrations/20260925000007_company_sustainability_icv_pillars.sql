-- Company Configuration -- Sustainability Pillar (seventh) and ICV
-- Pillar (eighth and LAST), built together because the mockup's own
-- source shares one reusable renderer (renderPillarSubPage) and one
-- shared save/validate function (saveDeepPillarStep) across all 7
-- sub-pages of both pillars -- confirmed identical shape, not an
-- assumption.
--
-- One jsonb column per pillar (sustainability_deep, icv_deep) rather
-- than one column per sub-page, because the mockup itself stores all
-- of a pillar's sub-pages in ONE state object (S.sustainabilityDeep,
-- S.icvDeep) with each sub-page writing to its own key within it, not
-- separate objects. Each sub-page's own Server Action does a
-- read-merge-write against just its own key, reproducing the mockup's
-- per-page save functions without needing separate columns.
--
-- Sustainability: 3 sub-pages (sustainability_prefs, esg_ghg,
-- green_cert), only the LAST carries a priority selector
-- (SUS_ICV_PRIORITY_LEVELS: high/interested/not_now) -- this is a
-- single priority value per pillar, not per sub-page, matching the
-- mockup's own state.priority being one field on the whole deep object.
-- esg_ghg also carries three optional baseline booleans (do you
-- currently measure Scope 1/2/3) distinct from what's selected as a
-- match preference above them.
--
-- ICV: 4 sub-pages (icv_prefs, icv_local_content, icv_workforce,
-- icv_certification), same priority-on-last-page pattern.
-- icv_certification also carries an optional numeric baseline (current
-- ICV score, current local procurement %).
--
-- Rollback:
--   alter table public.companies drop column if exists sustainability_deep;
--   alter table public.companies drop column if exists icv_deep;

alter table public.companies
  add column sustainability_deep jsonb not null default '{}',
  add column icv_deep jsonb not null default '{}';
