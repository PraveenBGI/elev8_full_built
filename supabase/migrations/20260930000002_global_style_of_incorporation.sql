-- Global Style of Incorporation Master -- third slice of Phase 1
-- (Master Data), same shape as the global Sector Master
-- (20260930000000_global_sector_master.sql): a genuinely global
-- (no country_id) reference table, confirmed via the LyPIS/elev8
-- architecture diagrams' own "3. MASTER MAINTENANCE" panel listing
-- "2. Corporate Master -> 3.1 Classification, 3.2 Style of
-- Incorporation, 3.3 Special Identity (LCC etc)" under Portal Admin.
--
-- Deliberately scoped to Style of Incorporation alone, not the full
-- Corporate Master. Two related concepts from the same KT-package
-- discussion were deliberately NOT built here, and why:
--   - Classification Type: the FRD marks this non-editable, computed
--     at registration (Employee Count + Annual Turnover, per the legacy
--     Master Company Profile guide's Enterprise Classification logic)
--     and just displayed on Business Identity, never picked from a
--     dropdown. Can't be built properly until Phase 2 (Registration)
--     exists -- a fake version now would need redoing later.
--   - Special Identity (LCC etc): genuinely unclear from the sources
--     reviewed so far whether this is a third field or a qualifier on
--     Style of Incorporation itself (an LLC that also carries Local
--     Content Certificate status, for instance) -- left out rather
--     than guessed at.
--
-- RLS and seed-growth discipline identical to Sector Master: read-open
-- to any authenticated user, no write policy (no Portal Admin / Super
-- Admin role exists yet to gate one against), corrections via a new
-- migration.
--
-- Rollback:
--   alter table public.companies drop column if exists style_of_incorporation;
--   drop table if exists public.styles_of_incorporation;

create table public.styles_of_incorporation (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

alter table public.styles_of_incorporation enable row level security;

create policy "styles_of_incorporation_select_any_authenticated"
  on public.styles_of_incorporation for select
  to authenticated
  using (true);

-- Seed: a real, jurisdiction-general set covering the incorporation
-- styles that actually recur across Oman, India, Tanzania and the
-- other countries already named throughout this build, not an attempt
-- at exhaustive global coverage -- extending it is a new migration,
-- same discipline as Sector Master.
insert into public.styles_of_incorporation (name, sort_order) values
  ('Limited Liability Company (LLC)', 10),
  ('Sole Proprietorship', 20),
  ('General Partnership', 30),
  ('Limited Partnership', 40),
  ('Joint Stock Company (SAOC/SAOG)', 50),
  ('Public Limited Company', 60),
  ('Private Limited Company', 70),
  ('Branch of a Foreign Company', 80),
  ('Representative Office', 90),
  ('Government / State-Owned Entity', 100),
  ('Cooperative', 110),
  ('Other', 999);

-- Column added as validated free text matched by name, not a foreign
-- key -- same modeling choice as sector on companies, home_state, and
-- every other DB-backed-but-text-stored picker in this project.
alter table public.companies
  add column style_of_incorporation text;
