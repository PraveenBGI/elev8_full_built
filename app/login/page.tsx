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
 * Styled to match the real brand (see app/admin/config-engine/Topbar.tsx
 * for where the logo/colors first landed) so signing in doesn't feel like
 * a different, unfinished product from what's on the other side of it.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getBrowserDb } from "@/lib/db/browser-client";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

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
      setError(signInError.message);
      return;
    }

    router.push("/admin/config-engine/identity");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <Image src="/elev8-logo.png" alt="elev8" width={120} height={60} priority />

      <div>
        <h1 className="text-lg font-medium" style={{ color: "var(--elev8-ink)" }}>
          Sign in
        </h1>
        <p className="mt-1 text-xs" style={{ color: "var(--elev8-g500)" }}>
          Temporary dev sign-in only, not the real registration flow. Use a
          user created directly in the Supabase dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && (
          <p className="text-sm" style={{ color: "var(--elev8-red)" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
