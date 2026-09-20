"use client";

/**
 * app/admin/config-engine/Stepper.tsx
 *
 * Visual pattern (colors, spacing, badge states) ported directly from
 * elev8-country-admin-config_3.html's `.stepper`/`.step-item`/`.step-badge`
 * CSS and its buildStepper() logic -- not redesigned. Real routing via
 * next/link instead of the mockup's client-side page-swap, since this is
 * Next.js App Router, not a single static HTML file.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Stage, StageStatus } from "@/lib/modules/config-engine/stages";

export function Stepper({
  stages,
  statusByStageId,
}: {
  stages: Stage[];
  statusByStageId: Record<string, StageStatus>;
}) {
  const pathname = usePathname();

  return (
    <nav
      className="w-[290px] shrink-0 overflow-y-auto border-r py-4"
      style={{ borderColor: "var(--elev8-g100)", background: "var(--white, #fff)" }}
    >
      {stages.map((s) => {
        const href = `/admin/config-engine/${s.id}`;
        const isActive = pathname === href;
        const status = statusByStageId[s.id] ?? "pending";

        return (
          <Link
            key={s.id}
            href={href}
            className="flex items-start gap-[11px] px-5 py-[10px] no-underline"
            style={{
              background: isActive ? "#EAF6EF" : undefined,
            }}
          >
            <div
              className="mt-px flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs font-extrabold"
              style={{
                background: status === "done" ? "var(--elev8-green)" : "var(--elev8-g100)",
                color: status === "done" ? "#fff" : "var(--elev8-g500)",
              }}
            >
              {status === "done" ? "✓" : s.num}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[13px] font-bold leading-tight"
                style={{ color: isActive ? "var(--elev8-green-dk)" : "var(--elev8-navy)" }}
              >
                {s.icon} {s.label}
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: "var(--elev8-g500)" }}>
                {s.description}
              </div>
              {s.id !== "welcome" && s.id !== "review" && (
                <StatusBadge status={status} />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

function StatusBadge({ status }: { status: StageStatus }) {
  const styles: Record<StageStatus, { bg: string; color: string; label: string }> = {
    done: { bg: "#E6F7EE", color: "var(--elev8-green-dk)", label: "Complete" },
    in_progress: { bg: "#FFF6E5", color: "var(--elev8-orange)", label: "In progress" },
    pending: { bg: "var(--elev8-g100)", color: "var(--elev8-g500)", label: "Not started" },
  };
  const s = styles[status];
  return (
    <span
      className="mt-[5px] inline-block rounded-[10px] px-[7px] py-[2px] text-[9.5px] font-extrabold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
