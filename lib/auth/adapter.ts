/**
 * lib/auth/adapter.ts
 *
 * Every module calls getUser() / requireAuth() / signOut() from here.
 * NOTHING outside this file calls `supabase.auth.*` directly.
 *
 * Today: wraps Supabase Auth.
 * On AWS later: wraps Cognito (or a custom JWT service) with the SAME
 * exported function signatures below, so callers never change.
 *
 * See 01-ARCHITECTURE-AND-PORTABILITY.md §3.
 */

import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";

const AUTH_PROVIDER = process.env.AUTH_PROVIDER ?? "supabase";

export type AppUser = {
  id: string;
  email: string | null;
  /** Tenant boundary — matches the RLS policies in every migration. */
  memberCompanyId: string | null;
};

function assertSupabaseProvider() {
  if (AUTH_PROVIDER !== "supabase") {
    throw new Error(
      `AUTH_PROVIDER="${AUTH_PROVIDER}" is not implemented yet in lib/auth/adapter.ts.`,
    );
  }
}

/** Returns the signed-in user, or null. Never throws for "not signed in". */
export async function getUser(): Promise<AppUser | null> {
  assertSupabaseProvider();
  const db = await getDb();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    // Populated once Phase 2 (Registration) writes this into the JWT's
    // custom claims / a profile table this reads from. Foundation only
    // needs the shape to exist.
    memberCompanyId: (user.app_metadata?.member_company_id as string) ?? null,
  };
}

/** Use in Server Components/Actions that must not proceed unauthenticated. */
export async function requireAuth(): Promise<AppUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function signOut(): Promise<void> {
  assertSupabaseProvider();
  const db = await getDb();
  await db.auth.signOut();
}
