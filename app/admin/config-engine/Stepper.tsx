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
import { StatusBadge } from "@/components/ui";

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
                background: status === "done" ? "var(--status-success-text)" : "var(--elev8-g100)",
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
                <StatusBadge
                  tone={status === "done" ? "success" : status === "in_progress" ? "warning" : "neutral"}
                  label={status === "done" ? "Complete" : status === "in_progress" ? "In progress" : "Not started"}
                />
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
