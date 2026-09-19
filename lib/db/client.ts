/**
 * lib/db/client.ts
 *
 * THE ONLY FILE THAT KNOWS THIS DATABASE IS SUPABASE, FOR SERVER-SIDE
 * ACCESS. Every other server file imports `getDb()` / `getServiceDb()`
 * from here, never `@supabase/supabase-js` directly. When this platform
 * moves to plain AWS RDS Postgres, this is the only file that changes
 * (swap the client for `pg`/`postgres.js` pointed at RDS, keep the same
 * exported function shapes).
 *
 * SERVER-ONLY, enforced by the `server-only` import below, not just by
 * convention: this file imports `next/headers`, which throws a build
 * error if ever pulled into a Client Component's bundle. This is a real
 * bug that shipped once already -- app/login/page.tsx (a Client
 * Component) originally imported getBrowserDb() from this same file, and
 * Next.js correctly refused to build because the whole module, including
 * its server-only import, gets pulled into the client bundle regardless
 * of which single export is actually used. Browser-safe access now lives
 * in its own file, lib/db/browser-client.ts, specifically so this can't
 * happen again.
 *
 * See 01-ARCHITECTURE-AND-PORTABILITY.md §3 and §7.
 */

import "server-only";
import { createServerClient } from "@supabase/ssr";
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
            // ignore now that proxy.ts refreshes the session on every request.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY. Server-only (enforced
 * above at the module level, not just by the runtime check below — the
 * runtime check stays too, as defense in depth). Use only for trusted
 * background jobs (cron, webhooks, migrations/seeding) — never to serve a
 * user request.
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
