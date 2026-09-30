"use client";

/**
 * components/SettingsGroup.tsx
 *
 * A collapsible field group with a one-line summary when closed -- the
 * actual fix for "overwhelming form, doesn't feel premium": the page
 * reads as a short list of settings, not a wall of inputs. Shared across
 * genuinely different modules (config-engine's Identity/Master Data/
 * Governance/Procurement/B2B, and company-config), not just within one
 * route group -- moved here from app/admin/config-engine/ once it
 * outgrew being config-engine-specific.
 *
 * Retrofitted onto the design-system foundation (globals.css's verified
 * semantic tokens, not the deprecated --elev8-* aliases). Real,
 * confirmed accessibility gaps fixed here, not assumed ones -- this is
 * the single highest-leverage fix in the whole retrofit pass: this one
 * component wraps 73 separate sections just inside CompanyConfigForm.tsx
 * alone (grepped, not estimated), so every fix here reaches every
 * pillar's every sub-page at once.
 *
 * 1. This is the WAI-ARIA Disclosure pattern, and it had none of the
 *    pattern's required wiring: no aria-expanded on the trigger button,
 *    no aria-controls linking it to the region it reveals, no id on
 *    that region for aria-controls to point at. All added below.
 * 2. Completion state was color-only in the accessibility tree, not
 *    just visually: the checkmark glyph used text-transparent when
 *    incomplete, meaning a screen reader had literally nothing to
 *    announce either way -- expanded/collapsed was exposed via
 *    aria-expanded (now), but "complete" vs "incomplete" was never
 *    exposed at all. Fixed with a visually-hidden status word, since
 *    those are two different pieces of state a user needs, not one.
 * 3. The green checkmark fill was white text on #00A651 at 3.19:1 --
 *    fails WCAG AA for text (4.5:1). Corrected to reuse
 *    --status-success-text (already verified at 4.5:1+ elsewhere in the
 *    token set), not a third near-duplicate green invented here.
 * 4. pl-8 (physical) -> ps-8 (logical) so this flips correctly under
 *    dir="rtl", per the RTL rule established in the design-system
 *    foundation commit.
 */

import { useId, useState } from "react";

export function SettingsGroup({
  title,
  summary,
  isComplete,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary: string;
  isComplete: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: "var(--border-default)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center gap-3 py-4 text-start"
      >
        <span
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
          style={
            isComplete
              ? { background: "var(--status-success-text)", color: "white" }
              : { border: "1px solid var(--border-strong)", color: "transparent" }
          }
        >
          ✓
        </span>
        <span className="sr-only">{isComplete ? "Complete: " : "Incomplete: "}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
            {title}
          </span>
          {!open && (
            <span className="block truncate text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
              {summary}
            </span>
          )}
        </span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--text-muted)" }}
          fill="none"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div id={contentId} className="pb-5 ps-8">
          {children}
        </div>
      )}
    </div>
  );
}
