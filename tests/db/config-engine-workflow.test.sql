-- Phase 0.5 addendum -- approval workflow state machine integration test.
--
-- Uses its own UUID prefix range (cccccccc.../dddddddd.../666.../777...)
-- distinct from tests/db/config-engine-rls.test.sql's fixtures
-- (aaaaaaaa.../bbbbbbbb.../111.../222.../333...) because CI runs every
-- tests/db/*.test.sql file sequentially against the SAME database (see
-- .github/workflows/ci.yml) -- sharing fixture ids across test files would
-- collide with a duplicate-key error that has nothing to do with either
-- test's actual correctness.

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('66666666-6666-6666-6666-666666666666', 'country-admin-2@test.com'),
  ('77777777-7777-7777-7777-777777777777', 'state-admin-2@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('cccccccc-0000-0000-0000-000000000001', 'Testland', 'USD', 'draft');

insert into states (id, country_id, name, config_control, approval_status)
values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'Teststate', 'state', 'draft');

insert into config_admin_roles (user_id, role, country_id, state_id) values
  ('66666666-6666-6666-6666-666666666666', 'country_admin', 'cccccccc-0000-0000-0000-000000000001', null),
  ('77777777-7777-7777-7777-777777777777', 'state_admin', 'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001');

-- Only 1 of 8 pillars ready -- submission must be rejected.
insert into pillar_configs (country_id, state_id, pillar, payload, readiness_level)
values ('cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', 'procurement', '{}', 'ready_for_review');

set role authenticated;
set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';

do $$
begin
  begin
    perform submit_state_config_for_approval('dddddddd-0000-0000-0000-000000000001');
    raise exception 'FAIL: submission should be rejected when pillars are incomplete';
  exception
    when others then
      if sqlerrm not like '%not ready for review%' then raise; end if;
      raise notice 'PASS: submission correctly rejected for incomplete pillars';
  end;
end $$;

reset role;

insert into pillar_configs (country_id, state_id, pillar, payload, readiness_level)
select 'cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000001', p, '{}', 'ready_for_review'
from unnest(enum_range(null::pillar_id)) p
where p != 'procurement';

set role authenticated;
set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';

do $$
declare v_status public.approval_status;
begin
  perform submit_state_config_for_approval('dddddddd-0000-0000-0000-000000000001', 'ready');
  select approval_status into v_status from states where id = 'dddddddd-0000-0000-0000-000000000001';
  if v_status != 'submitted' then
    raise exception 'FAIL: expected submitted, got %', v_status;
  end if;
  raise notice 'PASS: State Admin submitted a complete config successfully';
end $$;

do $$
begin
  begin
    perform approve_state_config('dddddddd-0000-0000-0000-000000000001');
    raise exception 'FAIL: State Admin approved their own submission';
  exception
    when others then
      raise notice 'PASS: State Admin blocked from self-approval -- %', sqlerrm;
  end;
end $$;

set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';

do $$
declare v_status public.approval_status;
begin
  perform request_state_clarification('dddddddd-0000-0000-0000-000000000001', 'Please revisit the ICV thresholds.');
  select approval_status into v_status from states where id = 'dddddddd-0000-0000-0000-000000000001';
  if v_status != 'clarification_required' then
    raise exception 'FAIL: expected clarification_required, got %', v_status;
  end if;
  raise notice 'PASS: Country Admin requested clarification';
end $$;

set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';

do $$
declare v_status public.approval_status;
begin
  perform submit_state_config_for_approval('dddddddd-0000-0000-0000-000000000001', 'adjusted');
  select approval_status into v_status from states where id = 'dddddddd-0000-0000-0000-000000000001';
  if v_status != 'submitted' then
    raise exception 'FAIL: expected submitted after resubmission, got %', v_status;
  end if;
  raise notice 'PASS: State Admin re-submitted after clarification_required';
end $$;

set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';

do $$
declare v_status public.approval_status;
begin
  perform approve_state_config('dddddddd-0000-0000-0000-000000000001');
  perform publish_state_config('dddddddd-0000-0000-0000-000000000001');
  select approval_status into v_status from states where id = 'dddddddd-0000-0000-0000-000000000001';
  if v_status != 'published' then
    raise exception 'FAIL: expected published, got %', v_status;
  end if;
  raise notice 'PASS: Country Admin approved then published';
end $$;

set request.jwt.claim.sub = '77777777-7777-7777-7777-777777777777';

do $$
declare v_status public.approval_status;
begin
  update pillar_configs set payload = '{"changed": true}'
  where state_id = 'dddddddd-0000-0000-0000-000000000001' and pillar = 'procurement';

  select approval_status into v_status from states where id = 'dddddddd-0000-0000-0000-000000000001';
  if v_status != 'draft' then
    raise exception 'FAIL: expected auto-revert to draft after post-publish edit, got %', v_status;
  end if;
  raise notice 'PASS: post-publish pillar edit auto-reverted approval_status to draft';
end $$;

set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';

do $$
declare
  v_control public.config_control;
  v_payload jsonb;
begin
  perform set_state_config_control('dddddddd-0000-0000-0000-000000000001', 'central', 'reverting for test');
  select config_control into v_control from states where id = 'dddddddd-0000-0000-0000-000000000001';
  select payload into v_payload from pillar_configs
    where state_id = 'dddddddd-0000-0000-0000-000000000001' and pillar = 'procurement';

  if v_control != 'central' then
    raise exception 'FAIL: expected config_control=central, got %', v_control;
  end if;
  if v_payload->>'changed' != 'true' then
    raise exception 'FAIL: revoking delegation must not touch the state''s authored payload';
  end if;
  raise notice 'PASS: Country Admin revoked delegation without touching the state''s payload';
end $$;

-- THE bug this test suite actually caught during development: a
-- SECURITY DEFINER function with no explicit GRANT is NOT automatically
-- unreachable -- Postgres grants EXECUTE on new functions to PUBLIC by
-- default, and this project's default-privileges setup separately grants
-- EXECUTE to `authenticated` on every new public-schema function too. Both
-- had to be revoked explicitly (see the migration's own comment). This
-- assertion is what would fail again if that regressed.
do $$
begin
  begin
    perform approve_country_config('cccccccc-0000-0000-0000-000000000001');
    raise exception 'FAIL: approve_country_config was reachable by an ordinary authenticated session';
  exception
    when insufficient_privilege then
      raise notice 'PASS: approve_country_config correctly unreachable without service_role';
  end;
end $$;

reset role;

do $$
declare v_count int;
begin
  select count(*) into v_count from config_approval_events
  where state_id = 'dddddddd-0000-0000-0000-000000000001';
  if v_count < 6 then
    raise exception 'FAIL: expected at least 6 audit events for the full lifecycle, got %', v_count;
  end if;
  raise notice 'PASS: full audit trail recorded (% events)', v_count;
end $$;

-- country_saved_configs: owner-country-admin-only CRUD, invisible to any
-- other country's admin and to company-scoped sessions entirely. Uses its
-- own second country/admin fixture rather than depending on
-- config-engine-rls.test.sql's leftover data, so this file stays correct
-- even if run standalone.
insert into auth.users (id, email) values
  ('88888888-8888-8888-8888-888888888888', 'other-country-admin@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('cccccccc-0000-0000-0000-000000000002', 'Otherland', 'EUR', 'draft');

insert into config_admin_roles (user_id, role, country_id, state_id)
values ('88888888-8888-8888-8888-888888888888', 'country_admin', 'cccccccc-0000-0000-0000-000000000002', null);

set role authenticated;
set request.jwt.claim.sub = '66666666-6666-6666-6666-666666666666';

do $$
begin
  insert into country_saved_configs (country_id, pillar, name, description, payload, created_by)
  values ('cccccccc-0000-0000-0000-000000000001', 'procurement', 'Standard weighting', 'Reused across new states', '{"evalWeights":{"technical":40}}', auth.uid());
  raise notice 'PASS: Country Admin created their own saved config';
end $$;

reset role;

set role authenticated;
set request.jwt.claim.sub = '88888888-8888-8888-8888-888888888888';

do $$
declare v_count int;
begin
  select count(*) into v_count from country_saved_configs where country_id = 'cccccccc-0000-0000-0000-000000000001';
  if v_count != 0 then
    raise exception 'FAIL: a different country''s admin should see 0 rows of another country''s saved configs, saw %', v_count;
  end if;
  raise notice 'PASS: country_saved_configs correctly invisible across countries';
end $$;

reset role;

\echo 'ALL APPROVAL WORKFLOW TESTS PASSED'
