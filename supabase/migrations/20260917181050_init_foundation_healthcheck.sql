-- Phase 0 — Foundation
-- Purpose: prove the migration -> RLS -> adapter -> Server Component pattern
-- end to end with one real table, before any business schema is written.
--
-- Rollback: `drop table if exists public.foundation_healthcheck;`
-- Safe to drop entirely once Phase 1 (Master Data) has its own real tables
-- exercising the same pattern -- this table carries no business data.

create table if not exists public.foundation_healthcheck (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  -- Every tenant-scoped table in this project carries this column and this
  -- policy shape, per 01-ARCHITECTURE-AND-PORTABILITY.md section 6. This
  -- table is not really tenant data, but it's seeded with the real column
  -- so the pattern is visible from the very first migration.
  member_company_id uuid,
  created_at timestamptz not null default now()
);

alter table public.foundation_healthcheck enable row level security;

-- Anyone authenticated can read healthcheck rows scoped to their own
-- member_company_id, or rows with no tenant (member_company_id is null),
-- which is what the seed row below uses. Real business tables from Phase 1
-- onward will not have this "null is public" clause -- this is a
-- foundation-only convenience so the very first read works before
-- Phase 2 (Registration) exists to populate member_company_id at all.
create policy "tenant_isolation_or_public"
  on public.foundation_healthcheck
  for select
  using (
    member_company_id is null
    or member_company_id = (auth.jwt() ->> 'member_company_id')::uuid
  );

-- Seed row so Phase 0's Definition of Done ("one dummy table round-trips")
-- has something real to read on first deploy.
insert into public.foundation_healthcheck (message)
values ('elev8 foundation online')
on conflict do nothing;
