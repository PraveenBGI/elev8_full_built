"use client";

/**
 * app/login/page.tsx
 *
 * THIS IS NOT PHASE 2. Phase 2 (Identity, Auth & Registration) is still
 * blocked on decisions #1-#4 in 00-MASTER-PLAN.md sec 4, the wizard vs.
 * AI-conversation question in particular. This page exists only so
 * Phase 0.5's Country Identity screen (and anything else built before
 * Phase 2 lands) can actually be reached and tested with a real Supabase
 * session, using a user created directly in the Supabase dashboard.
 *
 * When Phase 2 is built, this file gets replaced, not extended. Don't add
 * signup, OTP, PIN, or intent-type fields here -- that's the real
 * registration flow's job, specced in elev8_Registration_Field_Document_v1_0.docx.
 *
 * First screen rebuilt on the new design-system foundation
 * (components/ui/, globals.css's verified tokens) rather than inline
 * hex/className strings. Concrete fixes over the previous version, not
 * just a restyle:
 *   - Real <label> elements, not placeholder-as-label (placeholder text
 *     disappears the moment a user types into the field, and isn't
 *     reliably exposed as a label to a screen reader at all -- WCAG
 *     1.3.1/4.1.2, and a real gap here specifically, not a
 *     platform-wide-only one, since this was the very first form built).
 *   - autoComplete="email"/"current-password" -- lets a password
 *     manager fill correctly, which is a security improvement (people
 *     use stronger, unique passwords when a manager can store one),
 *     not just convenience.
 *   - Error text is now programmatically tied to the field via
 *     FormField's aria-describedby wiring, and the generic Supabase
 *     "Invalid login credentials" message is kept verbatim rather than
 *     distinguishing "wrong password" from "no such account" --
 *     deliberately, so a failed attempt never confirms whether an email
 *     is registered.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getBrowserDb } from "@/lib/db/browser-client";
import { resolvePostLoginRedirectAction } from "./actions";
import { Button, Banner, FormField, PageBanner } from "@/components/ui";
import { LogIn } from "lucide-react";

const inputClass =
  "w-full rounded-md border px-3 py-2 text-[13px] outline-none transition-colors focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/15";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const db = getBrowserDb();
    const { error: signInError } = await db.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      // Kept verbatim, not reworded -- Supabase's own message is already
      // generic ("Invalid login credentials"), which is the correct
      // security behaviour: never let a failed attempt reveal whether
      // the email itself is registered.
      setError(signInError.message);
      return;
    }

    const destination = await resolvePostLoginRedirectAction();
    router.push(destination);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Image src="/elev8-logo.png" alt="elev8" width={120} height={60} priority />

      <PageBanner
        icon={LogIn}
        title="Sign in"
        description="Temporary dev sign-in only, not the real registration flow. Use a user created directly in the Supabase dashboard."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <FormField label="Email" required>
          {({ inputId, describedBy }) => (
            <input
              id={inputId}
              type="email"
              autoComplete="email"
              required
              aria-describedby={describedBy}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            />
          )}
        </FormField>

        <FormField label="Password" required>
          {({ inputId, describedBy }) => (
            <input
              id={inputId}
              type="password"
              autoComplete="current-password"
              required
              aria-describedby={describedBy}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
            />
          )}
        </FormField>

        {error && <Banner tone="danger">{error}</Banner>}

        <Button type="submit" loading={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
