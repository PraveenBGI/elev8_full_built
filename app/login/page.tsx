"use client";

/**
 * app/login/page.tsx
 *
 * THIS IS NOT PHASE 2. Phase 2 (Identity, Auth & Registration) is still
 * blocked on decisions #1-#4 in 00-MASTER-PLAN.md sec 4 -- the wizard vs.
 * AI-conversation question in particular. This page exists only so
 * Phase 0.5's Country Identity screen (and anything else built before
 * Phase 2 lands) can actually be reached and tested with a real Supabase
 * session, using a user created directly in the Supabase dashboard.
 *
 * When Phase 2 is built, this file gets replaced, not extended. Don't add
 * signup, OTP, PIN, or intent-type fields here -- that's the real
 * registration flow's job, specced in elev8_Registration_Field_Document_v1_0.docx.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserDb } from "@/lib/db/browser-client";

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

    router.push("/admin/config-engine/country");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-xs text-zinc-500">
          Temporary dev sign-in only -- not the real registration flow (see
          Phase 2 in the plan). Use a user created directly in the Supabase
          dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
