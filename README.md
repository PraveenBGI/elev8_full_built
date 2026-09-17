# elev8

Trade facilitation platform. Full rebuild on Next.js + Supabase (portable to
any Postgres, target AWS RDS), deployed on Vercel. Replaces the legacy
JSRS/GBF PHP+Angular+Node ecosystem, module by module.

**This repo does not stand alone.** The full plan -- architecture rules,
phase-by-phase roadmap, AI engine design, build standards, and the living
progress tracker -- lives in the accompanying 6-file planning package
(`00-MASTER-PLAN.md` through `05-PROGRESS-TRACKER.md`), kept in the Claude
Project this is built from. Read `00-MASTER-PLAN.md` and
`05-PROGRESS-TRACKER.md` before touching anything here.

## Current status

Phase 0 (Foundation) only. No product module is built yet. See
`docs/modules/foundation/README.md`.

## Local setup

Only needed if you ever want to run this on your own machine. The normal
workflow is: push to GitHub, let CI and Vercel do the rest.

```powershell
git clone https://github.com/PraveenBGI/elev8_full_built.git
cd elev8_full_built
npm install
Copy-Item .env.example .env.local
# fill in .env.local with real Supabase + Anthropic keys
npm run dev
```

## What actually builds this

- **GitHub Actions** (`.github/workflows/ci.yml`) -- lint, typecheck, test,
  build, on every push. Runs on GitHub's servers, not your machine.
- **Vercel** -- connected to this repo, builds and deploys on every push to
  `main` (preview deploys on every PR). Also runs on Vercel's servers.

Your machine only ever needs to run `git add` / `git commit` / `git push`.
