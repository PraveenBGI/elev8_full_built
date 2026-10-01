-- country_hs_codes <-> hs_code_chapters reconciliation -- the follow-on
-- work the previous migration (20260930000003_global_hs_code_chapters.sql)
-- deliberately deferred rather than guess at inside that migration.
--
-- Adds an OPTIONAL link, not a replacement: country_hs_codes.category
-- (the existing HS_CATEGORIES enum: "Energy & Petrochemicals",
-- "Industrial & Manufacturing", etc) is elev8's own business-facing
-- categorization and stays exactly as it is -- it serves a genuinely
-- different purpose than the Harmonized System's own chapter structure
-- and isn't being replaced. hs_chapter_id lets a Country Admin
-- additionally tag their country-specific code (which may be a
-- national 8-10 digit tariff line, not a bare 6-digit HS code) with
-- which real international chapter it falls under, when they know it
-- and want to -- nullable, never required, since forcing a match here
-- would pressure admins into guessing a chapter rather than leaving it
-- genuinely unknown.
--
-- on delete set null, not cascade: a chapter being removed from the
-- global master (unlikely, but the rollback path exists) should never
-- silently delete a country's own HS code entry -- only the link.
--
-- Rollback:
--   alter table public.country_hs_codes drop column if exists hs_chapter_id;

alter table public.country_hs_codes
  add column hs_chapter_id uuid references public.hs_code_chapters(id) on delete set null;
