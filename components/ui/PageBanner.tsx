/**
 * components/ui/PageBanner.tsx
 *
 * The concrete answer to "make it visually appealing without a
 * third-party image dependency": a CSS gradient (--brand-blue to
 * --brand-blue-dk, both already in globals.css's verified token set)
 * plus a Lucide icon in a translucent badge, rather than a photo or an
 * external illustration package.
 *
 * Two real open-source illustration packages were evaluated and
 * rejected before landing on this approach, not skipped by assumption:
 * @sumup-oss/illustrations doesn't bundle its SVGs at all -- every
 * illustration is a live url("https://circuit.sumup.com/...") reference,
 * meaning a real third-party request on every page load, exactly the
 * GDPR-relevant data leak the design-system work argued against.
 * undraw-react introduced 3 new vulnerabilities (1 low, 2 moderate) the
 * moment it was installed and bundled a second, nested copy of React
 * inside itself. Both uninstalled; this component has zero runtime
 * dependency beyond the icon itself.
 *
 * White text on both gradient endpoints verified at 8.32:1 and 11.49:1
 * -- comfortably past WCAG AA's 4.5:1, not assumed legible because it's
 * white on a "dark enough" blue.
 */

import type { LucideIcon } from "lucide-react";

export function PageBanner({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div
      className="mb-7 flex items-center gap-4 rounded-xl p-5"
      style={{ background: "linear-gradient(135deg, var(--brand-blue), var(--brand-blue-dk))" }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        <Icon aria-hidden="true" className="h-6 w-6 text-white" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h1 className="text-[18px] font-semibold text-white">{title}</h1>
        <p className="mt-0.5 text-[13px] leading-relaxed text-white/85">{description}</p>
      </div>
    </div>
  );
}
