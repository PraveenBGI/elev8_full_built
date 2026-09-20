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

\echo 'ALL COUNTRY MASTER DATA TESTS PASSED'
