# Phase 0 — Foundation

## What it does

Repo scaffold (Next.js App Router, TypeScript, Tailwind), the adapter layer
skeleton (`lib/db`, `lib/auth`, `lib/storage`, `lib/ai`), CI (GitHub Actions:
lint + typecheck + test + build on every push), and one real end-to-end
round trip through the database (`foundation_healthcheck` table) to prove
the pattern before any business schema exists.

Nothing in this phase is a product feature. It's the thing every later
module builds on top of.

## Tables

- `foundation_healthcheck` — one seed row, no business meaning. Exists to
  prove migration → RLS → adapter → route works end to end. Safe to drop
  once Phase 1 (Master Data) has its own real tables doing the same job.

## Adapter files (see `01-ARCHITECTURE-AND-PORTABILITY.md` §3)

- `lib/db/client.ts` — the only file that imports `@supabase/supabase-js` /
  `@supabase/ssr`.
- `lib/auth/adapter.ts` — the only file that calls `supabase.auth.*`.
- `lib/storage/adapter.ts` — the only file that calls Supabase Storage.
- `lib/ai/client.ts` — the only file that imports `@anthropic-ai/sdk`.

Every one of these branches on an env var (`DB_PROVIDER`, `AUTH_PROVIDER`,
`STORAGE_PROVIDER`) and throws a clear error if asked for a provider that
isn't implemented yet, rather than silently doing the wrong thing.

## How to verify this phase's Definition of Done

1. `GET /api/health` returns `"status": "connected"` with the seed row's
   message, once Supabase env vars are set in Vercel (see the deploy
   instructions this was handed over with).
2. CI is green on the `main` branch (Actions tab in GitHub).
3. `npm run lint && npm run typecheck && npm run test && npm run build` all
   pass.

## Open questions

None for this phase. Phase 0.5 (Config Engine) is next and has no blockers.

## Legacy reference

None — this phase has no legacy equivalent. The closest thing in the old
system was ad hoc: no CI, no migration history, a `config.php` per country
copy-pasted per deployment. This phase exists specifically because that
didn't work.
