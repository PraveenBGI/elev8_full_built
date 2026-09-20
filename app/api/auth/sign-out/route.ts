/**
 * POST /api/auth/sign-out
 *
 * Plain form POST target (see Topbar.tsx) rather than a client-side
 * onClick calling supabase.auth.signOut() directly, so it works even
 * from a Server Component-rendered page with no JS bundle loaded for it.
 * Uses lib/auth/adapter.ts's signOut(), written back in Phase 0 -- this
 * is its first actual caller.
 */

import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth/adapter";

export async function POST(request: Request) {
  await signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
