# Module Roadmap

Sequenced by dependency and risk, not by feature glamour. Each phase lists
what it needs before it can start, what it produces, and what "done" means.
No phase starts until the one before it (where dependent) is marked Done in
`05-PROGRESS-TRACKER.md`.

Source mapping notes point back to the legacy audit and concept documents so
nothing here is invented from nothing — every module traces to either a
legacy `api/modules/<code>` equivalent, a concept document, or both.

---

## Phase 0 — Foundation
**Depends on:** nothing.
**Build:** repo scaffold, Supabase project, adapter layer skeleton (`lib/db`,
`lib/auth`, `lib/storage`, `lib/ai` — empty but structured), CI pipeline
(lint + typecheck + test on every push), Vercel project linked.
**Definition of Done:** a Next.js app deploys to Vercel, connects to Supabase,
one dummy table round-trips through the adapter layer, CI is green.

## Phase 0.5 — Country/State Configuration Engine
**Depends on:** Phase 0.
**Source:** `elev8-country-admin-config_3.html`, `elev8-state-config-muscat_3.html` (already fully mocked up — this phase is closest to "just build the spec").
**Build:** the hierarchical config model: Country (National Cluster) → State (State Cluster), each carrying identity (currency, tax, dial code, financial year), FTAs, thrust sectors, tiered support partners, and 8 pillars (Governance, Procurement, B2B, Import, Export, Investment, Sustainability, ICV). **Correction, found reading the actual mockup (see `docs/modules/config-engine/README.md`):** state delegation is one switch per state (`config_control: 'central' | 'state'`) covering all 8 pillars together, not a per-pillar toggle — a delegated state gets a fully separate, standalone 8-pillar pack, not field-level inheritance. Also includes an approval workflow (`Draft → Submitted → Under Review → Clarification Required → Approved → Published → Superseded`) and 6 named Configuration Templates that patch specific pillars in one click.
**Why second:** every other module reads from this (currency formatting, tax calculation, which authorities apply, which FTAs are active) — legacy had this scattered across per-country `config.php` files and duplicated demo instances; this is the fix.
**Definition of Done:** a country can be fully configured through the UI, a state can be configured under it (either inheriting Central Configuration or running its own fully delegated pack), and at least one other module (master data, below) successfully reads a resolved config value from it via `resolve_pillar_config()` — never by querying config tables directly.
**Status:** schema/RBAC/resolver done and verified (see progress tracker). UI screens not yet built.

## Phase 1 — Master Data
**Depends on:** Phase 0.5.
**Source:** legacy `api/modules/mst` (219 files — the largest single module in GBF core).
**Build:** countries, sectors, classifications, product/service masters, HS code reference tables, geo hierarchy (state/city, and Oman's wilayat level specifically, since it's in the legacy schema).
**Why third:** almost pure reference data, mostly reads, proves the pattern (migration → RLS → adapter → Server Component) with real data before anything transactional depends on it.
**Definition of Done:** all master tables migrated and seeded, a Server Component page lists and filters at least one master data set end to end.

## Phase 2 — Identity, Auth & Registration
**Depends on:** Phase 1. **Blocked on decisions #1–#4 in `00-MASTER-PLAN.md`.**
**Source:** `elev8_Registration_Field_Document_v1_0.docx` + `Registration__Form_Screens__1_.docx` (the wizard spec) and `conversational-onboarding-blueprint.md` (the AI-conversation alternative).
**Build:** whichever mode is decided — most likely both, wizard as the default/fallback and conversation as an enhanced mode reusing the same underlying field list and validation rules, per the blueprint's own "generic vs platform-specific" separation. Intent type (Company/Project Owner/Buyer), 4-step wizard fields, OTP email verification, password + 6-digit PIN credential setup, Enterprise Classification computation.
**Definition of Done:** a user can register end to end (whichever mode(s) are built), receive OTP, set credentials, land on a dashboard, and their tenant boundary (Phase 0's RLS pattern) is active from the first record they create.

## Phase 3 — Company/Member Profile, Supplier & Investor Subscription
**Depends on:** Phase 2.
**Source:** legacy `mcp` (Master Company Profile) module, Registration Field Document §5–6 (Supplier/Investor registration).
**Build:** company profile (inherits from registration), Supplier registration/subscription (package tiers: Essential/Professional/Enterprise), Investor registration/subscription (fixed fee), computed totals + VAT.
**Definition of Done:** a registered company can subscribe as Supplier or Investor, see correct computed fees, and reach a payment step (payment integration itself is Phase 9, this just needs to produce a correct order/invoice record to hand off to it).

## Phase 4 — Investment & Licensing
**Depends on:** Phase 3.
**Source:** `elev8_invnode_be`'s 19 modules — this is the best-architected legacy code and the clearest existing model for this domain (investment, investor-hub, license-authority, license-permits, license-tracker, project with its 10 sub-areas, diligence, trade).
**Build:** port the *business rules*, not the code, into the new stack — project listings, investment tracking, license application/tracking workflows, investor-hub matching hooks (Matching Engine attaches here later, see AI doc).
**Definition of Done:** a project owner can list a project, an investor can view and express interest, and the data model supports the Assessment Engine's Investment Readiness Score (see `03-AI-ENGINES-CLAUDE-API.md`) without a schema change.

## Phase 5 — Sourcing / RFx Hub
**Depends on:** Phase 3.
**Source:** `elev8_sourcing_be`/`elev8_sourcing_fe` (creatinghub, listinghub, rfxlist, targetsuppliers, showinteresthub) and the hand-drawn Export/Import/Skycard flows (concept images 1–8).
**Build:** the full trade lifecycle from the concept sketches: product/service listing → buyer discovery → send/receive enquiry → quotation → negotiation → PO → shipment tracking → customs → payment → performance dashboard, for both export and import directions, plus the lighter "skycard" inquiry/order variant for simpler deals.
**Definition of Done:** one full export cycle (list a product → receive an enquiry → send a quotation → confirm a PO) runs end to end with real data, matching the concept sketch's flow exactly.

## Phase 6 — Search
**Depends on:** Phase 1 and 5 having some real data to search.
**Source:** `elev8_node_be` (`elev8_search_be`) — already the cleanest legacy piece conceptually: live FULLTEXT search with keyset pagination, replacing a stale batch-rebuilt table.
**Build:** Postgres full-text search (`tsvector`/`tsquery`) or `pg_trgm`, same keyset pagination approach, across supplier/product/service/buyer records.
**Definition of Done:** search returns live results (not a cached/batch table) with the same pagination behavior as the legacy service, over real Phase 1/5 data.

## Phase 7 — Contracts, Tenders, E-store, Quotations
**Depends on:** Phase 5.
**Source:** the largest remaining chunk of legacy `api/modules` (`ct`, `tend`, `estore`, `pd`, `quot`, `gcc`, `icv`) — 400+ files combined in the legacy code.
**Build:** tender publishing and response, e-store listings, formal quotation documents, GCC cross-border tender subscriptions, ICV (in-country value) tracking and scoring hooks.
**Definition of Done:** a tender can be published, a supplier can respond, and ICV/CEPA data captured elsewhere (Phase 5's shipment form fields) feeds correctly into ICV compliance tracking.

## Phase 8 — Payment Gateway & Government Integrations
**Depends on:** everything above having a working order/subscription/invoice record to attach to.
**Source:** legacy `ipay/` (iPAY/CyberSource, PCI-scoped) and `MociipController`/`MolController` (Oman MOCI/MOL government registry integrations).
**Build, deliberately last:** these are live regulated external contracts, not internal design choices. Needs its own security review before any code is written. Likely outcome: a thin, isolated integration layer rather than a full reimplementation, so the blast radius of any issue stays small.
**Definition of Done:** a real payment can be taken end to end in a sandboxed/test mode against the actual gateway, and a MOCI/MOL lookup returns real data, both reviewed by whoever owns compliance for these before going live.

---

## Cross-cutting: the AI engines are not a phase

Per `Elev8_AI_Capability_Breakdown__1_.xlsx`, each of the six engines attaches
to the module it augments, not to one big "AI phase" at the end. See
`03-AI-ENGINES-CLAUDE-API.md` for exactly which engine attaches to which
phase above, and build it alongside that phase, not after it.
