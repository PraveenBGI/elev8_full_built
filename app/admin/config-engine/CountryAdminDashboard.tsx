/**
 * app/admin/config-engine/CountryAdminDashboard.tsx
 */

import Link from "next/link";
import type { CountryIdentityRow, StateRow } from "@/lib/modules/config-engine/adapter";
import type { Stage } from "@/lib/modules/config-engine/stages";
import { readinessToStageStatus } from "@/lib/modules/config-engine/stages";
import { StatusBadge, PageBanner } from "@/components/ui";
import { Landmark } from "lucide-react";

function StatusDot({ status }: { status: "done" | "in_progress" | "pending" }) {
  const color =
    status === "done" ? "var(--elev8-green)" : status === "in_progress" ? "var(--status-warning-text)" : "var(--elev8-g200)";
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}

function CompletionRing({ percent }: { percent: number }) {
  const circumference = 2 * Math.PI * 33;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg viewBox="0 0 74 74" width="80" height="80">
        <circle cx="37" cy="37" r="33" fill="none" stroke="var(--elev8-g100)" strokeWidth="6" />
        <circle
          cx="37"
          cy="37"
          r="33"
          fill="none"
          stroke="var(--elev8-blue)"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 37 37)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[16px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
          {percent}%
        </span>
      </div>
    </div>
  );
}

export function CountryAdminDashboard({
  country,
  pillarStages,
  readiness,
  states,
}: {
  country: CountryIdentityRow | null;
  pillarStages: Stage[];
  readiness: Record<string, string>;
  states: StateRow[];
}) {
  const doneCount = pillarStages.filter((s) => readinessToStageStatus(readiness[s.id]) === "done").length;
  const percent = pillarStages.length > 0 ? Math.round((doneCount / pillarStages.length) * 100) : 0;
  const delegatedStates = states.filter((s) => s.config_control === "state");

  return (
    <div className="max-w-[1000px]">
      <PageBanner
        icon={Landmark}
        title={country?.name ?? "Your country"}
        description={`Country Admin${country?.master_currency ? ` -- ${country.master_currency}` : ""} -- ${country?.approval_status === "published" ? "Published" : "Not yet published"}`}
      />

      <div
        className="mb-6 flex items-center gap-6 rounded-xl border bg-white p-5 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <CompletionRing percent={percent} />
        <div className="flex-1">
          <p className="text-[14px] font-medium" style={{ color: "var(--elev8-ink)" }}>
            {doneCount} of {pillarStages.length} pillars ready
          </p>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
            {delegatedStates.length} of {states.length} state{states.length === 1 ? "" : "s"} delegated
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {pillarStages.map((stage) => {
          const status = readinessToStageStatus(readiness[stage.id]);
          return (
            <Link
              key={stage.id}
              href={`/admin/config-engine/${stage.id}`}
              className="flex items-center gap-2.5 rounded-lg border bg-white px-4 py-3 transition-colors hover:border-[var(--elev8-blue)]"
              style={{ borderColor: "var(--elev8-g100)" }}
            >
              <StatusDot status={status} />
              <span className="text-[13px] font-medium" style={{ color: "var(--elev8-ink)" }}>
                {stage.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>

      <div
        className="rounded-xl border bg-white p-5 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <h2 className="mb-3 text-[14px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
          States
        </h2>
        {states.length === 0 ? (
          <p className="text-[13px]" style={{ color: "var(--elev8-g500)" }}>
            No states added yet.{" "}
            <Link href="/admin/config-engine/statecluster" style={{ color: "var(--elev8-blue)" }}>
              Add one in State Cluster.
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {states.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
                style={{ borderColor: "var(--elev8-g100)" }}
              >
                <span className="text-[13px] font-medium" style={{ color: "var(--elev8-ink)" }}>
                  {s.name}
                </span>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    tone={s.config_control === "state" ? "info" : "neutral"}
                    label={s.config_control === "state" ? "Delegated" : "Central"}
                  />
                  <span className="text-[12px]" style={{ color: "var(--elev8-g400)" }}>
                    {s.approval_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
