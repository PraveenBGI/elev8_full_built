-- Company Configuration -- B2B Pillar, third of 8 per-pillar preference
-- sub-groups. Three sub-pages: Products & Services, Target Buyers,
-- Target Suppliers.
--
-- b2b_products holds two dynamic arrays (sell, source) in one jsonb
-- column -- they're always rendered and edited together on one page.
-- buyer_target/buyer_segments and supplier_target/supplier_filters are
-- their own columns since they're genuinely separate pages with their
-- own conditional visibility: Target Buyers only shown when the
-- company has at least one sell intent (sell_intents, already captured
-- in Trade Intent), Target Suppliers only shown with at least one buy
-- intent -- reproducing the mockup's own hideIf logic using this
-- schema's own real fields rather than inventing a parallel flag.
--
-- "Sample Matched Buyers"/"Sample Matched Suppliers" in the mockup are
-- hardcoded illustrative rows with no backing field -- not reproduced,
-- same principle as every other fake "live match" section skipped so
-- far (Governance's documents, Procurement's RFQ matches).
--
-- Rollback:
--   alter table public.companies drop column if exists b2b_products;
--   alter table public.companies drop column if exists buyer_target;
--   alter table public.companies drop column if exists buyer_segments;
--   alter table public.companies drop column if exists supplier_target;
--   alter table public.companies drop column if exists supplier_filters;

alter table public.companies
  add column b2b_products jsonb not null default '{"sell": [], "source": []}',
  add column buyer_target jsonb not null default '{}',
  add column buyer_segments text[] not null default '{}',
  add column supplier_target jsonb not null default '{}',
  add column supplier_filters text[] not null default '{}';
