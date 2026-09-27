-- Field-level locking and sector/location conditions integration test.
--
-- Uses its own UUID prefix range (bbbb7777.../ffff8888...) distinct from
-- other tests/db/*.test.sql files.

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('bbbb7777-bbbb-7777-bbbb-777777777777', 'lock-country-admin@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('ffff8888-0000-0000-0000-000000000001', 'Lock Testland', 'USD', 'draft');

insert into states (id, country_id, name, config_control, approval_status)
values ('ffff8888-0000-0000-0000-000000000002', 'ffff8888-0000-0000-0000-000000000001', 'Delegated State', 'state', 'published');

insert into config_admin_roles (user_id, role, country_id) values
  ('bbbb7777-bbbb-7777-bbbb-777777777777', 'country_admin', 'ffff8888-0000-0000-0000-000000000001');

-- Country-level procurement config: eval weights + a locked field
-- (evalWeights.icv is mandatory everywhere, the rest is open).
insert into pillar_configs (country_id, state_id, pillar, payload, locked_fields, readiness_level)
values (
  'ffff8888-0000-0000-0000-000000000001', null, 'procurement',
  '{"evalWeights":{"technical":30,"commercial":30,"icv":20,"esg":10,"compliance":10},"thresholds":{"directAward":5000}}'::jsonb,
  array['evalWeights.icv'],
  'published'
);

-- The delegated state's OWN payload deliberately sets a DIFFERENT icv
-- weight (30 instead of the country's locked 20) plus a different
-- (unlocked) technical weight -- the icv change must be overridden back,
-- the technical change must NOT be.
insert into pillar_configs (country_id, state_id, pillar, payload, readiness_level)
values (
  'ffff8888-0000-0000-0000-000000000001', 'ffff8888-0000-0000-0000-000000000002', 'procurement',
  '{"evalWeights":{"technical":50,"commercial":10,"icv":30,"esg":5,"compliance":5},"thresholds":{"directAward":9999}}'::jsonb,
  'published'
);

do $$
declare v_result jsonb;
begin
  v_result := resolve_pillar_config(
    'ffff8888-0000-0000-0000-000000000001',
    'ffff8888-0000-0000-0000-000000000002',
    'procurement'
  );

  if (v_result->'evalWeights'->>'icv')::int != 20 then
    raise exception 'FAIL: locked field evalWeights.icv should be forced to country value 20, got %', v_result->'evalWeights'->>'icv';
  end if;

  if (v_result->'evalWeights'->>'technical')::int != 50 then
    raise exception 'FAIL: unlocked field evalWeights.technical should keep the state''s own value 50, got %', v_result->'evalWeights'->>'technical';
  end if;

  if (v_result->'thresholds'->>'directAward')::int != 9999 then
    raise exception 'FAIL: unlocked nested field thresholds.directAward should keep the state''s value, got %', v_result->'thresholds'->>'directAward';
  end if;

  raise notice 'PASS: field-level locking forces only the locked path back to country value, leaves everything else as the state set it';
end $$;

-- A non-delegated state (central control) must be completely unaffected
-- by locked_fields -- locking only matters when there's a state override
-- to constrain in the first place.
insert into states (id, country_id, name, config_control, approval_status)
values ('ffff8888-0000-0000-0000-000000000003', 'ffff8888-0000-0000-0000-000000000001', 'Central State', 'central', 'draft');

do $$
declare v_result jsonb;
begin
  v_result := resolve_pillar_config(
    'ffff8888-0000-0000-0000-000000000001',
    'ffff8888-0000-0000-0000-000000000003',
    'procurement'
  );
  if (v_result->'evalWeights'->>'icv')::int != 20 then
    raise exception 'FAIL: central-control state should just get the country payload unchanged';
  end if;
  raise notice 'PASS: a non-delegated state is unaffected by locked_fields (gets the plain country payload)';
end $$;

-- New behavior from 20260923000000: a state can be delegated
-- (config_control='state') yet still not published (draft, submitted,
-- under_review, clarification_required) -- in that window, the resolver
-- must ignore the state's own payload entirely and fall back to the
-- country's config, exactly as if the state were central. Confirmed with
-- a THIRD state, still 'draft', that has its own (different) payload set
-- but must never be seen by the resolver while unpublished.
insert into states (id, country_id, name, config_control, approval_status)
values ('ffff8888-0000-0000-0000-000000000004', 'ffff8888-0000-0000-0000-000000000001', 'Delegated But Draft State', 'state', 'draft');

insert into pillar_configs (country_id, state_id, pillar, payload, readiness_level)
values (
  'ffff8888-0000-0000-0000-000000000001', 'ffff8888-0000-0000-0000-000000000004', 'procurement',
  '{"evalWeights":{"technical":99,"commercial":1,"icv":0,"esg":0,"compliance":0}}'::jsonb,
  'ready_for_review'
);

do $$
declare v_result jsonb;
begin
  v_result := resolve_pillar_config(
    'ffff8888-0000-0000-0000-000000000001',
    'ffff8888-0000-0000-0000-000000000004',
    'procurement'
  );
  if (v_result->'evalWeights'->>'technical')::int != 30 then
    raise exception 'FAIL: a delegated but unpublished state must fall back to the country payload, got technical=%', v_result->'evalWeights'->>'technical';
  end if;
  raise notice 'PASS: a delegated state that is not yet published falls back to the country config (approval_status gating works)';
end $$;

-- ── Sector/location conditions ──────────────────────────────────────────

set role authenticated;
set request.jwt.claim.sub = 'bbbb7777-bbbb-7777-bbbb-777777777777';

do $$
begin
  insert into pillar_config_conditions (country_id, pillar, condition_type, condition_value, override_payload, priority)
  values (
    'ffff8888-0000-0000-0000-000000000001', 'procurement', 'sector', 'Manufacturing',
    '{"prequalification":{"required":true,"minScore":80}}'::jsonb, 0
  );
  raise notice 'PASS: Country Admin created a sector condition';
end $$;

reset role;

do $$
declare v_result jsonb;
begin
  -- No sector passed -- condition must NOT apply.
  v_result := resolve_pillar_config(
    'ffff8888-0000-0000-0000-000000000001', null, 'procurement'
  );
  if v_result ? 'prequalification' then
    raise exception 'FAIL: condition applied even though no sector was passed';
  end if;
  raise notice 'PASS: sector condition does not apply when no sector is given (backward compatible 3-arg call)';
end $$;

do $$
declare v_result jsonb;
begin
  -- Matching sector -- condition MUST apply, merged onto the base.
  v_result := resolve_pillar_config(
    'ffff8888-0000-0000-0000-000000000001', null, 'procurement', 'Manufacturing', null
  );
  if (v_result->'prequalification'->>'minScore')::int != 80 then
    raise exception 'FAIL: matching sector condition should merge prequalification.minScore=80, got %', v_result;
  end if;
  if (v_result->'evalWeights'->>'icv')::int != 20 then
    raise exception 'FAIL: sector condition should not clobber unrelated existing top-level keys';
  end if;
  raise notice 'PASS: matching sector condition merges its override onto the resolved base config';
end $$;

do $$
declare v_result jsonb;
begin
  -- Non-matching sector -- condition must NOT apply.
  v_result := resolve_pillar_config(
    'ffff8888-0000-0000-0000-000000000001', null, 'procurement', 'Financial Services', null
  );
  if v_result ? 'prequalification' then
    raise exception 'FAIL: condition applied for a non-matching sector';
  end if;
  raise notice 'PASS: non-matching sector correctly does not trigger the condition';
end $$;

-- Company-scoped session (no admin role) must see zero rows in
-- pillar_config_conditions directly -- same structural boundary as
-- pillar_configs itself.
set role authenticated;
set request.jwt.claim.sub = '99999999-0000-0000-0000-000000000000';

do $$
declare v_count int;
begin
  select count(*) into v_count from pillar_config_conditions;
  if v_count != 0 then
    raise exception 'FAIL: company-scoped session should see 0 conditions directly, saw %', v_count;
  end if;
  raise notice 'PASS: pillar_config_conditions has no direct SELECT for company-scoped sessions, resolver-only';
end $$;

reset role;

\echo 'ALL FIELD LOCKING AND CONDITIONS TESTS PASSED'
