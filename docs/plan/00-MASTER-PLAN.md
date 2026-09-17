# elev8 Rebuild — Master Plan
**Read this file first, in every new chat, before anything else.**

This is the root document of a 6-file planning package. It exists so a Claude
Project can survive context resets: paste or attach all 6 files as Project
knowledge, and every new conversation starts by reading this file plus
`05-PROGRESS-TRACKER.md`, which together say exactly where the build stands.

---

## 1. The prime directive

**Never break running code. Build module by module. Nothing starts until the
previous module passes its Definition of Done.**

This is not a hackathon build. It is a from-scratch rewrite of a platform that
already has a working legacy system in production (JSRS/GBF) and a partial
rebuild already live (`demoin.elev8framework.com`). Every module built here
must be correct enough that it never has to be secretly redone later. Speed is
not the constraint. Correctness and portability are.

## 2. The file package

| File | What it's for | Read it when |
|---|---|---|
| `00-MASTER-PLAN.md` | This file. Principles, index, current blocking decisions. | Every new chat, first. |
| `01-ARCHITECTURE-AND-PORTABILITY.md` | Stack choice, and the exact rules that keep the database portable from Supabase to any Postgres (AWS RDS included). | Before writing any schema, migration, or infra code. |
| `02-MODULE-ROADMAP.md` | The full phase-by-phase build order, each phase with its own Definition of Done. | Before starting any new module, and when deciding what's next. |
| `03-AI-ENGINES-CLAUDE-API.md` | How the 6 AI engines + Conversational Trade Assistant are built on the Claude API specifically. | Before touching any AI feature. |
| `04-BUILD-STANDARDS.md` | Git workflow, migration discipline, testing gates, the actual "never mess up the code" rules. | Before every commit, every module handoff. |
| `05-PROGRESS-TRACKER.md` | Living status table. Updated at the end of every session. | First thing, every session — this tells you where the last session left off. |

## 3. Non-negotiables (apply to every module, no exceptions)

1. Every schema change is a numbered SQL migration file in git. Never a manual change through the Supabase Studio UI on anything that matters.
2. Every module's data-access code goes through a typed adapter layer — no direct Supabase client calls scattered through UI components. This is what makes the AWS move possible later without a rewrite.
3. Every AI call goes through the shared `lib/ai/` layer, never called ad hoc from a route or component. Same reason: swappable, auditable, cacheable.
4. Nothing is "done" without: migration applied + RLS policy written + typed access layer + at least one integration test + a short README in that module's folder. See `04-BUILD-STANDARDS.md`.
5. A module is not started until its open questions (see `02-MODULE-ROADMAP.md`) are answered and logged in the progress tracker. Guessing at business rules now costs more later than asking now.

## 4. Currently blocking decisions

These stop specific phases from starting. Everything else can proceed.

| # | Decision | Blocks | Status |
|---|---|---|---|
| 1 | Registration: traditional wizard (per `elev8_Registration_Field_Document_v1_0.docx`) vs AI-conversation replacing it (per `conversational-onboarding-blueprint.md`) vs both, with conversation as an alternate mode | Phase 2 (Identity & Registration) | **Open — needs your call.** |
| 2 | Enterprise Classification thresholds (Employee/Turnover bands to Micro/Small/Medium/…) and turnover currency per cluster | Phase 2 | Open — needs business sign-off, noted as an open item in the field document itself. |
| 3 | Whether Project Owner / Buyer intents follow the same 4-step wizard as Company or diverge after Step 1 | Phase 2 | Open — same source. |
| 4 | Exact option sets for dropdowns (Incorporation Style, Industry/Sector, Department, Objective, How-heard) | Phase 2 | Open. |

Nothing else is blocked. Phase 0, 0.5, and 1 (foundation, Config Engine, master data) can start immediately regardless of how #1 to #4 resolve.

## 5. What "done with this package" looks like

This package is complete when you can open a brand new Claude Project chat,
paste in nothing but these 6 files, say "continue," and get a correct answer
about exactly what to build next — with zero re-explaining from you.
