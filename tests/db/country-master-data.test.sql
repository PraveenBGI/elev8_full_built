-- Phase 0.5 -- Country Master Data (HS Code Coverage) integration test.
--
-- Uses its own UUID prefix range (eeeeeeee.../999...) distinct from the
-- other tests/db/*.test.sql files, since CI runs them sequentially
-- against the same database (see .github/workflows/ci.yml).

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('99999999-9999-9999-9999-999999999999', 'hs-country-admin@test.com'),
  ('88888888-1111-1111-1111-111111111111', 'hs-other-admin@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('eeeeeeee-0000-0000-0000-000000000001', 'HS Testland', 'USD', 'draft');

insert into countries (id, name, master_currency, approval_status)
values ('eeeeeeee-0000-0000-0000-000000000002', 'HS Otherland', 'EUR', 'draft');

insert into config_admin_roles (user_id, role, country_id) values
  ('99999999-9999-9999-9999-999999999999', 'country_admin', 'eeeeeeee-0000-0000-0000-000000000001'),
  ('88888888-1111-1111-1111-111111111111', 'country_admin', 'eeeeeeee-0000-0000-0000-000000000002');

set role authenticated;
set request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

do $$
begin
  insert into country_hs_codes (country_id, code, description, category)
  values ('eeeeeeee-0000-0000-0000-000000000001', '8501.10', 'Electric motors', 'Electronics & ICT');
  raise notice 'PASS: Country Admin created an HS code in their own country';
end $$;

-- A different country's admin cannot write into this one.
set request.jwt.claim.sub = '88888888-1111-1111-1111-111111111111';

do $$
begin
  begin
    insert into country_hs_codes (country_id, code, description, category)
    values ('eeeeeeee-0000-0000-0000-000000000001', '8501.20', 'Should not be allowed', 'Electronics & ICT');
    raise exception 'FAIL: a different country''s admin was able to write HS codes into another country';
  exception
    when insufficient_privilege then
      raise notice 'PASS: cross-country HS code write correctly rejected';
  end;
end $$;

-- But broad SELECT is allowed (matches country_ftas' reasoning: Import/
-- Export pillars and company-facing forms all need to read this).
do $$
declare v_count int;
begin
  select count(*) into v_count from country_hs_codes
  where country_id = 'eeeeeeee-0000-0000-0000-000000000001';
  if v_count != 1 then
    raise exception 'FAIL: expected 1 visible HS code from another admin''s session, got %', v_count;
  end if;
  raise notice 'PASS: HS codes are readable across admin scopes (broad SELECT, as designed)';
end $$;

reset role;

-- hs_chapter_id (20260930000004) -- optional link to the global HS
-- Code Chapters master, nullable, never required. Uses its own
-- throwaway chapter row ('ZZ'), never one of the 19 real seeded
-- chapters -- global-master-data.test.sql asserts an exact minimum
-- count against that seed data, and this file runs before it in the
-- CI sequence (see .github/workflows/ci.yml); deleting a real seeded
-- chapter here to test ON DELETE SET NULL would silently break that
-- later, unrelated assertion. Confirmed as a real failure, not a
-- hypothetical one, while first writing this test -- caught by running
-- the full tests/db/*.sql sequence together before trusting this file
-- passing in isolation was enough.
do $$
declare v_chapter_id uuid;
begin
  insert into hs_code_chapters (chapter, description, section)
  values ('ZZ', 'Test-only throwaway chapter', 'Test Section')
  returning id into v_chapter_id;

  update country_hs_codes
  set hs_chapter_id = v_chapter_id
  where country_id = 'eeeeeeee-0000-0000-0000-000000000001' and code = '8501.10';

  if not exists (
    select 1 from country_hs_codes
    where code = '8501.10' and hs_chapter_id = v_chapter_id
  ) then
    raise exception 'FAIL: could not link a country HS code to a global chapter';
  end if;
  raise notice 'PASS: a country HS code can be optionally linked to a global HS chapter';
end $$;

-- Deleting the chapter must only null out the link, never delete the
-- country's own HS code entry -- the migration's own stated intent,
-- verified rather than assumed.
do $$
declare v_chapter_id uuid;
declare v_remaining_count int;
begin
  select id into v_chapter_id from hs_code_chapters where chapter = 'ZZ';
  delete from hs_code_chapters where id = v_chapter_id;

  select count(*) into v_remaining_count
  from country_hs_codes
  where code = '8501.10' and hs_chapter_id is null;

  if v_remaining_count != 1 then
    raise exception 'FAIL: deleting a global HS chapter should set hs_chapter_id to null, not delete the country HS code row';
  end if;
  raise notice 'PASS: deleting a global HS chapter only nulls the link (ON DELETE SET NULL), the country HS code entry survives';
end $$;

reset role;

-- ── country_ftas' fixed shape (20260920000001) ──────────────────────────
-- Confirms the ALTER actually produced the right constraints, not just
-- that the migration ran without SQL errors.

set role authenticated;
set request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

do $$
begin
  insert into country_ftas (
    country_id, agreement_name, type, status,
    partner_countries, preferential_tariff_rate, rules_of_origin, effective_date
  )
  values (
    'eeeeeeee-0000-0000-0000-000000000001',
    'GCC-India CEPA', 'Comprehensive Economic Partnership Agreement', 'In Force',
    array['India'], 7.5, 'Wholly obtained or substantially transformed', '2026-01-01'
  );
  raise notice 'PASS: FTA with multiple real fields (type, status, partner_countries array) inserted successfully';
end $$;

do $$
begin
  begin
    insert into country_ftas (country_id, agreement_name, status)
    values ('eeeeeeee-0000-0000-0000-000000000001', 'Bad Status Test', 'Not A Real Status');
    raise exception 'FAIL: an invalid status value was accepted';
  exception
    when check_violation then
      raise notice 'PASS: invalid FTA status correctly rejected by the check constraint';
  end;
end $$;

-- ── country_hs_code_packs (20260920000002) ──────────────────────────────

do $$
begin
  insert into country_hs_code_packs (country_id, name, description, codes)
  values (
    'eeeeeeee-0000-0000-0000-000000000001',
    'Electronics Bundle', 'Common electronics codes for quick apply',
    array['8501.10']
  );
  raise notice 'PASS: HS code pack created successfully';
end $$;

set request.jwt.claim.sub = '88888888-1111-1111-1111-111111111111';

do $$
begin
  begin
    insert into country_hs_code_packs (country_id, name, codes)
    values ('eeeeeeee-0000-0000-0000-000000000001', 'Should not be allowed', '{}');
    raise exception 'FAIL: a different country''s admin created a pack in another country';
  exception
    when insufficient_privilege then
      raise notice 'PASS: cross-country HS code pack write correctly rejected';
  end;
end $$;

reset role;

-- ── country_zones / country_ports_airports (20260920000003) ────────────

set role authenticated;
set request.jwt.claim.sub = '99999999-9999-9999-9999-999999999999';

do $$
begin
  insert into country_zones (country_id, name, type, location, sector, incentives)
  values (
    'eeeeeeee-0000-0000-0000-000000000001',
    'Salalah Free Zone', 'Free Zone', 'Salalah', 'Logistics', '100% foreign ownership, tax holiday'
  );
  raise notice 'PASS: zone created successfully';
end $$;

do $$
begin
  begin
    insert into country_zones (country_id, name, type)
    values ('eeeeeeee-0000-0000-0000-000000000001', 'Bad Type Zone', 'Not A Real Type');
    raise exception 'FAIL: an invalid zone type was accepted';
  exception
    when check_violation then
      raise notice 'PASS: invalid zone type correctly rejected by the check constraint';
  end;
end $$;

do $$
begin
  insert into country_ports_airports (country_id, name, type, location, is_customs_point)
  values ('eeeeeeee-0000-0000-0000-000000000001', 'Port Sultan Qaboos', 'Sea Port', 'Muscat', true);
  raise notice 'PASS: port/airport created successfully';
end $$;

set request.jwt.claim.sub = '88888888-1111-1111-1111-111111111111';

do $$
begin
  begin
    insert into country_zones (country_id, name, type)
    values ('eeeeeeee-0000-0000-0000-000000000001', 'Cross-country zone', 'Free Zone');
    raise exception 'FAIL: a different country''s admin created a zone in another country';
  exception
    when insufficient_privilege then
      raise notice 'PASS: cross-country zone write correctly rejected';
  end;
end $$;

reset role;

\echo 'ALL COUNTRY MASTER DATA TESTS PASSED'
