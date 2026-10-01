-- Global HS Code Chapters -- fourth slice of Phase 1 (Master Data),
-- directly resolving an open question flagged early in this build
-- (05-PROGRESS-TRACKER.md's own open-questions list: "country_hs_codes
-- reconciliation with global HS master") and named explicitly in the
-- Portal Admin's Products & Services Masters panel in the legacy
-- architecture diagrams (UNSPSC, HS Code, AVME, CPV).
--
-- Scoped to CHAPTER level (the 2-digit chapter, e.g. '27' = Mineral
-- fuels, mineral oils; '84' = Machinery and mechanical appliances) --
-- deliberately NOT the full 6-digit subheading nomenclature. This is a
-- different kind of scoping decision than Sector/World Region/Style of
-- Incorporation: those are reasonably approximated from general
-- knowledge, but the Harmonized System is a real, precise international
-- customs standard maintained by the World Customs Organization, and
-- this sandbox has no live verification access to confirm exact current
-- 6-digit subheading text against the authoritative nomenclature.
-- Chapter-level codes and titles are stable, extremely well-established
-- reference facts (last structurally revised 2022, chapter numbers and
-- titles essentially unchanged for decades) where confidence is
-- genuinely high -- precise subheading-level detail is not, and
-- presenting invented-but-plausible 6-digit codes as if verified would
-- be a real integrity problem for something companies may use for
-- actual customs/compliance purposes, not just a convenience gap like
-- an incomplete country list.
--
-- This does NOT retrofit country_hs_codes (the existing per-country
-- table, free-text code/description/category with no link to any
-- standard) to reference this table -- that reconciliation is real,
-- separate follow-on work: deciding whether country_hs_codes.code
-- should become a foreign key here, stay free text with a soft
-- validation lookup, or something else, is a genuine design decision,
-- not something to retrofit silently inside a Master Data migration.
--
-- RLS and seed-growth discipline identical to every other global Master
-- Data table so far: read-open to any authenticated user, no write
-- policy yet (no Portal Admin / Super Admin role exists to gate one
-- against).
--
-- Rollback:
--   drop table if exists public.hs_code_chapters;

create table public.hs_code_chapters (
  id uuid primary key default gen_random_uuid(),
  chapter text not null unique,
  description text not null,
  section text not null,
  sort_order integer not null default 0
);

alter table public.hs_code_chapters enable row level security;

create policy "hs_code_chapters_select_any_authenticated"
  on public.hs_code_chapters for select
  to authenticated
  using (true);

-- Seed: chapters covering the sectors/products already referenced
-- throughout this build's own sample data and fixtures (oil & gas,
-- solar/renewable energy, agriculture, textiles, machinery,
-- electronics, metals) plus the chapters needed to make each covered
-- section coherent, not an attempt at all 97 chapters.
insert into public.hs_code_chapters (chapter, description, section, sort_order) values
  ('01', 'Live animals', 'Live Animals; Animal Products', 10),
  ('02', 'Meat and edible meat offal', 'Live Animals; Animal Products', 20),
  ('10', 'Cereals', 'Vegetable Products', 100),
  ('12', 'Oil seeds and oleaginous fruits', 'Vegetable Products', 120),
  ('27', 'Mineral fuels, mineral oils and products of their distillation', 'Mineral Products', 270),
  ('28', 'Inorganic chemicals', 'Products of the Chemical Industries', 280),
  ('39', 'Plastics and articles thereof', 'Plastics and Rubber', 390),
  ('50', 'Silk', 'Textiles and Textile Articles', 500),
  ('52', 'Cotton', 'Textiles and Textile Articles', 520),
  ('61', 'Articles of apparel, knitted or crocheted', 'Textiles and Textile Articles', 610),
  ('62', 'Articles of apparel, not knitted or crocheted', 'Textiles and Textile Articles', 620),
  ('72', 'Iron and steel', 'Base Metals', 720),
  ('73', 'Articles of iron or steel', 'Base Metals', 730),
  ('76', 'Aluminium and articles thereof', 'Base Metals', 760),
  ('84', 'Nuclear reactors, boilers, machinery and mechanical appliances', 'Machinery and Mechanical Appliances', 840),
  ('85', 'Electrical machinery and equipment, sound/TV recorders, parts', 'Machinery and Mechanical Appliances', 850),
  ('87', 'Vehicles other than railway or tramway rolling stock', 'Vehicles, Aircraft, Vessels', 870),
  ('90', 'Optical, photographic, measuring, medical instruments', 'Optical and Precision Instruments', 900),
  ('94', 'Furniture, bedding, lamps, prefabricated buildings', 'Miscellaneous Manufactured Articles', 940);
