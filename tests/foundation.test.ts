/**
 * Phase 0 sanity test. This is deliberately trivial -- it exists to prove
 * the test harness itself works (npm run test is a real gate, not a stub)
 * before Phase 1 needs actual data-layer integration tests.
 *
 * Per 04-BUILD-STANDARDS.md, every module from Phase 1 onward must add at
 * least one integration test covering its primary happy path. This file is
 * the seed that pattern grows from.
 */
import { describe, expect, it } from "vitest";

describe("foundation", () => {
  it("environment provider defaults resolve to supabase", () => {
    const dbProvider = process.env.DB_PROVIDER ?? "supabase";
    const authProvider = process.env.AUTH_PROVIDER ?? "supabase";
    const storageProvider = process.env.STORAGE_PROVIDER ?? "supabase";

    expect(dbProvider).toBe("supabase");
    expect(authProvider).toBe("supabase");
    expect(storageProvider).toBe("supabase");
  });
});
