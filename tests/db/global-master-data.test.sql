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

-- World Region Reference (20260930000001) -- 7 regions, sub-regions
-- genuinely optional (South Asia/Central Asia have none), countries
-- correctly attached to both.
set role authenticated;
set request.jwt.claim.sub = 'dddddddd-0000-0000-0000-000000000001';

do $$
declare v_regions int; v_subregions int; v_countries int;
begin
  select count(*) into v_regions from world_regions;
  select count(*) into v_subregions from world_sub_regions;
  select count(*) into v_countries from world_countries;
  if v_regions != 7 then
    raise exception 'FAIL: expected exactly 7 world regions, got %', v_regions;
  end if;
  if v_subregions != 18 then
    raise exception 'FAIL: expected exactly 18 world sub-regions, got %', v_subregions;
  end if;
  if v_countries < 40 then
    raise exception 'FAIL: expected at least 40 seeded countries, got %', v_countries;
  end if;
  raise notice 'PASS: any authenticated user can read World Region Reference (regions, sub-regions, countries)';
end $$;

do $$
declare v_total_count int; v_null_subregion_count int;
begin
  select count(*) into v_total_count
  from world_countries wc
  join world_regions wr on wr.id = wc.region_id
  where wr.name in ('South Asia', 'Central Asia');

  select count(*) into v_null_subregion_count
  from world_countries wc
  join world_regions wr on wr.id = wc.region_id
  where wr.name in ('South Asia', 'Central Asia') and wc.sub_region_id is null;

  if v_total_count < 6 then
    raise exception 'FAIL: expected at least 6 South Asia/Central Asia countries, got %', v_total_count;
  end if;
  if v_total_count != v_null_subregion_count then
    raise exception 'FAIL: expected every South Asia/Central Asia country to have a null sub_region_id, but only % of % do', v_null_subregion_count, v_total_count;
  end if;
  raise notice 'PASS: South Asia and Central Asia countries exist with no sub-region layer, as designed';
end $$;

reset role;

do $$
begin
  begin
    insert into world_regions (name) values ('Middle East');
    raise exception 'FAIL: duplicate region name was allowed to insert';
  exception
    when unique_violation then
      raise notice 'PASS: world region name uniqueness is enforced at the database level';
  end;
end $$;

-- Global Style of Incorporation Master (20260930000002) -- same shape
-- and discipline as Sector Master.
set role authenticated;
set request.jwt.claim.sub = 'dddddddd-0000-0000-0000-000000000001';

do $$
declare v_count int;
begin
  select count(*) into v_count from styles_of_incorporation;
  if v_count < 12 then
    raise exception 'FAIL: expected at least 12 seeded styles of incorporation, got %', v_count;
  end if;
  raise notice 'PASS: any authenticated user can read the global Style of Incorporation Master';
end $$;

reset role;

do $$
begin
  begin
    insert into styles_of_incorporation (name) values ('Sole Proprietorship');
    raise exception 'FAIL: duplicate style-of-incorporation name was allowed to insert';
  exception
    when unique_violation then
      raise notice 'PASS: style-of-incorporation name uniqueness is enforced at the database level';
  end;
end $$;
