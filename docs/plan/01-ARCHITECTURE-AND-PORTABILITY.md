# Architecture & Database Portability

## 1. Stack

- **Frontend + backend**: Next.js (App Router, TypeScript). Server Components and Server Actions do the work that Yii2 controllers/API modules did in the legacy stack. API Routes only where a real HTTP endpoint is needed (webhooks, external integrations).
- **Database**: Postgres via Supabase now. Target: swappable to any Postgres, specifically AWS RDS/Aurora Postgres, later. This document exists to make that swap a config change, not a rewrite.
- **Auth**: Supabase Auth now, behind an internal adapter (see §3).
- **Storage**: Supabase Storage now, behind an internal adapter (see §3).
- **AI**: Claude API (Anthropic), behind an internal adapter (see `03-AI-ENGINES-CLAUDE-API.md`).
- **Hosting**: Vercel.
- **Deployment/schema tooling**: Supabase CLI, plain SQL migrations, checked into git.

## 2. The one rule that matters

**Postgres itself is portable. Supabase's platform features are not, automatically.**

Anything that is just Postgres — tables, columns, constraints, indexes, functions, triggers, and **Row Level Security policies** (RLS is a native Postgres feature, not a Supabase invention) — moves to AWS RDS with zero changes. Anything that is a Supabase *product* on top of Postgres (Auth, Storage, Realtime, Edge Functions) needs an adapter boundary so swapping the provider means rewriting one file, not searching the whole codebase.

## 3. The adapter boundary

Every module's code talks to these three things through an internal interface,
never directly to a Supabase SDK call inside a component or a business-logic
function:

```
lib/
  db/
    client.ts        <- server-only Supabase client (getDb, getServiceDb); imports next/headers, so hardened with the `server-only` package -- never importable from a Client Component
    browser-client.ts <- the only lib/db file a Client Component may import (getBrowserDb) -- split out after a real build failure when a Client Component pulled in client.ts and its next/headers import along with it
    schema/           <- generated types from the DB, used everywhere else
  auth/
    adapter.ts        <- getUser(), requireAuth(), signOut() etc.
                         Today: wraps supabase.auth.*
                         On AWS: wraps Cognito or your own JWT service.
                         Nothing outside this file calls Supabase Auth directly.
  storage/
    adapter.ts        <- uploadFile(), getSignedUrl(), deleteFile()
                         Today: wraps Supabase Storage.
                         On AWS: wraps S3 + CloudFront signed URLs.
  ai/
    client.ts         <- the only file that calls the Claude API directly
```

**Rule**: if you ever write `import { createClient } from '@supabase/supabase-js'`
outside of `lib/db/client.ts`, `lib/db/browser-client.ts`, `lib/auth/adapter.ts`, or `lib/storage/adapter.ts`,
that's a mistake. Everything else imports from those three files.

## 4. Migration discipline

- Every schema change is a file: `supabase/migrations/<timestamp>_<description>.sql`.
- Created with `supabase migration new <description>`, never hand-typed into Studio for anything beyond throwaway local experiments.
- Applied with `supabase db push` (local/dev) and through the same migration files in CI/CD for staging/production — never a manual click-through in the dashboard for a real environment.
- This is what makes the AWS move mechanical later: `pg_dump`/`pg_restore` the data, replay the same migration files against RDS, done. No "what does the schema actually look like" archaeology, which was exactly the problem with the legacy MySQL system (schema partly lived in `.sql` stored procedure files, partly in ActiveRecord classes, partly nowhere written down at all).

## 5. Naming convention (deliberate break from legacy)

The legacy schema used `<Domain><Entity>Tbl` PHP-ActiveRecord-style naming
(`MembercompanymstTbl`, `ProjinvestmentdtlsTbl`). This rebuild is from
scratch, not a live data migration, so the new schema uses plain Postgres
convention instead: `snake_case`, singular table names are not required by
Postgres but pluralize for clarity (`member_companies`, `project_investments`),
foreign keys as `<referenced_table_singular>_id`.

**If a live data migration from the legacy MySQL ever becomes necessary**,
that needs its own mapping document (legacy table → new table, legacy column →
new column) written before that migration starts. Not needed for the from-scratch
build itself. Flagged here so it isn't forgotten later.

## 6. RLS as the tenant boundary

The legacy system scoped every query by `MemberCompMst_Pk` in application code,
scattered across 727+ model classes with no single enforcement point — meaning
a missed `WHERE` clause anywhere was a data leak. This rebuild moves that
enforcement into the database itself via RLS policies, so it's enforced even
if application code forgets. Every multi-tenant table gets a policy of the
shape:

```sql
create policy "tenant_isolation" on <table>
  for all
  using (member_company_id = (select auth.jwt() ->> 'member_company_id')::uuid);
```

This is standard Postgres RLS. It ports to RDS unchanged. This is the single
biggest architectural improvement available in this rebuild over the legacy
system, and it's a portability win too, not just a security one.

## 7. Environment-driven config, not code-driven

Every adapter reads its provider from environment variables, never a hardcoded
import path decided at build time in a way that requires touching business
logic to change:

```
# .env.local (today)
DB_PROVIDER=supabase
AUTH_PROVIDER=supabase
STORAGE_PROVIDER=supabase

# .env.production (future, on AWS)
DB_PROVIDER=aws-rds
AUTH_PROVIDER=cognito
STORAGE_PROVIDER=s3
```

The adapters in `lib/auth/`, `lib/storage/`, `lib/db/` branch on these at
startup. Business logic never checks which provider is active.

## 8. Repo layout (monorepo, single Next.js app to start)

```
elev8/
  app/                      <- Next.js App Router: one folder per module's routes
  components/
  lib/
    db/ auth/ storage/ ai/  <- the adapter boundary, see §3
    modules/                <- one folder per business module (see 02-MODULE-ROADMAP.md)
      config-engine/
      master-data/
      registration/
      ...
  supabase/
    migrations/
  tests/
  docs/
    modules/<module-name>/README.md   <- one per completed module, see 04-BUILD-STANDARDS.md
```

## 9. Setup commands (PowerShell)

```powershell
# Project scaffold
npx create-next-app@latest elev8 --typescript --app --tailwind --eslint
cd elev8
git init
git add .
git commit -m "chore: initial Next.js scaffold"

# Supabase
npm install @supabase/supabase-js @supabase/ssr
npx supabase init
npx supabase login
npx supabase link --project-ref <your-project-ref>

# First migration
npx supabase migration new init_schema

# Apply migrations to local/dev
npx supabase db push

# Claude API SDK
npm install @anthropic-ai/sdk

# Env file (never commit this)
New-Item .env.local
Add-Content .env.local "NEXT_PUBLIC_SUPABASE_URL="
Add-Content .env.local "NEXT_PUBLIC_SUPABASE_ANON_KEY="
Add-Content .env.local "SUPABASE_SERVICE_ROLE_KEY="
Add-Content .env.local "ANTHROPIC_API_KEY="
Add-Content .env.local "DB_PROVIDER=supabase"
Add-Content .env.local "AUTH_PROVIDER=supabase"
Add-Content .env.local "STORAGE_PROVIDER=supabase"
```
