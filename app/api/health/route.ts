/**
 * GET /api/health
 *
 * Phase 0 Definition of Done check: confirms the app is deployed, reachable,
 * and (once NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set
 * in Vercel) that it can round-trip a query through lib/db/client.ts and
 * read the seed row from the foundation_healthcheck table.
 *
 * Never used for anything beyond this — real modules get their own routes.
 */

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";

export async function GET() {
  const envCheck = {
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    dbProvider: process.env.DB_PROVIDER ?? "supabase",
    authProvider: process.env.AUTH_PROVIDER ?? "supabase",
    storageProvider: process.env.STORAGE_PROVIDER ?? "supabase",
  };

  if (!envCheck.hasSupabaseUrl || !envCheck.hasSupabaseAnonKey) {
    return NextResponse.json(
      {
        status: "deployed_not_connected",
        message:
          "App is deployed and running. Supabase env vars are not set yet " +
          "in this environment, so the database check was skipped. Add " +
          "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        envCheck,
      },
      { status: 200 },
    );
  }

  try {
    const db = await getDb();
    const { data, error } = await db
      .from("foundation_healthcheck")
      .select("id, message, created_at")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      status: data ? "connected" : "connected_no_seed_row",
      message: data?.message ?? "Connected, but the seed row was not found.",
      dbRow: data,
      envCheck,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "connection_failed",
        error: err instanceof Error ? err.message : String(err),
        envCheck,
      },
      { status: 500 },
    );
  }
}
