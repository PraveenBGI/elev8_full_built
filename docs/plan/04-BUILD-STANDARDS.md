# Build Standards — "Never Mess Up The Code"

These rules exist because the legacy system's biggest problems were not bad
ideas, they were undisciplined process: schema partly undocumented, secrets
committed to source, one shared database written to by independent codebases
with no single owner. This document is how that doesn't happen again.

## 1. Git workflow

- `main` is always deployable. Nothing broken ever sits on `main`.
- One branch per module: `feature/phase-1-master-data`, `feature/phase-2-registration`.
- Merge to `main` only when that module's Definition of Done (§3) is fully met.
- Commit messages describe the change, not the file: `feat(master-data): add HS code reference table` not `update files`.
- Tag a release after every phase merges: `git tag phase-1-complete`.

```powershell
git checkout -b feature/phase-1-master-data
# ... work ...
git add .
git commit -m "feat(master-data): add country, sector, HS code tables with RLS"
git push -u origin feature/phase-1-master-data
gh pr create --title "Phase 1: Master Data" --body "See docs/modules/master-data/README.md"
```

## 2. Migration discipline

- Every schema change: `npx supabase migration new <description>`, then write the SQL by hand, never generated blindly.
- Never edit a migration file after it's merged to `main`. If something was wrong, write a new migration that fixes it. History must be replayable in order, always — this is what makes the AWS RDS move mechanical later.
- Every migration that adds a table with tenant-scoped data includes its RLS policy in the *same* migration file, not a follow-up. A table is never live without its policy, even for an hour.
- Seed data (master data, config defaults) lives in its own migration files, separate from schema-defining ones, so schema history stays readable.

## 3. Definition of Done (applies to every module in `02-MODULE-ROADMAP.md`)

A module is not done, and the next module does not start, until all of these
are true:

- [ ] Schema migrated via numbered SQL files in `supabase/migrations/`
- [ ] RLS policies written and tested (a query as User A never returns User B's tenant data — write an actual test for this, don't eyeball it)
- [ ] All data access goes through `lib/db/` adapter functions, typed, no raw Supabase client calls in components
- [ ] At least one integration test per module covering the primary happy path end to end
- [ ] No unresolved `TODO`/`FIXME` comments without a linked tracked issue
- [ ] A short `docs/modules/<module-name>/README.md`: what it does, its tables, its open questions if any, links to the relevant legacy module for reference
- [ ] Entry updated in `05-PROGRESS-TRACKER.md`

## 4. Secrets

- `.env.local` is in `.gitignore`, always. `.env.example` lists every required variable with empty/placeholder values, kept up to date.
- Production secrets set via CLI, never pasted into a dashboard by hand where avoidable, and never committed:

```powershell
vercel env add ANTHROPIC_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
```

- If a secret is ever accidentally committed: treat it as compromised immediately, rotate it, then clean history. Do not just delete the file in a new commit and consider it handled — the old commit still has it.

## 5. Testing gate before starting the next phase

Run the full test suite and confirm the previous phase's Definition of Done
checklist before opening a new feature branch for the next phase:

```powershell
npm run lint
npm run typecheck
npm run test
```

All three must pass. This is the literal checkpoint that prevents "module by
module" from quietly becoming "everything half-built at once."

## 6. Code review checkpoint, even solo

Every module's PR gets read once, in full, before merging — even if you're
the only one building this. Use the PR description as a forcing function:
write out what the module does and why, and if you can't explain it cleanly
in the PR description, it's not ready to merge.

## 7. Rollback plan

Every migration should have an obvious manual undo path documented in its own
file header comment, even if Supabase doesn't auto-generate down-migrations.
For anything genuinely risky (a column type change, a data backfill), test
the rollback on a local/dev database before it ever touches staging.
