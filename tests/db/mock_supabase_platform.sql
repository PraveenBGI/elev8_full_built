-- Minimal mock of what the Supabase PLATFORM provides outside any migration
-- file (auth schema, auth.uid()/auth.jwt(), the authenticated/anon/
-- service_role roles, and default grants on public schema tables). Used
-- only to run our own migrations' RLS policies against plain Postgres in
-- CI (see .github/workflows/ci.yml) -- production Supabase provides all of
-- this natively; this file must never be applied to a real Supabase
-- project.

create role authenticated;
create role anon;
create role service_role;

create schema auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb;
$$;

grant usage on schema public to authenticated, anon;

-- Real Supabase sets default privileges so every NEW table automatically
-- grants authenticated/anon base access (RLS is the real gate, not table
-- grants) -- this must be ALTER DEFAULT PRIVILEGES, not a one-time GRANT,
-- because this mock runs before our migrations create any tables.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant execute on functions to authenticated;
