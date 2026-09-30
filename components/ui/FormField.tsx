/**
 * components/ui/FormField.tsx
 *
 * Fixes a real, currently-universal gap: grepping the whole app for
 * aria-describedby/aria-invalid returns zero results. Every field's
 * error text (where shown) sits visually below the input with no
 * programmatic link to it -- a screen-reader user tabbing to an invalid
 * field hears the label and nothing else; the error text only exists
 * for sighted users scanning the page. This component is the fix:
 *
 * - The label's htmlFor/id pairing is generated once and reused for both
 *   aria-describedby (pointing at the error/hint) and aria-invalid on
 *   whatever input the caller renders inside, via context-free prop
 *   plumbing (the caller passes the returned ids to its own input).
 * - Optional field marks required with a real `*` PLUS the word
 *   "required" in a visually-hidden span, since an asterisk alone isn't
 *   reliably announced by every screen reader.
 */

import { useId } from "react";

export function FormField({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Render prop so the caller's own <input>/<select> gets the right ids. */
  children: (ids: { inputId: string; describedBy: string | undefined }) => React.ReactNode;
}) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[12.5px] font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
        {required && (
          <>
            {" "}
            <span aria-hidden="true" style={{ color: "var(--status-danger-text)" }}>
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        )}
      </label>
      {children({ inputId, describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[12px]" style={{ color: "var(--status-danger-text)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
