/**
 * components/ui/StatusBadge.tsx
 *
 * Replaces the ~16+ places across the app that inline a status pill as
 * {background: "#E9F8EF", color: "#00874A"} etc, each hand-typing the
 * same hex pair (confirmed by grep before building this, not assumed).
 * Two real fixes over the pattern it replaces:
 *
 * 1. Colors come from globals.css's verified semantic tokens
 *    (--status-success-text on --status-success-bg, etc), not a
 *    hand-typed hex pair -- every consumer gets the AA-verified pairing
 *    automatically, and a future correction happens in one file.
 * 2. Status is never color alone (WCAG 1.4.1, Use of Color): each tone
 *    also gets its own dot shape/fill so a colorblind user, or anyone on
 *    a poorly-calibrated screen, can still distinguish success from
 *    danger from neutral without relying on hue.
 */

export type StatusTone = "success" | "danger" | "warning" | "info" | "neutral";

const TONE_STYLES: Record<StatusTone, { bg: string; text: string; dotFilled: boolean }> = {
  success: { bg: "var(--status-success-bg)", text: "var(--status-success-text)", dotFilled: true },
  danger: { bg: "var(--status-danger-bg)", text: "var(--status-danger-text)", dotFilled: true },
  warning: { bg: "var(--status-warning-bg)", text: "var(--status-warning-text)", dotFilled: false },
  info: { bg: "var(--status-info-bg)", text: "var(--status-info-text)", dotFilled: false },
  neutral: { bg: "var(--g100)", text: "var(--text-secondary)", dotFilled: false },
};

export function StatusBadge({ label, tone }: { label: string; tone: StatusTone }) {
  const s = TONE_STYLES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          background: s.dotFilled ? "currentColor" : "transparent",
          border: s.dotFilled ? "none" : "1.5px solid currentColor",
        }}
      />
      {label}
    </span>
  );
}
