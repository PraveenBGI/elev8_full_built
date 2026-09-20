-- Phase 0.5 -- Country Master Data: HS Code Packs
--
-- Source: elev8-country-admin-config_3.html's masterdata__hs-code-packs
-- section -- named, reusable bundles of the codes in country_hs_codes, so
-- "Import's HS Code Coverage and Export's Priority HS Codes can apply a
-- whole Pack in one click instead of toggling codes one at a time" (the
-- mockup's own note).
--
-- codes is text[] referencing country_hs_codes.code by value (not a
-- foreign key to its id), matching the mockup's own approach: a pack's
-- membership is checked by code string equality
-- (p.codes.includes(h.code)), not by a join table. This keeps deletes
-- simple (removing an HS code doesn't need to cascade into every pack
-- that happened to reference it -- a pack just silently stops matching
-- that code, which is the same behavior the mockup has).
--
-- Rollback: drop table if exists public.country_hs_code_packs;

create table public.country_hs_code_packs (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null,
  description text,
  codes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (country_id, name)
);

create index on public.country_hs_code_packs (country_id);

alter table public.country_hs_code_packs enable row level security;

-- Same shape as country_hs_codes: broadly readable (Import/Export need to
-- apply a pack), writable only by that country's Country Admin.
create policy "country_hs_code_packs_select_any_authenticated"
  on public.country_hs_code_packs for select
  to authenticated
  using (true);

create policy "country_hs_code_packs_write_country_admin_only"
  on public.country_hs_code_packs for all
  to authenticated
  using (is_country_admin(country_id))
  with check (is_country_admin(country_id));
