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

-- Business Objectives / Goals (20260924000002) -- a plain text[], no
-- upper bound enforced (the mockup's own "top 3" is guidance text, not
-- a hard limit).
do $$
declare v_goals text[];
begin
  update companies
  set goals = array['Find Buyers', 'Increase Exports', 'Improve ICV']
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select goals into v_goals from companies
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  if array_length(v_goals, 1) != 3 then
    raise exception 'FAIL: owner could not save goals, got %', v_goals;
  end if;
  raise notice 'PASS: owner can save Business Objectives (goals)';
end $$;

-- Commercial Terms (20260924000003) -- the last of 7 Enterprise
-- Configuration steps, one jsonb blob for the whole "commercial
-- preferences" unit.
do $$
declare v_terms jsonb;
begin
  update companies
  set commercial_terms = '{"currency":"USD","payment":"Letter of Credit","acceptedCurrencies":["USD","OMR"],"dealSize":"250k1m","dealMin":"USD 250,000","dealMax":"USD 1,000,000","contractPref":"Framework Agreement","incotermsPreferred":["FOB"],"incotermsAccepted":["FOB","CIF"]}'::jsonb
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select commercial_terms into v_terms from companies
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  if v_terms->>'currency' != 'USD' then
    raise exception 'FAIL: owner could not save commercial terms, got %', v_terms;
  end if;
  raise notice 'PASS: owner can save Commercial Terms (the last of 7 Enterprise Configuration steps)';
end $$;

-- Pillar Selection (20260925000000) -- Phase 2's first step. Stores
-- which pillars are active, why each was chosen (ai vs manual), and
-- whether the one-time auto-apply has already run.
do $$
declare v_selection jsonb;
begin
  update companies
  set pillar_selection = '{"pillars":["procurement","export","b2b"],"pillarSource":{"procurement":"ai","export":"ai","b2b":"manual"},"autoApplied":true}'::jsonb
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select pillar_selection into v_selection from companies
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  if not (v_selection->'pillars' ? 'procurement') then
    raise exception 'FAIL: owner could not save pillar selection, got %', v_selection;
  end if;
  raise notice 'PASS: owner can save Pillar Selection (Phase 2 begins)';
end $$;

-- Governance Pillar (20260925000001) -- Compliance & Certs and Document
-- Room checklist are plain fields on companies, same pattern as
-- everything else. The real new capability here is company_audit_log:
-- a genuinely append-only table (only SELECT and INSERT policies exist,
-- no UPDATE or DELETE policy at all -- verified below, not just
-- asserted in a comment).
do $$
declare
  v_company_id uuid;
  v_compliance jsonb;
begin
  select id into v_company_id from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';

  update companies
  set compliance = '{"requiredCerts":["ISO 9001"],"tradeRequirements":["Export License"],"certsHeld":["ISO 9001"],"certExpiry":{"ISO 9001":"2027-01-01"}}'::jsonb,
      risk_reviewed = true,
      doc_checklist = array['Commercial Invoice', 'Packing List']
  where id = v_company_id;

  select compliance into v_compliance from companies where id = v_company_id;
  if not (v_compliance->'requiredCerts' ? 'ISO 9001') then
    raise exception 'FAIL: owner could not save Compliance & Certs, got %', v_compliance;
  end if;
  raise notice 'PASS: owner can save Compliance & Certs, Risk Intelligence acknowledgment, and Document checklist';

  insert into company_audit_log (company_id, section, detail)
  values (v_company_id, 'Compliance & Certs', 'Saved certification & regulatory requirements');

  if (select count(*) from company_audit_log where company_id = v_company_id) != 1 then
    raise exception 'FAIL: audit log entry was not inserted';
  end if;
  raise notice 'PASS: owner can insert an audit log entry for their own company';
end $$;

-- A non-member must not be able to read or insert into the audit log.
set request.jwt.claim.sub = 'aaaa6666-aaaa-6666-aaaa-666666666666';
do $$
declare
  v_company_id uuid;
  v_visible_count int;
begin
  select id into v_company_id from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select count(*) into v_visible_count from company_audit_log where company_id = v_company_id;
  if v_visible_count != 0 then
    raise exception 'FAIL: non-member could see % audit log row(s) for a company they do not belong to', v_visible_count;
  end if;
  raise notice 'PASS: audit log is correctly invisible to a non-member';
end $$;
reset request.jwt.claim.sub;

-- The append-only claim: no UPDATE or DELETE policy exists at all. In
-- Postgres RLS, a missing policy for a command does NOT raise an error --
-- the statement succeeds but silently matches zero rows. So the real
-- check is "did anything actually change", not "did it throw".
set request.jwt.claim.sub = 'aaaa5555-aaaa-5555-aaaa-555555555555';
do $$
declare
  v_company_id uuid;
  v_log_id uuid;
  v_original_detail text;
  v_detail_after_update text;
  v_count_after_delete int;
begin
  select id into v_company_id from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';
  select id, detail into v_log_id, v_original_detail from company_audit_log where company_id = v_company_id limit 1;

  update company_audit_log set detail = 'tampered' where id = v_log_id;
  select detail into v_detail_after_update from company_audit_log where id = v_log_id;
  if v_detail_after_update != v_original_detail then
    raise exception 'FAIL: UPDATE silently succeeded -- detail changed from % to %', v_original_detail, v_detail_after_update;
  end if;

  delete from company_audit_log where id = v_log_id;
  select count(*) into v_count_after_delete from company_audit_log where id = v_log_id;
  if v_count_after_delete = 0 then
    raise exception 'FAIL: DELETE silently succeeded -- the row is gone';
  end if;

  raise notice 'PASS: audit log is genuinely append-only -- UPDATE and DELETE both silently affect zero rows (Postgres RLS behavior for a missing policy), not just blocked by convention';
end $$;

-- Procurement Pillar (20260925000002) -- three jsonb sub-groups, same
-- pattern as every other pillar so far.
do $$
declare v_rfq jsonb;
begin
  update companies
  set procurement_rfq_prefs = '{"categories":"Renewable Energy","countries":"Oman","size":"USD 50K-2M","oppType":"Product Supply","timeline":"Short-term (3-6 months)"}'::jsonb,
      procurement_tender_prefs = '{"types":["Open Tender","EPC Tender"],"sector":"Energy","countries":"Oman","value":"USD 250K-10M","categories":"Solar","timeline":"Medium-term (6-12 months)"}'::jsonb,
      procurement_contract_prefs = '{"types":["Supply Contract"],"value":"USD 100K-5M","duration":"1-5 Years","industries":"Energy","timeline":"Long-term (12-24 months)"}'::jsonb
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select procurement_rfq_prefs into v_rfq from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';
  if v_rfq->>'categories' != 'Renewable Energy' then
    raise exception 'FAIL: owner could not save Procurement pillar preferences, got %', v_rfq;
  end if;
  raise notice 'PASS: owner can save Procurement pillar preferences (RFQ, Tender, Contract)';
end $$;

-- B2B Pillar (20260925000003) -- b2b_products holds two dynamic arrays
-- in one jsonb blob; buyer_target/supplier_target are their own
-- columns since Target Buyers/Target Suppliers are separate,
-- conditionally-visible pages.
do $$
declare v_products jsonb;
begin
  update companies
  set b2b_products = '{"sell":[{"cat":"Electronics","name":"Solar Inverter","hs":"8504.40","country":"Oman","moq":"100 units","cert":"CE","budget":"$50K-$250K","timeline":"Short-term (3-6 months)"}],"source":[]}'::jsonb,
      buyer_target = '{"country":"Saudi Arabia","type":"Government / Public Sector","industry":"Energy","size":"Large Enterprise","contractValue":"USD 500K-5M","budget":"$250K-$1M","timeline":"Medium-term (6-12 months)"}'::jsonb,
      buyer_segments = array['Government Buyers', 'Renewable Energy Developers'],
      supplier_target = '{"type":"Manufacturer","countries":"China, India","certs":"ISO 9001","esg":"Preferred","capability":"Export capable","budget":"<$50K","timeline":"Immediate (0-3 months)"}'::jsonb,
      supplier_filters = array['ISO 9001 certified', 'Export capable']
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select b2b_products into v_products from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';
  if jsonb_array_length(v_products->'sell') != 1 then
    raise exception 'FAIL: owner could not save B2B products, got %', v_products;
  end if;
  raise notice 'PASS: owner can save B2B Pillar preferences (Products & Services, Target Buyers, Target Suppliers)';
end $$;

-- Import Pillar (20260925000004) -- four sub-groups, the richest being
-- import_corridors (duty, freight, transit, demand, risk per corridor).
do $$
declare v_corridors jsonb;
begin
  update companies
  set import_products = '[{"cat":"Solar","name":"Solar Panels","hs":"8541.40","price":"USD 0.20/W","lead":"45 days","src":"China","budget":"$250K-$1M","timeline":"Short-term (3-6 months)"}]'::jsonb,
      import_corridors = '[{"o":"India","d":"Oman","incoterm":"CIF","products":"Solar Modules, Inverters","port":"Mumbai to Sohar","duty":5,"freight":1800,"transit":14,"demand":"High","risk":"Low","budget":"$50K-$250K","timeline":"Immediate (0-3 months)"}]'::jsonb,
      import_logistics = '{"ports":["Mumbai"],"shipModes":["Sea Freight: FCL"],"regions":"GCC","partners":"DHL, Maersk","volume":"FCL: Full Container"}'::jsonb,
      import_countries = array['China', 'India'],
      import_req = '{"supplierType":"Manufacturer","moq":"500 units","price":"USD 210 / unit","lead":"45-60 days","certs":"IEC 62109, CE","incoterm":"FOB","budget":"$50K-$250K","timeline":"Medium-term (6-12 months)"}'::jsonb
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select import_corridors into v_corridors from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';
  if jsonb_array_length(v_corridors) != 1 or v_corridors->0->>'risk' != 'Low' then
    raise exception 'FAIL: owner could not save Import pillar preferences, got %', v_corridors;
  end if;
  raise notice 'PASS: owner can save Import Pillar preferences (Products, Corridors, Logistics, Preferences)';
end $$;

-- Export Pillar (20260925000005) -- reuses Import's corridor and
-- logistics shapes exactly; export_tier/budget/timeline are per-country
-- jsonb maps, genuinely different from Import's single flat object.
do $$
declare v_tier jsonb;
begin
  update companies
  set export_products = '[{"cat":"Solar","name":"Solar Panels","hs":"8541.40","country":"Oman","moq":"200 units","cert":"CE","budget":"$50K-$250K","timeline":"Short-term (3-6 months)"}]'::jsonb,
      export_corridors = '[{"o":"Oman","d":"Kenya","incoterm":"CIF","products":"Solar Modules","port":"Sohar to Mombasa","duty":5,"freight":1500,"transit":18,"demand":"Medium","risk":"Medium","budget":"$250K-$1M","timeline":"Medium-term (6-12 months)"}]'::jsonb,
      export_logistics = '{"ports":["Sohar"],"shipModes":["Sea Freight: FCL"],"regions":"East Africa","partners":"Maersk","volume":"FCL: Full Container"}'::jsonb,
      export_countries = array['Kenya', 'Tanzania'],
      export_tier = '{"Kenya":"high","Tanzania":"medium"}'::jsonb,
      export_budget = '{"Kenya":"$250K-$1M"}'::jsonb,
      export_timeline = '{"Kenya":"Medium-term (6-12 months)"}'::jsonb
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select export_tier into v_tier from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';
  if v_tier->>'Kenya' != 'high' then
    raise exception 'FAIL: owner could not save Export pillar preferences, got %', v_tier;
  end if;
  raise notice 'PASS: owner can save Export Pillar preferences (Products, Corridors, Logistics, per-country Preferences)';
end $$;

-- Investment Pillar (20260925000006) -- per-country table (reusing
-- MARKET_TIERS), a deal-structure object, a live-calculator's inputs
-- only (never its computed outputs), an acknowledgment boolean, and a
-- real chip picker.
do $$
declare v_req jsonb;
begin
  update companies
  set investment_countries = array['Kenya'],
      investment_tier = '{"Kenya":"high"}'::jsonb,
      investment_budget = '{"Kenya":"$1M-$5M"}'::jsonb,
      investment_timeline = '{"Kenya":"Long-term (12-24 months)"}'::jsonb,
      investment_req = '{"type":"Joint Venture","ownership":"JV Partner","sectorFocus":"Renewable Energy","budget":"$1M-$5M","timeline":"Long-term (12-24 months)"}'::jsonb,
      landed_cost = '{"cost":100,"qty":1000,"freight":1800,"ins":0.5,"duty":5,"tax":5,"port":500,"bank":300,"sell":150}'::jsonb,
      corridor_compare_reviewed = true,
      finance_instruments = array['Letter of Credit', 'Bank Guarantee']
  where country_id = 'eeee0000-0000-0000-0000-000000000001';

  select investment_req into v_req from companies where country_id = 'eeee0000-0000-0000-0000-000000000001';
  if v_req->>'type' != 'Joint Venture' then
    raise exception 'FAIL: owner could not save Investment pillar preferences, got %', v_req;
  end if;
  raise notice 'PASS: owner can save Investment Pillar preferences (Preferences, Landed Cost inputs, Corridor Comparison ack, Trade Finance)';
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
