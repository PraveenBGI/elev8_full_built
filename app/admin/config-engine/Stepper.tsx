"use client";

/**
 * app/admin/config-engine/Stepper.tsx
 *
 * Revised per direct feedback: no icons/emoji (the mockup used an emoji
 * per stage; a numbered circle already carries that signal without
 * looking like a chat app), and moderate font weight throughout (500/600,
 * never 700/800 -- the earlier version's font-extrabold everywhere read
 * as "bold ugly," not premium).
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
      className="w-[280px] shrink-0 overflow-y-auto border-r bg-white py-3"
      style={{ borderColor: "var(--elev8-g100)" }}
    >
      {stages.map((s) => {
        const href = `/admin/config-engine/${s.id}`;
        const isActive = pathname === href;
        const status = statusByStageId[s.id] ?? "pending";

        return (
          <Link
            key={s.id}
            href={href}
            className="flex items-start gap-3 px-5 py-2.5 no-underline"
            style={{ background: isActive ? "var(--elev8-g50)" : undefined }}
          >
            <div
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium"
              style={{
                background: status === "done" ? "var(--elev8-green)" : "var(--elev8-g100)",
                color: status === "done" ? "#fff" : "var(--elev8-g500)",
              }}
            >
              {status === "done" ? "✓" : s.num}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[13px] font-medium leading-tight"
                style={{ color: isActive ? "var(--elev8-blue)" : "var(--elev8-ink)" }}
              >
                {s.label}
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
    done: { bg: "#E6F5EC", color: "var(--elev8-green-dk)", label: "Complete" },
    in_progress: { bg: "#FFF6E5", color: "var(--elev8-orange)", label: "In progress" },
    pending: { bg: "var(--elev8-g100)", color: "var(--elev8-g500)", label: "Not started" },
  };
  const s = styles[status];
  return (
    <span
      className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}
