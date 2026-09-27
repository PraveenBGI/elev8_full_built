# Company Configuration (the Preference Engine)

**Status: Phase 1 started (Business Identity, Role, Trade Intent built).
6 more Enterprise Configuration steps and the entire Pillars Configuration
phase remain.**

## What this actually is

Not a company-scoped copy of the Country/State Config Engine
(`docs/modules/config-engine/`). That module is the **rules** layer:
tender thresholds, evaluation weights, which tender types are legal
instruments. This module is a company's own **preferences** within
those rules: what it wants gatewAI to surface, match, and alert on.

Source: `elev8-final__1___2_.html`, a genuinely different mockup from
`elev8-country-admin-config_3.html`, read field-by-field the same way
every other module in this project was.

## The full scope (for when this comes back up)

Four phases, ~35 steps total, per the mockup's own `STEPS` constant:

- **Phase 1 — Enterprise Configuration** (7 steps): Business Identity →
  Role → Trade Intent → Geography & Corridors → Target Market Priority →
  Business Objectives (Goals) → Commercial Terms. **This session built
  the first 3.**
- **Phase 2 — Pillars Configuration**: Pillar Selection (AI-recommended
  from Role + Goals, via the mockup's own `ROLE_PILLAR_MATRIX` /
  `GOAL_PILLAR_MAP`) and Pillar Preferences, then a sub-group per pillar
  (Governance: 3 steps, Procurement: 3, B2B: 3, Import: 4, Export: 4,
  Investment: 4, Sustainability: 3, ICV: 4).
- **Phase 3 — AI & Alerts Configuration**: AI Autonomy & Matching, Alerts
  & Notifications.
- **Config Summary**: Review & Publish.

None of Phase 2, 3, or the rest of Phase 1 are built yet.

## This session: the foundation + first 3 steps

### The prerequisite that didn't exist before this session

There was no concept of a "company" anywhere in the schema — every
table (`config_admin_roles`, `pillar_configs`, everything) was scoped to
`country_admin`/`state_admin` only. New this session:

- **`companies`** — country_id references the real `countries` table
  (not the mockup's own 12-country `CNAMES` demo fixture), plus the
  fields for Business Identity, Role, and Trade Intent.
- **`company_users`** — many-to-many (a user can belong to more than one
  company; a company can have more than one user).
- **`create_company()`** — the *only* sanctioned way a company is ever
  created. Atomically creates the row and makes the caller its owner,
  in one transaction. Unlike `config_admin_roles` (a high-trust platform
  role with no self-service grant), any authenticated user can create
  their own company directly — a deliberate, documented distinction, not
  an oversight: creating your own company profile is normal self-service,
  becoming a Country Admin is not.

### RLS is private by default — a real difference from Country/State config

`countries`/`states` are broadly readable (every other module depends on
reading them). `companies`/`company_users` are **not** — this is
competitive business data (trade intent, competitors, strategic
statements), visible only to that company's own members. A future
"public profile subset" for B2B discovery/matching (Phase 5+) is a real,
separate feature to design later, not implied by loosening this policy
now.

### A real bug this migration's own test caught before it ever reached a database

The `company_users` SELECT policy's first draft used a raw subquery:
`company_id in (select company_id from company_users where user_id =
auth.uid())` — querying the very table the policy protects. This caused
**infinite recursion**, caught immediately by `tests/db/company-config.test.sql`.
Fixed by routing through the already-existing `is_company_member()`
`SECURITY DEFINER` function instead, which bypasses RLS while it
executes and so doesn't re-trigger the calling policy. Verified fixed on
a fresh database before this went anywhere near the app code.

### UI: `/company`

Two states, one page: no company yet (a short create-company form) or an
existing company (three `SettingsGroup` sections — Business Identity,
Role, Trade Intent). `SettingsGroup` itself moved from
`app/admin/config-engine/` to `components/`, since it's now genuinely
shared across two different modules, not just reused within one route
group.

Verified with 6 database assertions (create, private-by-default,
recursion fix, invalid-type rejection, direct-insert-is-impossible) and
11 schema unit tests. 45 total DB assertions now pass across 6 test
files; 55 total app-level tests pass.

## A real test bug worth remembering (not a code bug)

The first version of the schema unit tests used
`"11111111-1111-1111-1111-111111111111"` as a placeholder UUID in test
fixtures. Zod's `.uuid()` correctly rejected it — that string isn't
actually a valid RFC 4122 UUID (the variant nibble must be `8`/`9`/`a`/`b`,
not an arbitrary digit). The schema was right; the test fixture was
lazy. Fixed the fixture, not the schema, after confirming which one was
actually wrong by testing directly rather than assuming either was
correct.

## Geography & Corridors (this session) -- 4th of 7 Enterprise Configuration steps

`/company` now has a fourth section. **Real integration with State
Cluster**, built early in this whole project: a company's home country,
and each corridor country they follow, gets a real governorate/state
picker if that country has actual platform states configured (via
`config-engine`'s `listCountryStates()`, reused directly, not
duplicated). Falls back to a free-text add/remove list when the country
has no platform states, matching the mockup's own exact fallback text
("No governorate data for this country, add states manually").

**`home_country_id` is deliberately separate from `companies.country_id`**
(Business Identity's registration country) -- the mockup's own state
object keeps these as two distinct fields, not one value duplicated.
Collapsing them would have been a real, unstated modeling decision, not
a harmless simplification.

`corridor_country_ids` (a `uuid[]`) and `corridor_states` (`jsonb`,
keyed by corridor country id) hold the follower's chosen international
corridors and per-corridor state names -- state names are plain
strings, not foreign keys, same reasoning as every other Master Data
picker in this project.

Verified against real Postgres before any UI was written: 1 new
assertion, 56 total DB assertions across 7 test files, all 55
pre-existing ones re-confirmed unchanged after the migration. 5 new
schema unit tests, 96 total app-level tests.

**Enterprise Configuration is now 4 of 7 steps done**: Business
Identity, Role, Trade Intent, Geography & Corridors. Remaining: Target
Market Priority, Business Objectives (Goals), Commercial Terms.

## Target Market Priority (this session) -- 5th of 7 Enterprise Configuration steps

Genuinely simple by design: this step has no data of its own beyond a
priority ranking. It reuses Geography & Corridors' own home/corridor
countries (which countries to rank) and corridor states (which
countries get a state-level sub-ranking too), matching the mockup's own
comment: "Reuses that selection rather than asking again." No new
lookups, no new master data.

`market_priority` and `state_priority` are both `jsonb`, keyed by
country UUID as a jsonb key (a string) -- consistent with Geography's
own `corridor_states`, not the mockup's 2-letter country codes.

**A second lint catch this session**, same category as Sustainability's:
an unescaped apostrophe in JSX text ("gatewAI's scoring"), caught by
`react/no-unescaped-entities` on the fresh-clone lint pass, fixed with
`&apos;`.

Verified against real Postgres before any UI was written: 1 new
assertion, 57 total DB assertions across 7 test files. 4 new schema
unit tests, **100 total app-level tests** (a clean round number,
noted only because it's a nice coincidence, not a target).

**Enterprise Configuration is now 5 of 7 steps built**: Business
Identity, Role, Trade Intent, Geography & Corridors, Target Market
Priority. Remaining: Business Objectives (Goals), Commercial Terms.

## Open questions

1. **How does a user end up in `company_users` for a company they didn't
   create?** Right now, only `create_company()` populates this table
   (the creator, as owner). There's no "invite a colleague" flow yet —
   a real feature to design, not an oversight.
2. **`prefLevel: 'individual'`** (a personal preference layer on top of
   company-wide settings) is captured as a column value but has no actual
   effect yet — no per-user override mechanism exists. Building it means
   deciding how an individual's overrides compose with the company-wide
   config, which is a real design question, not just more schema.
3. **Sector as a fixed enum** (`COMPANY_SECTORS`) has the same
   reconciliation-with-Phase-1 question as `country_hs_codes` — Phase 1
   (Master Data, the platform-wide reference-data phase) will eventually
   own a real sector master; this fixed list is a placeholder matching
   the mockup exactly, not a permanent decision.
4. **Relationship to Phase 2/3 in the original roadmap.** This module
   overlaps significantly with "Phase 3 — Company/Member Profile" in
   `02-MODULE-ROADMAP.md`, but is richer than what that phase originally
   scoped. Worth reconciling the two documents once this module is
   further along, so there isn't a stale, smaller description sitting in
   the roadmap alongside this fuller one.

## Legacy reference

None directly comparable — the closest legacy analogue is scattered
across `mcp` (Master Company Profile) and various per-module preference
flags in the old PHP system, none of it unified into one coherent
preference engine the way this mockup specs it.
