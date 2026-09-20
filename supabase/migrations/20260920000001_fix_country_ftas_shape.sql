-- Phase 0.5 -- fix country_ftas' actual shape to match the mockup.
--
-- The foundation migration's country_ftas table was written before this
-- session read elev8-country-admin-config_3.html's actual Free Trade
-- Agreements section field-by-field. Real fields: name, type, status,
-- MULTIPLE partner countries per agreement (not one), a preferential
-- tariff rate, rules of origin text, and an effective date. The
-- original table had a single partner_country and a vague
-- tariff_schedule jsonb instead.
--
-- Per 04-BUILD-STANDARDS.md sec 2, the merged migration is never edited
-- -- fixed forward here instead. Safe to do as a straight ALTER (not a
-- drop/recreate) because no UI has ever written to this table -- it's
-- had schema since the very first Phase 0.5 migration but zero real
-- rows, confirmed before writing this.
--
-- Rollback:
--   alter table public.country_ftas drop constraint if exists country_ftas_type_check;
--   alter table public.country_ftas drop constraint if exists country_ftas_status_check;
--   alter table public.country_ftas drop column if exists type;
--   alter table public.country_ftas drop column if exists status;
--   alter table public.country_ftas drop column if exists preferential_tariff_rate;
--   alter table public.country_ftas drop column if exists rules_of_origin;
--   alter table public.country_ftas add column partner_country text;
--   update public.country_ftas set partner_country = partner_countries[1];
--   alter table public.country_ftas drop column partner_countries;

alter table public.country_ftas add column partner_countries text[] not null default '{}';
update public.country_ftas set partner_countries = array[partner_country] where partner_country is not null;
alter table public.country_ftas drop column partner_country;

alter table public.country_ftas add column type text;
alter table public.country_ftas add column status text not null default 'Under Negotiation';
alter table public.country_ftas add column preferential_tariff_rate numeric;
alter table public.country_ftas add column rules_of_origin text;

alter table public.country_ftas add constraint country_ftas_type_check
  check (
    type is null or type in (
      'Customs Union',
      'Free Trade Agreement',
      'Preferential Trade Agreement',
      'Economic Partnership Agreement',
      'Comprehensive Economic Partnership Agreement'
    )
  );

-- "Signed, Not Yet Ratified" replaces the mockup's own "Signed — Not Yet
-- Ratified" -- the em dash is dropped per this project's UI style rule,
-- applied to stored option values too so the value round-trips cleanly
-- with what the UI ever actually sends, not just the display label.
alter table public.country_ftas add constraint country_ftas_status_check
  check (
    status in (
      'In Force',
      'Signed, Not Yet Ratified',
      'Under Negotiation',
      'Suspended',
      'Expired'
    )
  );
