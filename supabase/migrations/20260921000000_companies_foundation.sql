-- New module -- Company Configuration (the Preference Engine), Phase 1:
-- "Enterprise Configuration". Source: the newly uploaded
-- elev8-final__1___2_.html mockup, read field-by-field, same discipline
-- as every other module.
--
-- This is a genuinely different tier from everything built so far.
-- Country/State config (previous migrations) is the RULES layer --
-- tender thresholds, evaluation weights, legal tender types. Company
-- config is a company's own PREFERENCES within those rules -- what it
-- wants gatewAI to surface, match, and alert on. See
-- docs/modules/company-config/README.md for the full picture.
--
-- Scope THIS migration covers: Business Identity, Role, and Trade Intent
-- -- the first 3 of the mockup's 7 "Enterprise Configuration" steps.
-- Geography & Corridors, Target Market Priority, Business Objectives
-- (Goals), and Commercial Terms are NOT built yet -- deferred to a
-- follow-up migration once their own UI is built, not spliced in now as
-- speculative columns.
--
-- Rollback:
--   drop table if exists public.company_users;
--   drop function if exists public.create_company;
--   drop table if exists public.companies;

-- ── Companies ────────────────────────────────────────────────────────────
-- country_id references the REAL countries table (built for Phase 0.5),
-- not a duplicated fixed list -- the mockup's own CNAMES constant was a
-- 12-country demo fixture, the real product has actual country data
-- already.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id),

  -- Business Identity
  name text not null,
  type text,
  sector text,
  size text,
  year_established int,
  annual_revenue text,
  trade_years text,
  countries_exported_to int,
  differentiator text,
  -- 'company' = applies to every user in this company; 'individual' = a
  -- personal layer on top of company-wide settings. Only 'company' is
  -- meaningful until per-user preference overrides are built (a real,
  -- separate feature, not implied by this column alone).
  pref_level text not null default 'company' check (pref_level in ('company', 'individual')),

  -- Role
  primary_role text,
  secondary_roles text[] not null default '{}',

  -- Trade Intent
  sell_intents text[] not null default '{}',
  buy_intents text[] not null default '{}',
  strategic_intent text,
  existing_partners text,
  competitors text,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint companies_type_check check (
    type is null or type in (
      'Buyer Organization', 'Seller / Supplier Organization', 'Government Entity',
      'SME', 'Startup', 'Consultant', 'Logistics Provider', 'Financial Institution'
    )
  ),
  constraint companies_primary_role_check check (
    primary_role is null or primary_role in (
      'Buyer', 'Seller / Supplier', 'Importer', 'Exporter', 'Investor', 'Project Owner'
    )
  )
);

create index on public.companies (country_id);

-- ── Company users ────────────────────────────────────────────────────────
-- Many-to-many: a user can belong to more than one company, a company can
-- have more than one user. No self-service "become a Country Admin" flow
-- exists (config_admin_roles, foundation migration) because that's a
-- high-trust platform role; a company is different -- any authenticated
-- user creating their OWN company profile is normal self-service, not a
-- privileged grant, so create_company() below lets any signed-in user do
-- it directly.

create type public.company_user_role as enum ('owner', 'member');

create table public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_user_role not null default 'member',
  created_at timestamptz not null default now(),

  unique (company_id, user_id)
);

create index on public.company_users (user_id);
create index on public.company_users (company_id);

-- Helper for RLS below, same STABLE + SECURITY DEFINER pattern as
-- is_country_admin() in the foundation migration. Reused directly by
-- company_users' own SELECT policy too (see that policy's comment) --
-- calling this function doesn't recurse even though it queries
-- company_users, because SECURITY DEFINER bypasses RLS while executing.
create or replace function public.is_company_member(p_company_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from company_users
    where user_id = auth.uid() and company_id = p_company_id
  );
$$;

-- ── The only way a company is ever created ──────────────────────────────
-- Atomic: inserts the company AND makes the caller its owner in one
-- transaction. Never done as two separate client-side inserts -- that
-- would let a malicious or buggy client create a company row without
-- linking themselves, or link themselves to a company they don't own.

create or replace function public.create_company(
  p_country_id uuid,
  p_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Must be signed in to create a company.';
  end if;
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Company name is required.';
  end if;

  insert into companies (country_id, name, created_by)
  values (p_country_id, p_name, auth.uid())
  returning id into v_company_id;

  insert into company_users (company_id, user_id, role)
  values (v_company_id, auth.uid(), 'owner');

  return v_company_id;
end;
$$;

grant execute on function public.create_company(uuid, text) to authenticated;

-- ── Row Level Security ───────────────────────────────────────────────────
-- Deliberately NOT broadly readable like countries/states -- this is
-- private business data (trade intent, competitors, strategic
-- statements), not public platform infrastructure. Only a company's own
-- members can read or write it. A future "public profile subset" for
-- B2B discovery/matching is a real, separate feature to design later,
-- not implied by loosening this policy now.

alter table public.companies enable row level security;
alter table public.company_users enable row level security;

create policy "companies_member_rw"
  on public.companies for all
  to authenticated
  using (is_company_member(id))
  with check (is_company_member(id));

create policy "company_users_own_or_same_company"
  on public.company_users for select
  to authenticated
  using (
    user_id = auth.uid()
    -- Calling is_company_member() here, not a raw subquery on
    -- company_users -- a raw subquery caused infinite recursion (this
    -- policy querying the very table it protects), caught by this
    -- migration's own test before it ever reached a real database. The
    -- function call is safe because SECURITY DEFINER bypasses RLS while
    -- it executes, so it doesn't re-trigger this policy.
    or is_company_member(company_id)
  );
