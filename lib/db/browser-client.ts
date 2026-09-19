/**
 * lib/db/browser-client.ts
 *
 * The ONLY file that Client Components ("use client") may import from
 * lib/db/. Split out of lib/db/client.ts specifically because that file
 * imports next/headers (server-only, enforced there by the `server-only`
 * package) — bundling any export from that file into client code fails
 * the build, even an export that itself never touches next/headers,
 * because bundlers include the whole module. See client.ts's own comment
 * for the real build failure this caused before the split.
 *
 * Still goes through RLS like every other path — this is not a
 * privileged client, just a browser-safe one.
 */

import { createBrowserClient } from "@supabase/ssr";

const DB_PROVIDER = process.env.DB_PROVIDER ?? "supabase";

export function getBrowserDb() {
  if (DB_PROVIDER !== "supabase") {
    throw new Error(
      `DB_PROVIDER="${DB_PROVIDER}" is not implemented yet in lib/db/browser-client.ts.`,
    );
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
