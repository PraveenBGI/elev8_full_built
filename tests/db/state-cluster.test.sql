-- Phase 0.5 -- State Cluster integration test.
--
-- Uses its own UUID prefix range (ffffffff.../cccc1111...) distinct from
-- other tests/db/*.test.sql files (CI runs them sequentially against the
-- same database).

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('cccc1111-cccc-1111-cccc-111111111111', 'sc-country-admin@test.com'),
  ('cccc2222-cccc-2222-cccc-222222222222', 'sc-other-admin@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('ffffffff-0000-0000-0000-000000000001', 'SC Testland', 'USD', 'draft');

insert into countries (id, name, master_currency, approval_status)
values ('ffffffff-0000-0000-0000-000000000002', 'SC Otherland', 'EUR', 'draft');

insert into config_admin_roles (user_id, role, country_id) values
  ('cccc1111-cccc-1111-cccc-111111111111', 'country_admin', 'ffffffff-0000-0000-0000-000000000001'),
  ('cccc2222-cccc-2222-cccc-222222222222', 'country_admin', 'ffffffff-0000-0000-0000-000000000002');

set role authenticated;
set request.jwt.claim.sub = 'cccc1111-cccc-1111-cccc-111111111111';

do $$
begin
  insert into states (country_id, name, is_active, is_thrust_cluster)
  values ('ffffffff-0000-0000-0000-000000000001', 'Test Province', true, false);
  raise notice 'PASS: Country Admin added a state to their own country';
end $$;

do $$
declare v_state_id uuid;
begin
  select id into v_state_id from states where country_id = 'ffffffff-0000-0000-0000-000000000001';
  update states set is_active = false where id = v_state_id;
  if (select is_active from states where id = v_state_id) != false then
    raise exception 'FAIL: deactivating a state did not persist';
  end if;
  raise notice 'PASS: Country Admin deactivated a state (soft, not deleted)';
end $$;

-- Delegation lever, from the approval-workflow migration, exercised here
-- against a real state added this session.
do $$
declare v_state_id uuid;
begin
  select id into v_state_id from states where country_id = 'ffffffff-0000-0000-0000-000000000001';
  perform set_state_config_control(v_state_id, 'state', 'Delegating to test state admin');
  if (select config_control from states where id = v_state_id) != 'state' then
    raise exception 'FAIL: set_state_config_control did not update config_control';
  end if;
  raise notice 'PASS: Country Admin delegated a state via set_state_config_control()';
end $$;

set request.jwt.claim.sub = 'cccc2222-cccc-2222-cccc-222222222222';

do $$
begin
  begin
    insert into states (country_id, name)
    values ('ffffffff-0000-0000-0000-000000000001', 'Should not be allowed');
    raise exception 'FAIL: a different country''s admin added a state to another country';
  exception
    when insufficient_privilege then
      raise notice 'PASS: cross-country state creation correctly rejected';
  end;
end $$;

reset role;

\echo 'ALL STATE CLUSTER TESTS PASSED'
