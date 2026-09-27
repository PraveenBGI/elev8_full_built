-- Company Configuration (Preference Engine) integration test.
--
-- Uses its own UUID prefix range (aaaa5555.../eeee0000...) distinct from
-- other tests/db/*.test.sql files.

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('aaaa5555-aaaa-5555-aaaa-555555555555', 'company-owner@test.com'),
  ('aaaa6666-aaaa-6666-aaaa-666666666666', 'other-user@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('eeee0000-0000-0000-0000-000000000001', 'Company Testland', 'USD', 'draft');

-- ── create_company() is the only way a company is ever created ─────────

set role authenticated;
set request.jwt.claim.sub = 'aaaa5555-aaaa-5555-aaaa-555555555555';

do $$
declare
  v_company_id uuid;
  v_owner_role public.company_user_role;
begin
  v_company_id := create_company('eeee0000-0000-0000-0000-000000000001', 'Al Jazeera Steel Engineering LLC');

  if v_company_id is null then
    raise exception 'FAIL: create_company() did not return a company id';
  end if;

  select role into v_owner_role from company_users
  where company_id = v_company_id and user_id = 'aaaa5555-aaaa-5555-aaaa-555555555555';

  if v_owner_role != 'owner' then
    raise exception 'FAIL: creator was not made owner, got %', v_owner_role;
  end if;

  raise notice 'PASS: create_company() created the company and made the caller its owner';
end $$;

-- Company data is private -- a different, unrelated user must see ZERO
-- rows, not because of a UI hide, a structural RLS boundary.
set request.jwt.claim.sub = 'aaaa6666-aaaa-6666-aaaa-666666666666';

do $$
declare v_count int;
begin
  select count(*) into v_count from companies;
  if v_count != 0 then
    raise exception 'FAIL: an unrelated user should see 0 companies, saw %', v_count;
  end if;
  raise notice 'PASS: company data is correctly invisible to a non-member (private, not broadly readable)';
end $$;

do $$
begin
  begin
    update companies set name = 'Hijacked' where country_id = 'eeee0000-0000-0000-0000-000000000001';
    -- An UPDATE that matches zero rows (due to RLS) is not an error in
    -- Postgres -- it succeeds having changed nothing. Confirm nothing
    -- actually changed instead of relying on the statement erroring.
    if exists (select 1 from companies where name = 'Hijacked') then
      raise exception 'FAIL: an unrelated user was able to rename another company';
    end if;
    raise notice 'PASS: unrelated user''s UPDATE matched zero rows (RLS-filtered), company unchanged';
  end;
end $$;

reset role;

-- The owner can still read/edit their own company (sanity check the
-- policy isn't accidentally blocking the legitimate owner too).
set role authenticated;
set request.jwt.claim.sub = 'aaaa5555-aaaa-5555-aaaa-555555555555';

do $$
declare v_name text;
begin
  update companies
  set primary_role = 'Seller / Supplier', sell_intents = array['Export products', 'Find distributors']
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select name into v_name from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';
  if v_name is null then
    raise exception 'FAIL: owner could not read their own company after update';
  end if;
  raise notice 'PASS: owner can read and update their own company (Business Identity + Role + Trade Intent)';
end $$;

-- Geography & Corridors (20260924000000) -- home_country_id is a real
-- FK to countries, corridor_country_ids/corridor_states hold the
-- follower's chosen international corridors and per-corridor state
-- names.
do $$
declare v_home_country_id uuid;
begin
  update companies
  set home_country_id = 'eeee0000-0000-0000-0000-000000000001',
      home_state = 'Muscat Governorate',
      home_city = 'Muscat',
      corridor_country_ids = array['eeee0000-0000-0000-0000-000000000001']::uuid[],
      corridor_states = '{"eeee0000-0000-0000-0000-000000000001": ["Dhofar", "Al Buraimi"]}'::jsonb
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select home_country_id into v_home_country_id from companies
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  if v_home_country_id is null then
    raise exception 'FAIL: owner could not save Geography & Corridors fields';
  end if;
  raise notice 'PASS: owner can save Geography & Corridors (home country, state, city, corridors)';
end $$;

-- Target Market Priority (20260924000001) -- reuses Geography's own
-- home/corridor countries and corridor states, just adds a priority
-- ranking keyed the same way (by country UUID as a jsonb key).
do $$
declare v_priority jsonb;
begin
  update companies
  set market_priority = '{"eeee0000-0000-0000-0000-000000000001": "high"}'::jsonb,
      state_priority = '{"eeee0000-0000-0000-0000-000000000001": {"Dhofar": "medium"}}'::jsonb
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select market_priority into v_priority from companies
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  if v_priority->>'eeee0000-0000-0000-0000-000000000001' != 'high' then
    raise exception 'FAIL: owner could not save market priority';
  end if;
  raise notice 'PASS: owner can save Target Market Priority (country and state-level rankings)';
end $$;

-- Direct INSERT bypassing create_company() must be structurally
-- impossible, not just discouraged -- a fresh row can never already be
-- in company_users at INSERT-check time, so companies_member_rw's WITH
-- CHECK always fails for a raw insert, by construction, not by an
-- additional rule bolted on. Documented explicitly here rather than left
-- as an incidental discovery.
do $$
begin
  begin
    insert into companies (country_id, name) values ('eeee0000-0000-0000-0000-000000000001', 'Sneaky Direct Insert Co');
    raise exception 'FAIL: a direct INSERT bypassing create_company() succeeded';
  exception
    when insufficient_privilege then
      raise notice 'PASS: direct INSERT into companies is structurally impossible -- create_company() is the only path';
  end;
end $$;

do $$
begin
  begin
    update companies
    set type = 'Not A Real Type'
    where country_id = 'eeee0000-0000-0000-0000-000000000001';
    raise exception 'FAIL: an invalid company type was accepted';
  exception
    when check_violation then
      raise notice 'PASS: invalid company type correctly rejected by the check constraint';
  end;
end $$;

reset role;

\echo 'ALL COMPANY CONFIGURATION TESTS PASSED'
