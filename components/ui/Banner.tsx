/**
 * components/ui/Banner.tsx
 *
 * Replaces the many inline warning/success/error boxes scattered through
 * every pillar form built so far (each hand-typing its own background/
 * color pair). Uses role="status" (or role="alert" for danger, which
 * interrupts a screen reader immediately -- reserved for genuine errors,
 * not routine info) so assistive tech announces the message without the
 * user needing to find it visually.
 */

import type { StatusTone } from "./StatusBadge";

const TONE_STYLES: Record<StatusTone, { bg: string; text: string; border: string }> = {
  success: { bg: "var(--status-success-bg)", text: "var(--status-success-text)", border: "#CDEFDA" },
  danger: { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", border: "#F5C6C7" },
  warning: { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", border: "#F0E0A8" },
  info: { bg: "var(--status-info-bg)", text: "var(--status-info-text)", border: "#C9DEF7" },
  neutral: { bg: "var(--g50)", text: "var(--text-secondary)", border: "var(--border-default)" },
};

export function Banner({
  tone,
  children,
}: {
  tone: StatusTone;
  children: React.ReactNode;
}) {
  const s = TONE_STYLES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className="rounded-md border px-3 py-2 text-[12.5px]"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {children}
    </div>
  );
}
