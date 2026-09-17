/**
 * lib/db/client.ts
 *
 * THE ONLY FILE THAT KNOWS THIS DATABASE IS SUPABASE.
 *
 * Every other file in the app imports `getDb()` / `getServiceDb()` from here,
 * never `@supabase/supabase-js` directly. When this platform moves to plain
 * AWS RDS Postgres, this is the only file that changes (swap the client for
 * `pg`/`postgres.js` pointed at RDS, keep the same exported function shapes).
 *
 * See 01-ARCHITECTURE-AND-PORTABILITY.md §3 and §7.
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const DB_PROVIDER = process.env.DB_PROVIDER ?? "supabase";

function assertSupabaseProvider() {
  if (DB_PROVIDER !== "supabase") {
    throw new Error(
      `DB_PROVIDER="${DB_PROVIDER}" is not implemented yet in lib/db/client.ts. ` +
        `Add the branch for this provider here — nowhere else.`,
    );
  }
}

/**
 * Server-side client for use in Server Components / Server Actions / Route
 * Handlers. Respects the signed-in user's session and RLS policies.
 */
export async function getDb() {
  assertSupabaseProvider();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component that can't set cookies — safe to
            // ignore if you have middleware refreshing the session.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY. Server-only (never import
 * this in a Client Component). Use only for trusted background jobs
 * (cron, webhooks, migrations/seeding) — never to serve a user request.
 */
export function getServiceDb() {
  assertSupabaseProvider();
  if (typeof window !== "undefined") {
    throw new Error("getServiceDb() must never be called from the browser.");
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * Browser client, for the rare case a Client Component needs to talk to the
 * database directly (e.g. a realtime subscription). Still goes through RLS.
 */
export function getBrowserDb() {
  assertSupabaseProvider();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
