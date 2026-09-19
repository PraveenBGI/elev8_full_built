-- Phase 0.5 -- Config Engine RLS/resolver integration test.
--
-- This is the "at least one integration test per module covering its
-- primary happy path" requirement from 04-BUILD-STANDARDS.md, applied to
-- the part of this module that is genuinely dangerous to get wrong: the
-- boundary between admin-only config tables and company-facing reads.
--
-- Runs against plain Postgres + tests/db/mock_supabase_platform.sql in CI
-- (see .github/workflows/ci.yml) -- not against a real Supabase project.
-- Every check RAISEs an EXCEPTION on failure, so a wrong result fails the
-- CI job, not just prints something a human has to notice.

\set ON_ERROR_STOP on

-- ── Fixtures ─────────────────────────────────────────────────────────────

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'country-admin@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'state-admin-muscat@test.com'),
  ('33333333-3333-3333-3333-333333333333', 'company-user@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Oman', 'OMR', 'published');

insert into states (id, country_id, name, config_control, approval_status)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Muscat', 'state', 'published'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Dhofar', 'central', 'published');

insert into config_admin_roles (user_id, role, country_id, state_id) values
  ('11111111-1111-1111-1111-111111111111', 'country_admin', 'aaaaaaaa-0000-0000-0000-000000000001', null),
  ('22222222-2222-2222-2222-222222222222', 'state_admin', 'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001');

insert into pillar_configs (country_id, state_id, pillar, payload, readiness_level)
values (
  'aaaaaaaa-0000-0000-0000-000000000001', null, 'procurement',
  '{"evalWeights":{"technical":40,"commercial":40,"icv":20}}'::jsonb, 'published'
);

insert into pillar_configs (country_id, state_id, pillar, payload, readiness_level)
values (
  'aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'procurement',
  '{"evalWeights":{"technical":25,"commercial":25,"icv":50}}'::jsonb, 'published'
);

-- ── Assertions ───────────────────────────────────────────────────────────

do $$
declare
  v_result jsonb;
begin
  -- 1. Delegated state (Muscat, config_control='state') resolves to the
  --    STATE's own payload, not the country's.
  v_result := resolve_pillar_config(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'procurement'
  );
  if v_result->'evalWeights'->>'icv' != '50' then
    raise exception 'FAIL: Muscat (state control) should resolve to its own icv=50, got %', v_result;
  end if;

  -- 2. Non-delegated state (Dhofar, config_control='central') resolves to
  --    the COUNTRY's payload.
  v_result := resolve_pillar_config(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000002',
    'procurement'
  );
  if v_result->'evalWeights'->>'icv' != '20' then
    raise exception 'FAIL: Dhofar (central control) should resolve to country icv=20, got %', v_result;
  end if;

  -- 3. No state at all (country-level call) resolves to the country's
  --    payload.
  v_result := resolve_pillar_config('aaaaaaaa-0000-0000-0000-000000000001', null, 'procurement');
  if v_result->'evalWeights'->>'icv' != '20' then
    raise exception 'FAIL: country-level call should resolve to icv=20, got %', v_result;
  end if;

  raise notice 'PASS: resolve_pillar_config() delegation logic (3/3 cases)';
end $$;

-- 4. A company-scoped session (no admin role at all) must see ZERO rows
--    querying pillar_configs directly -- this is the structural boundary,
--    not a UI-level hide.
set role authenticated;
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from pillar_configs;
  if v_count != 0 then
    raise exception 'FAIL: company user should see 0 pillar_configs rows directly, saw %', v_count;
  end if;
  raise notice 'PASS: company-scoped session sees zero pillar_configs rows directly';
end $$;

-- 5. The same company user CAN still get real data through the resolver.
do $$
declare
  v_result jsonb;
begin
  v_result := resolve_pillar_config(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'bbbbbbbb-0000-0000-0000-000000000001',
    'procurement'
  );
  if v_result->'evalWeights'->>'icv' != '50' then
    raise exception 'FAIL: company user via resolver should get icv=50, got %', v_result;
  end if;
  raise notice 'PASS: company-scoped session gets correct resolved data via resolve_pillar_config()';
end $$;

-- 6. Muscat's state admin sees exactly their own row, nothing else.
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from pillar_configs;
  if v_count != 1 then
    raise exception 'FAIL: Muscat state admin should see exactly 1 row, saw %', v_count;
  end if;
  raise notice 'PASS: state admin sees exactly their own scope (1 row)';
end $$;

-- 7. Muscat's state admin cannot write into Dhofar (a state they don't own).
do $$
begin
  begin
    insert into pillar_configs (country_id, state_id, pillar, payload)
    values ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'b2b', '{}');
    raise exception 'FAIL: state admin was able to write into a state they do not own';
  exception
    when insufficient_privilege then
      raise notice 'PASS: state admin correctly blocked from writing another state''s config';
  end;
end $$;

-- 8. Oman's country admin sees BOTH the country-level row and Muscat's
--    state row -- the audit/rollup requirement.
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare
  v_count int;
begin
  select count(*) into v_count from pillar_configs;
  if v_count != 2 then
    raise exception 'FAIL: country admin should see 2 rows (country + Muscat rollup), saw %', v_count;
  end if;
  raise notice 'PASS: country admin sees rollup (country row + delegated state row)';
end $$;

reset role;

\echo 'ALL CONFIG ENGINE RLS TESTS PASSED'
