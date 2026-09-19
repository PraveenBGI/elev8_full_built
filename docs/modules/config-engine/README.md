# Phase 0.5 — Country/State Configuration Engine

**Status: schema, RBAC, resolver, and approval workflow built and
verified. First UI slice (Country Identity) built this session. Remaining
pillar/state/master-data screens are not started.**

## What this session built

The architectural spine that everything else in this module sits on:
countries, states, the admin RBAC model, the 8-pillar config storage, the
templates system, the approval workflow/audit log, and — the part that
actually matters — the resolver function that is the *only* way
company-facing code ever reads a pillar's effective configuration.

Not built yet: the actual UI screens for Country Identity, Master Data,
State Cluster management, Governance, Procurement, B2B, Import, Export,
Investment, Sustainability, ICV. Those come next, pillar by pillar, each
with its own Zod schema validating the `pillar_configs.payload` jsonb shape
before it's ever written.

## Tables

| Table | Purpose |
|---|---|
| `countries` | Country identity fields (name, currency, tax year, etc.) + `master_data` jsonb placeholder for HS codes/zones/ports that Phase 1 owns properly. |
| `country_ftas` | Normalized (not jsonb) — Phase 5/7's AI Classification/ICV engines need to query FTAs relationally. |
| `states` | One row per state, `config_control` (`central`/`state`) is the single delegation switch — see "Correction" below. |
| `config_admin_roles` | RBAC as a plain table, not a JWT claim — see "Why not a Supabase Auth claim" below. |
| `pillar_configs` | One row per (country or state) × (one of 8 pillars), `payload` jsonb. See "Why jsonb, not fully normalized" below. |
| `config_templates` | The 6 named economic presets (GCC Diversified Hub, Emerging/Import-Substitution, Export-Led, Industrial & FDI, Sustainability-Focused, ICV-Focused), extracted programmatically from the mockup's own `CONFIG_TEMPLATES` constant — see "How the templates were seeded" below. |
| `config_approval_events` | Append-only. Doubles as both the approval workflow log and the audit/rollup trail a Country Admin needs to see what a State Admin changed. |

## The resolver: `resolve_pillar_config(country_id, state_id, pillar)`

This is the actual security boundary, not a convention. `pillar_configs` has
**no SELECT policy at all** for ordinary company-scoped sessions — the only
way to read a pillar's effective config is this `SECURITY DEFINER` function,
which:

1. If a state is given and that state's `config_control = 'state'`, returns
   the state's own payload for that pillar (falling back to the country's if
   the state hasn't completed that pillar's pack yet, so a company never
   sees a broken/empty config just because a state's delegation is
   in-progress).
2. Otherwise returns the country's payload.

Verified with real role-switching against a real Postgres instance (see
"How this was verified" below) — a company-scoped session gets a `permission
denied`-equivalent zero rows querying `pillar_configs` directly, but gets
correct data through the resolver.

## Corrections made during this session

**1. Delegation is per-state, not per-pillar.** The original roadmap doc
(`02-MODULE-ROADMAP.md`) said "Central Config vs delegated State Config
toggle per pillar." Reading the actual mockup (`elev8-country-admin-config_3.html`'s
`setStateConfigControl()`) showed this is wrong: it's **one switch per
state** covering all 8 pillars together. A state is either fully on Central
Configuration, or a State Admin completes an entirely separate, standalone
8-pillar pack for that state. There's no field-level "inherit this,
override that." Schema reflects the corrected model.

**2. An approval workflow and a templates system exist and weren't in the
original roadmap doc at all.** `Draft → Submitted → Under Review →
Clarification Required → Approved → Published → Superseded`, plus 6 named
templates that patch specific pillars in one click. Both are now first-class
schema (`approval_status` columns + `config_approval_events`,
`config_templates`).

## Architecture decisions (and why)

**Why jsonb per pillar, not fully normalized columns:** Each pillar's data
is a genuinely deep, nested document (see any `config_templates.patch` row —
e.g. `procurement.evalWeights.technical`), and the spec is still evolving.
Normalizing every nested field into columns now means a schema migration for
every future field tweak to a UI still being designed. Postgres `jsonb` is
plain Postgres — it ports to AWS RDS unchanged, same as everything else in
this schema (`01-ARCHITECTURE-AND-PORTABILITY.md` §2). Zod schemas at the
app layer, built pillar-by-pillar as each UI screen is built, are what
actually validate shape before a write — the database stores it, the app
validates it.

**Why `country_ftas` is normalized while everything else in "master data"
is a jsonb placeholder:** FTAs are the one piece of country master data that
Phase 5 and 7's AI engines (HS Code/CEPA-Tariff Mapping, ICV Compliance —
see `03-AI-ENGINES-CLAUDE-API.md` §4) need to query relationally (join on
partner country, filter by effective date). Everything else in
`countries.master_data` (HS code packs, zones, ports, registration types,
units of measurement) is Phase 1 (Master Data)'s real ownership — building a
second half-normalized version of it here would just be rework to reconcile
later.

**Why `config_admin_roles` is a plain table, not a Supabase Auth custom
claim:** A JWT claim would work today but ties the RBAC model to Supabase
Auth's specific token shape. A plain table with its own RLS policies reads
identically regardless of which auth provider issued the session — Supabase
now, Cognito or a custom JWT service later (`01-ARCHITECTURE-AND-PORTABILITY.md`
§3). It also makes the audit/rollup query (`is_country_admin_of_state`) a
normal SQL join instead of something baked into token issuance.

## How the templates were seeded (accuracy note)

The 6 templates' nested `patch` payloads were **not hand-transcribed**.
`CONFIG_TEMPLATES` in the mockup is a JS object literal, not JSON, so it was
extracted with a small Node script (`eval()` on the isolated, locally-owned
file, then `JSON.stringify`) to guarantee the seeded data is byte-accurate
to the source mockup, not subject to manual transcription error. See git
history for `20260918000001_config_templates_seed.sql`'s generation if this
ever needs re-deriving from an updated mockup.

## How this was verified

No Docker in the build sandbox, so `supabase start` wasn't available for
local testing this session. Instead: installed plain PostgreSQL 16 directly,
built a minimal mock of what the Supabase *platform* provides (`auth.uid()`,
`auth.jwt()`, the `authenticated`/`anon`/`service_role` roles, and the
default privilege grants Supabase configures outside any migration file —
saved permanently as `tests/db/mock_supabase_platform.sql`), ran every
migration against it in order, then ran real role-switching tests proving:

- The resolver correctly picks state vs country config in all 3 cases
  (delegated state, non-delegated state, country-level call).
- A company-scoped session sees **zero** `pillar_configs` rows querying
  directly, but gets correct data through the resolver.
- A state admin sees exactly their own scope, nothing else.
- A state admin **cannot** write into a different state's config (RLS
  correctly rejects it).
- A country admin sees both their country's row and their states' rows
  (the audit/rollup requirement).

This is now a permanent CI job (`.github/workflows/ci.yml`'s `db-tests`
job), not a one-off manual check — it spins up a real Postgres service
container, applies the platform mock and every migration, then runs every
`tests/db/*.test.sql` file, which fail the build (nonzero exit via `RAISE
EXCEPTION`) on any wrong result. Any future migration that weakens this
boundary breaks the build automatically.

## Country Identity UI (this session)

The first pillar-free screen, at `/admin/config-engine/country`. Proves
form → Server Action → adapter → RLS end to end for this module, the same
role `/api/health` played for Phase 0.

- `lib/modules/config-engine/schemas.ts` — Zod schema is the real shape
  enforcement, since `countries`' columns are mostly permissive
  text/jsonb by design (see the migration's own comments on why).
- `lib/modules/config-engine/adapter.ts` — the only file querying
  `countries`/`config_admin_roles` for this module. `getMyAdminScope()`
  resolves the signed-in user's role from the database, never from a
  client-supplied value.
- The Server Action re-checks the caller's role itself rather than
  trusting the RLS policy alone to produce a clean error message — RLS is
  still what actually enforces the boundary; this is user-facing
  messaging, not a substitute for it.
- Covers Country Identity's scalar fields only. `corporate_classification`,
  `strategic_control`, `thrust_sectors`, and `master_data` are real jsonb
  columns already in the schema but have no UI or validation schema yet —
  that's the next slice.

**Verification ceiling in this sandbox:** the schema/adapter logic has
real unit tests (`tests/config-engine-schemas.test.ts`, 8 tests) and the
full app builds clean on a fresh clone (lint, typecheck, test, build all
verified per the discipline established after the LayoutProps incident).
What this sandbox cannot verify: the actual Server Action → Supabase round
trip with a real signed-in Country Admin session, since that needs a live
Supabase project, not the local Postgres mock used for the SQL-level
tests. That last mile is confirmed once deployed — the same boundary
Phase 0's `/api/health` had before real env vars were set.

## Open questions

1. **Who authors `config_templates`?** **Resolved this session**: BGI-curated only, read-only to admins, no self-service authoring. A separate `country_saved_configs` table gives Country Admins their own private, reusable pillar presets scoped to their own country — a different, lesser tier from the global template library, not a way around the "no self-service authoring" decision.
2. **Same Supabase project as legacy GBF, or a fresh one?** (Carried over from Phase 0's open question — still unresolved.)
3. **Does a Country Admin need write access to override a delegated
   state's config in an emergency**, or is the boundary meant to be
   absolute? **Resolved this session**: absolute. A Country Admin can see a delegated state's config (rollup/audit) but never write it. Two levers instead: `request_state_clarification()` (kicks it back for the State Admin to fix, with required notes) and `set_state_config_control()` (revoke delegation entirely, falls back to the country's config via the resolver, without touching or deleting anything the State Admin authored).
4. **Who reviews and approves a *country's* own submission?** New question, surfaced while building the approval workflow. There's no platform-wide admin role in this schema yet, so `approve_country_config()`/`publish_country_config()`/`request_country_clarification()` exist (for schema completeness and audit-trail symmetry with the state-level flow) but are only reachable via the Supabase service role — no app-facing role can call them. `submit_country_config_for_approval()` works normally (a Country Admin can submit their own country). This needs a real decision: introduce a platform admin role, or is a country's own submission auto-approved once submitted, or does this stay an ops-only manual action indefinitely?

## Two real bugs caught by this module's own verification (not by inspection)

Both were found because every change here is proven against a real, fresh Postgres before being called done — worth recording exactly how, since it's the argument for keeping doing this.

**1. `REVOKE ... FROM PUBLIC` was not enough to make a function
service-role-only.** Postgres grants `EXECUTE` on every newly created
function to `PUBLIC` by default (tables default to *no* access; functions
default to *open* access — an easy assumption to get backwards). The first
version of `approve_country_config()` etc. simply omitted a `GRANT` to
`authenticated`, assuming that meant "nobody but service_role can call
this." Test 9 proved that assumption wrong: an ordinary `country_admin`
session reached the function body successfully. Worse, the first fix
(`REVOKE ... FROM PUBLIC`) *also* didn't fully close it, because this
project's own default-privileges setup (`ALTER DEFAULT PRIVILEGES ... GRANT
EXECUTE ON FUNCTIONS TO authenticated`, needed so every *other* function
works without a manual grant) separately grants `authenticated` its own
explicit privilege, independent of `PUBLIC`. The real fix revokes from
`PUBLIC`, `authenticated`, and `anon` explicitly. This is now called out in
the migration file itself so it isn't silently reintroduced by a future
function that follows the same "just don't grant it" assumption.

**2. The test mock was missing a real Supabase default**, and it wasn't
the application code that was wrong. `tests/db/mock_supabase_platform.sql`
never granted `authenticated`/`anon` direct `EXECUTE` on `auth.uid()`/
`auth.jwt()`, so a test using the completely standard, documented Supabase
pattern `created_by: auth.uid()` in a plain insert failed locally — while
that exact pattern works fine against real Supabase, which grants this by
default. Fixed the mock, not the pattern. Worth remembering going forward:
when a test fails, check whether the *mock* is incomplete before assuming
the application code is wrong — the mock is a hand-maintained approximation
of a platform neither of us controls the source of.

## Legacy reference

None directly — the legacy JSRS/GBF system had no equivalent config engine
at all, just a `config.php` per country deployment and duplicated demo
instances (`demoin`/`demotz`/`demoom`). This module exists specifically to
replace that pattern.
