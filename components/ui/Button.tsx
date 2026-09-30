/**
 * components/ui/Button.tsx
 *
 * Replaces the many hand-styled <button> elements across every pillar
 * form (each repeating className="rounded-md px-4 py-2 text-sm font-medium
 * text-white..." inline). Real, checkable properties this adds over that
 * pattern:
 *
 * - min-h-[24px] / min-w-[24px]: WCAG 2.2 SC 2.5.8 Target Size (Minimum,
 *   Level AA) requires an interactive target of at least 24x24 CSS
 *   pixels. Normal padding already clears this in practice, but it was
 *   never an explicit, enforced minimum before -- a future icon-only
 *   button (no padding-generating text) would have silently violated it.
 * - Focus ring comes from globals.css's :focus-visible rule automatically
 *   (do not override outline here).
 * - A loading state disables the button AND sets aria-busy, so a screen
 *   reader announces "busy" rather than silently doing nothing on
 *   activation -- the existing "Saving..." text-swap pattern used
 *   everywhere already covered sighted users but not this.
 */

const VARIANT_STYLES: Record<string, { bg: string; color: string; hoverOpacity?: boolean }> = {
  primary: { bg: "var(--brand-blue)", color: "white", hoverOpacity: true },
  danger: { bg: "var(--status-danger-text)", color: "white", hoverOpacity: true },
  secondary: { bg: "var(--g100)", color: "var(--text-primary)" },
};

export function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  children,
  ...rest
}: {
  variant?: "primary" | "danger" | "secondary";
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const s = VARIANT_STYLES[variant];
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50 ${s.hoverOpacity ? "hover:opacity-90" : "hover:brightness-95"} ${rest.className ?? ""}`}
      style={{ background: s.bg, color: s.color }}
    >
      {children}
    </button>
  );
}
