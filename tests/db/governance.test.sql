-- Phase 0.5 -- Governance pillar integration test (authorities,
-- stakeholders, and pillar_configs payload for governance-specific
-- settings).
--
-- Uses its own UUID prefix range (dddddddd.../dddd3333...) distinct from
-- other tests/db/*.test.sql files.

\set ON_ERROR_STOP on

insert into auth.users (id, email) values
  ('dddd3333-dddd-3333-dddd-333333333333', 'gov-country-admin@test.com'),
  ('dddd4444-dddd-4444-dddd-444444444444', 'gov-other-admin@test.com');

insert into countries (id, name, master_currency, approval_status)
values ('11112222-0000-0000-0000-000000000001', 'Gov Testland', 'USD', 'draft');

insert into countries (id, name, master_currency, approval_status)
values ('11112222-0000-0000-0000-000000000002', 'Gov Otherland', 'EUR', 'draft');

insert into config_admin_roles (user_id, role, country_id) values
  ('dddd3333-dddd-3333-dddd-333333333333', 'country_admin', '11112222-0000-0000-0000-000000000001'),
  ('dddd4444-dddd-4444-dddd-444444444444', 'country_admin', '11112222-0000-0000-0000-000000000002');

set role authenticated;
set request.jwt.claim.sub = 'dddd3333-dddd-3333-dddd-333333333333';

do $$
begin
  insert into country_authorities (country_id, ref, name, type, domain, headquarters)
  values ('11112222-0000-0000-0000-000000000001', 'A001', 'National Standards Authority', 'Standards Authority', 'Both', 'Capital City');
  raise notice 'PASS: authority created successfully';
end $$;

do $$
begin
  begin
    insert into country_authorities (country_id, ref, name, type, domain)
    values ('11112222-0000-0000-0000-000000000001', 'A002', 'Bad Type Authority', 'Not A Real Type', 'Both');
    raise exception 'FAIL: an invalid authority type was accepted';
  exception
    when check_violation then
      raise notice 'PASS: invalid authority type correctly rejected by the check constraint';
  end;
end $$;

do $$
begin
  insert into country_stakeholders (country_id, ref, name, sectors, domain)
  values ('11112222-0000-0000-0000-000000000001', 'S001', 'Ministry of Trade', array['Consumer Goods'], 'Procurement');
  raise notice 'PASS: stakeholder created successfully';
end $$;

set request.jwt.claim.sub = 'dddd4444-dddd-4444-dddd-444444444444';

do $$
begin
  begin
    insert into country_authorities (country_id, ref, name, type, domain)
    values ('11112222-0000-0000-0000-000000000001', 'A003', 'Cross-country authority', 'Standards Authority', 'Both');
    raise exception 'FAIL: a different country''s admin created an authority in another country';
  exception
    when insufficient_privilege then
      raise notice 'PASS: cross-country authority write correctly rejected';
  end;
end $$;

reset role;

-- Governance-specific settings (escalation matrix, data governance) go
-- through pillar_configs, already fully tested in
-- config-engine-rls.test.sql -- this confirms the governance pillar
-- specifically round-trips a realistic payload shape, not just an
-- arbitrary jsonb blob.
set role authenticated;
set request.jwt.claim.sub = 'dddd3333-dddd-3333-dddd-333333333333';

do $$
begin
  insert into pillar_configs (country_id, state_id, pillar, payload, readiness_level)
  values (
    '11112222-0000-0000-0000-000000000001', null, 'governance',
    '{"escalation":[{"level":1,"role":"Department Head"},{"level":2,"role":"Director General"}],"dataGovernance":"Centralized","auditFrequency":"Quarterly","accessPolicy":"Role-based","infoClassification":"Public, Internal, Restricted"}'::jsonb,
    'configuration_in_progress'
  );
  raise notice 'PASS: governance pillar_configs payload saved with realistic shape';
end $$;

do $$
declare v_payload jsonb;
begin
  v_payload := resolve_pillar_config('11112222-0000-0000-0000-000000000001', null, 'governance');
  if v_payload->>'auditFrequency' != 'Quarterly' then
    raise exception 'FAIL: resolver did not return the governance payload correctly, got %', v_payload;
  end if;
  raise notice 'PASS: resolve_pillar_config() returns the governance payload correctly';
end $$;

reset role;

\echo 'ALL GOVERNANCE TESTS PASSED'
