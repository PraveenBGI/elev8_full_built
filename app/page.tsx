/**
 * Phase 0 placeholder home page. Deliberately minimal: this is a foundation
 * deploy check, not a designed landing page. Real UI starts once a module
 * (Config Engine, Registration, etc.) has actual content to show.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        elev8 — Phase 0 Foundation
      </h1>
      <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
        Repo scaffold, adapter layer, and CI are live. No product module has
        been built yet — see <code>05-PROGRESS-TRACKER.md</code> for what&apos;s
        next.
      </p>
      <a
        href="/api/health"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Check /api/health
      </a>
    </div>
  );
}
