"use client";

/**
 * app/admin/config-engine/identity/SettingsGroup.tsx
 *
 * A collapsible field group with a one-line summary when closed --
 * the actual fix for "overwhelming form, doesn't feel premium": the page
 * reads as a short list of settings, not a wall of inputs. Reused by
 * CountryIdentityForm now; generic enough to reuse for every future
 * pillar's sections too (they all have the same "many fields grouped
 * into named sections" shape -- see the mockup's own 7 Identity
 * sections, or any pillar's sub-areas).
 */

import { useState } from "react";

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

  return (
    <div className="border-b border-[var(--elev8-g100)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
            isComplete
              ? "bg-[var(--elev8-green)] text-white"
              : "border border-[var(--elev8-g200)] text-transparent"
          }`}
        >
          ✓
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-medium text-[var(--elev8-ink)]">
            {title}
          </span>
          {!open && (
            <span className="block truncate text-[12.5px] text-[var(--elev8-g500)]">
              {summary}
            </span>
          )}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`shrink-0 text-[var(--elev8-g400)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
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
      {open && <div className="pb-5 pl-8">{children}</div>}
    </div>
  );
}
