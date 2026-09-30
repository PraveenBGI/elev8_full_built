-- Global Master Data tests -- genuinely global (no country_id) reference
-- tables owned by the Portal Admin / Super Admin tier, distinct from
-- country-scoped Country Master Data (see country-master-data.test.sql).
--
-- Uses its own UUID prefix range (dddddddd.../000...) distinct from the
-- other tests/db/*.test.sql files, since CI runs them sequentially
-- against the same database (see .github/workflows/ci.yml).

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('dddddddd-0000-0000-0000-000000000001', 'sector-reader@test.com');

set role authenticated;
set request.jwt.claim.sub = 'dddddddd-0000-0000-0000-000000000001';

-- Any authenticated user can read the global Sector Master -- the same
-- select_any_authenticated pattern as countries and country_hs_codes,
-- since this is reference data every country and every company reads.
do $$
declare v_count int;
begin
  select count(*) into v_count from sectors;
  if v_count < 17 then
    raise exception 'FAIL: expected at least 17 seeded sectors, got %', v_count;
  end if;
  raise notice 'PASS: any authenticated user can read the global Sector Master';
end $$;

-- Seed data itself is real and matches the FRD's own wording ("Active
-- Sectors") -- every seeded row defaults is_active = true.
do $$
declare v_inactive_count int;
begin
  select count(*) into v_inactive_count from sectors where is_active = false;
  if v_inactive_count != 0 then
    raise exception 'FAIL: expected zero inactive sectors at seed time, got %', v_inactive_count;
  end if;
  raise notice 'PASS: all seeded sectors default to active';
end $$;

reset role;

-- Sector names are unique -- a real constraint, not just a convention,
-- since Business Identity's picker matches by name. Checked as the
-- table owner (no role set), since RLS only gates SELECT here, not the
-- constraint itself.
do $$
begin
  begin
    insert into sectors (name) values ('Energy');
    raise exception 'FAIL: duplicate sector name was allowed to insert';
  exception
    when unique_violation then
      raise notice 'PASS: sector name uniqueness is enforced at the database level';
  end;
end $$;
