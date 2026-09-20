import Image from "next/image";

/**
 * Phase 0 placeholder home page. Deliberately minimal: this is a
 * foundation deploy check, not a designed landing page. Real UI starts
 * once a module has actual content to show -- but it should still look
 * like elev8, not the default Next.js gray palette, since it's the first
 * thing anyone hitting the bare domain sees.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <Image src="/elev8-logo.png" alt="elev8" width={140} height={70} priority />
      <h1 className="text-lg font-medium" style={{ color: "var(--elev8-ink)" }}>
        Phase 0 Foundation
      </h1>
      <p className="max-w-md text-sm" style={{ color: "var(--elev8-g500)" }}>
        Repo scaffold, adapter layer, and CI are live. See{" "}
        <code>05-PROGRESS-TRACKER.md</code> for what&apos;s next.
      </p>
      <a
        href="/api/health"
        className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--elev8-blue)" }}
      >
        Check /api/health
      </a>
    </div>
  );
}
