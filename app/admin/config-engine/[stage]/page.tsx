/**
 * app/admin/config-engine/[stage]/page.tsx
 *
 * Placeholder for every stage in STAGES except `identity`, which has its
 * own real route (../identity/page.tsx) and therefore takes precedence
 * over this dynamic segment for that exact path. An unknown stage id
 * (not in STAGES at all) 404s rather than silently rendering a blank
 * placeholder -- a typo in a link should be visible, not swallowed.
 */

import { notFound } from "next/navigation";
import { STAGES } from "@/lib/modules/config-engine/stages";

export default async function StagePlaceholderPage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: stageId } = await params;
  const stage = STAGES.find((s) => s.id === stageId);

  if (!stage) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: "var(--elev8-navy)" }}>
        {stage.icon} {stage.label}
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--elev8-g500)" }}>
        {stage.description}
      </p>
      <div
        className="rounded-xl border p-6 text-sm"
        style={{ borderColor: "var(--elev8-g100)", background: "#fff", color: "var(--elev8-g500)" }}
      >
        This stage isn&apos;t built yet. See{" "}
        <code>05-PROGRESS-TRACKER.md</code> for build order — only Country
        Identity exists so far.
      </div>
    </div>
  );
}
