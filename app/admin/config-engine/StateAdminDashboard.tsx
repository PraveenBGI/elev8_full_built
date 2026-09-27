/**
 * app/admin/config-engine/StateAdminDashboard.tsx
 */

import Link from "next/link";
import type { StatePillarApprovalRow, StateRow } from "@/lib/modules/config-engine/adapter";
import type { Stage } from "@/lib/modules/config-engine/stages";
import { readinessToStageStatus } from "@/lib/modules/config-engine/stages";

function StatusDot({ status }: { status: "done" | "in_progress" | "pending" }) {
  const color =
    status === "done" ? "var(--elev8-green)" : status === "in_progress" ? "var(--elev8-orange)" : "var(--elev8-g200)";
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}

const APPROVAL_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  draft: { label: "Draft", bg: "var(--elev8-g100)", fg: "var(--elev8-g500)" },
  submitted: { label: "Submitted", bg: "#EEF4FC", fg: "var(--elev8-blue)" },
  under_review: { label: "Under review", bg: "#FFF7E6", fg: "#8A6A1A" },
  clarification_required: { label: "Clarification required", bg: "#FDECEC", fg: "var(--elev8-red)" },
  approved: { label: "Approved", bg: "#E9F8EF", fg: "#00874A" },
  published: { label: "Published", bg: "#E9F8EF", fg: "#00874A" },
};

export function StateAdminDashboard({
  state,
  pillarStages,
  readiness,
  approvals,
}: {
  state: (StateRow & { country_name: string }) | null;
  pillarStages: Stage[];
  readiness: Record<string, string>;
  approvals: StatePillarApprovalRow[];
}) {
  const doneCount = pillarStages.filter((s) => readinessToStageStatus(readiness[s.id]) === "done").length;
  const approvalByPillar = Object.fromEntries(approvals.map((a) => [a.pillar, a.approval_status]));

  return (
    <div className="max-w-[1000px]">
      <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "var(--elev8-g400)" }}>
        State Admin
      </p>
      <h1 className="mt-1 text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        {state?.name ?? "Your state"}
      </h1>
      <p className="mt-1.5 mb-6 text-sm" style={{ color: "var(--elev8-g500)" }}>
        {state?.country_name ? `${state.country_name}, ` : ""}
        {doneCount} of {pillarStages.length} pillars ready
      </p>

      <div
        className="rounded-xl border bg-white p-5 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <h2 className="mb-3 text-[14px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
          Your pillars
        </h2>
        <div className="space-y-2">
          {pillarStages.map((stage) => {
            const status = readinessToStageStatus(readiness[stage.id]);
            const approval = approvalByPillar[stage.id] ?? "draft";
            const approvalMeta = APPROVAL_LABELS[approval] ?? APPROVAL_LABELS.draft;
            return (
              <Link
                key={stage.id}
                href={`/admin/config-engine/${stage.id}`}
                className="flex items-center justify-between rounded-md border px-3 py-2.5 transition-colors hover:border-[var(--elev8-blue)]"
                style={{ borderColor: "var(--elev8-g100)" }}
              >
                <div className="flex items-center gap-2.5">
                  <StatusDot status={status} />
                  <span className="text-[13px] font-medium" style={{ color: "var(--elev8-ink)" }}>
                    {stage.label}
                  </span>
                </div>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                  style={{ background: approvalMeta.bg, color: approvalMeta.fg }}
                >
                  {approvalMeta.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-[12.5px]" style={{ color: "var(--elev8-g400)" }}>
        Edits you make here only take effect for companies in{" "}
        {state?.name ?? "your state"} once submitted and approved through to
        published by your Country Admin.
      </p>
    </div>
  );
}
