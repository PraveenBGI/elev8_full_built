# Progress Tracker
**Update this file at the end of every session. Read it first, every session, right after `00-MASTER-PLAN.md`.**

Last updated: 2026-09-19 (Phase 0.5 approval workflow enforced as a real state machine, CI green)

## Status legend
Not started · In progress · Blocked · Done

## Module status

| Phase | Module | Status | Notes / decisions locked | Open questions |
|---|---|---|---|---|
| 0 | Foundation (repo, CI, adapters skeleton) | **Done** | Live at `elev8-full-built.vercel.app`. `/api/health` confirms `"status": "connected"` against a real Supabase project (ref `trnzlhmhknrltqwmtuvs`). Migration applied, RLS proven end to end, CI green, adapter layer in place. 3 real bugs found and fixed during first deploy: `@types/node` peer conflict with vitest, wrong Claude model string (`claude-sonnet-4-5` → `claude-sonnet-5`), `.gitignore` accidentally excluding `.env.example`, and a Supabase-error-serialization bug in `/api/health` (`[object Object]` → readable errors). All fixed, committed, and verified. | None. |
| 0.5 | Country/State Config Engine | In progress | **Schema, RBAC, resolver, AND the approval workflow are now a real enforced state machine** (not just status columns anyone with table access could write). Narrow SECURITY DEFINER transition functions are the only way `approval_status` ever changes; a completeness gate blocks submission until all 8 pillars are ready; an auto-revert-to-draft trigger fires on any post-publish edit. `country_saved_configs` added (Country Admin's own private presets, distinct from BGI's `config_templates`). Two real bugs found and fixed by this module's own test suite before reaching any real database — see `docs/modules/config-engine/README.md`. 18 automated assertions across 2 test files, all passing in CI. **Not yet built: any UI screens.** | Who reviews/approves a *country's* own submission — no platform-admin role exists yet, so that path is currently service-role-only. |
| 1 | Master Data | Not started | — | — |
| 2 | Identity, Auth & Registration | Blocked | — | Decisions #1–#4 in `00-MASTER-PLAN.md` §4 unresolved |
| 3 | Company Profile, Supplier/Investor Subscription | Not started | — | — |
| 4 | Investment & Licensing | Not started | `elev8_invnode_be` is the reference for business rules, not for code | — |
| 5 | Sourcing / RFx Hub | Not started | Concept images 1–8 are the reference flow | — |
| 6 | Search | Not started | — | — |
| 7 | Contracts, Tenders, E-store, Quotations | Not started | — | — |
| 8 | Payment Gateway & Government Integrations | Not started | Needs a dedicated security/compliance review before code starts, per `02-MODULE-ROADMAP.md` | Who owns the PCI/compliance review? |

## AI engines status (cross-cutting, see `03-AI-ENGINES-CLAUDE-API.md` §4 for phase attachment)

| Engine capability | Status |
|---|---|
| Market/Import-Export/Corridor Intelligence | Not started |
| Company Intelligence | Not started |
| Export/Import Readiness Score | Not started |
| Investment Readiness Score | Not started |
| Tender Eligibility Score | Not started |
| Sustainability/ESG & ICV Compliance Scores | Not started |
| Credibility Assessment (X-Ray) | Not started — needs a sanctions/registry data source identified first |
| Supplier Discovery / Buyer-Supplier Recs | Not started |
| Investment Opportunity Matching | Not started |
| Corridor Matching (cross-instance) | Not started — needs a real cross-country data-sharing decision first |
| Tender-to-Supplier Matching | Not started |
| HS Code Classification / CEPA-Tariff Mapping | Not started |
| Tender/RFQ Document Parsing | Not started |
| ICV Spend Categorization | Not started |
| Alert capabilities (expiry/status/deadline) | Not started — plain scheduled jobs, no AI call needed |
| Business Narrator | Not started |
| Sustainability/ICV Recommendation Text | Not started |
| Compliance & Regulatory Assistant | Not started |
| Opportunity Canvas | Not started |
| Conversational Trade Assistant (router) | Not started |

## Session log

*Add one line per working session below, oldest first.*

- 2026-09-17 — Planning package created (this 6-file set). No code written yet. Legacy codebase fully audited (see prior chat/document: `BGI-elev8-GBF-Technical-Audit-and-Supabase-Vercel-Migration-Record.md`). Concept documents, registration spec, AI capability breakdown, and config engine mockups reviewed and mapped into this plan.
- 2026-09-18 — Phase 0 built, deployed, and verified live. Repo scaffolded (Next.js 16, TypeScript, Tailwind), adapter layer written (`lib/db`, `lib/auth`, `lib/storage`, `lib/ai`), CI green, pushed to `github.com/PraveenBGI/elev8_full_built`, imported into Vercel, real Supabase project linked (ref `trnzlhmhknrltqwmtuvs`), migration applied, `/api/health` confirms `"status": "connected"` in production. Four real issues hit during first deploy and fixed: npm peer-dependency conflict (`@types/node`), wrong Claude model string, `.gitignore` silently excluding `.env.example`, and unreadable error serialization in the health check. **Phase 0 Definition of Done fully met.**
- 2026-09-18 (same day, later) — Phase 0.5 schema spine built and verified: countries, states, config_admin_roles, pillar_configs, config_templates, config_approval_events, and the resolve_pillar_config() resolver, all with RLS. Read the actual mockups field-by-field and found two corrections to the original roadmap (per-state not per-pillar delegation; an approval workflow + templates system not previously captured). Verified against real Postgres (installed directly, no Docker available) with 8 passing role-switching assertions, now wired into CI as a permanent job. UI screens for the 8 pillars are not built yet -- that's the next session.
- 2026-09-19 — CI had been red on every single run since the first commit (confirmed via GitHub Actions history), not just on the Phase 0.5 push -- this had gone unnoticed because deploys were being verified via Vercel, not via the Actions tab. Root cause: `app/layout.tsx` used `LayoutProps<"/">`, a Next.js 16 type that only exists in `.next/types` after a build has run at least once. Passed in the sandbox (a build had already run there) but fails on every fresh checkout, which is what CI always is. Reproduced the failure on a genuinely clean `git clone` before fixing, fixed with the plain `{ children: React.ReactNode }` type, then re-verified lint/typecheck/test/build and the db-tests job all pass on a fresh clone. Lesson: a green build in this sandbox is not sufficient proof CI will be green -- the sandbox can carry stale build artifacts across steps that a fresh CI checkout never has. Verify on a clean clone going forward, not just in-place. **Confirmed fixed: both `verify` and `db-tests` green on GitHub Actions.**

## Phase 0.5 -- fully closed out

Both the schema (this session) and CI itself (previously silently broken, now fixed and green) are done. Remaining before Phase 0.5 is 100% complete: the actual UI screens (Country Identity, Master Data, State Cluster, and the 8 pillar forms). Next session picks up there -- Country Identity first, since it has no pillar dependency and proves the form -> adapter -> RLS chain for this module, the same role `/api/health` played for Phase 0.
- 2026-09-19 (same day, later) -- Made the approval workflow a genuinely enforced state machine instead of plain status columns: submit/approve/publish/request-clarification as narrow SECURITY DEFINER functions, each with its own authorization check, so nobody (not even country_admin on states, which had unrestricted column write before this) can move approval_status except through an audited, authorized transition. Added a completeness gate (all 8 pillars must be ready_for_review before submission) and an auto-revert-to-draft trigger on post-approval edits. Added country_saved_configs for private per-country presets. Two real bugs caught by the module's own verification before reaching any real database: (1) Postgres grants EXECUTE on new functions to PUBLIC by default, so 'just don't grant it' did not actually restrict the country-level approve/publish functions -- needed explicit REVOKE from PUBLIC, authenticated, AND anon; (2) the test mock itself was missing Supabase's real default grant letting authenticated/anon call auth.uid()/auth.jwt() directly, which is not an application bug, it's the mock lagging reality. 18 assertions across 2 test files, all passing on a fresh clone exactly as CI runs it.

## How to resume in a new chat

1. Attach all 6 files in this package as Claude Project knowledge (if not already there).
2. Say: "Continue from the progress tracker."
3. Claude should read this file's Module status table, find the first row that is not Done, check whether it's Blocked (and on what), and either resolve the blocker with you or start that module's work per `02-MODULE-ROADMAP.md` and `04-BUILD-STANDARDS.md`.
