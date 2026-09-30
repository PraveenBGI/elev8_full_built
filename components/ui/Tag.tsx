/**
 * components/ui/Tag.tsx
 *
 * Replaces the removable-chip pattern confirmed duplicated 14 times
 * across MasterDataForm, B2bForm, ProcurementForm, and CompanyConfigForm
 * (grepped for the exact shape first, not assumed): a <span> with a
 * hand-typed {background: "#E6F5EC", color: "var(--elev8-green-dk)"}
 * pair, holding a label and an inline remove button.
 *
 * This is NOT the same thing as StatusBadge, even though both are
 * pill-shaped -- a Tag represents one item in a user-editable list
 * (a category, a port, a certification someone typed in) and carries an
 * action; a StatusBadge represents a fixed system state (draft/
 * published/complete) and never has a button inside it. Conflating the
 * two would misuse both.
 *
 * One real accessibility fix over the pattern it replaces: the remove
 * button was literal text "x" with no aria-label, so a screen reader
 * announced "x, button" with no indication of what it removes. Fixed
 * with an explicit aria-label naming the tag's own text.
 */

export function Tag({
  label,
  onRemove,
  disabled = false,
  tone = "success",
  mono = false,
  actionLabel = "Remove",
}: {
  label: string;
  onRemove: () => void;
  disabled?: boolean;
  /** "danger" for a restricted/prohibited item -- e.g. Import's own
      restricted-products list, or a country-locked field path in
      PillarGovernancePanel -- confirmed as real, distinct cases while
      retrofitting this component, not invented speculatively. */
  tone?: "success" | "danger";
  /** Monospace label -- for field-path tags (e.g. "evalWeights.icv"). */
  mono?: boolean;
  /** The verb announced to a screen reader, e.g. "Unlock" instead of
      the default "Remove" -- PillarGovernancePanel's locked-field tags
      unlock a field rather than delete anything, a real difference a
      screen-reader user should hear. */
  actionLabel?: string;
}) {
  const bg = tone === "danger" ? "var(--status-danger-bg)" : "var(--status-success-bg)";
  const color = tone === "danger" ? "var(--status-danger-text)" : "var(--status-success-text)";
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] ${mono ? "font-mono text-[12px]" : ""}`}
      style={{ background: bg, color }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`${actionLabel} ${label}`}
        className="opacity-70 hover:opacity-100 disabled:opacity-40"
      >
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M1 1l8 8M9 1l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </span>
  );
}
