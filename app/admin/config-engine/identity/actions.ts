"use server";

/**
 * app/admin/config-engine/identity/actions.ts
 *
 * Server Action -- runs only on the server, never ships to the browser.
 * requireAuth() first (per lib/auth/adapter.ts), then re-derives the
 * caller's admin scope from the database rather than trusting a
 * countryId the client might send -- a Server Action's arguments are as
 * untrusted as any API route's body.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import {
  getMyAdminScope,
  updateCountryIdentity,
} from "@/lib/modules/config-engine/adapter";
import {
  CountryIdentitySchema,
  type CountryIdentityInput,
} from "@/lib/modules/config-engine/schemas";

export type SaveCountryIdentityResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function saveCountryIdentityAction(
  input: CountryIdentityInput,
): Promise<SaveCountryIdentityResult> {
  await requireAuth();

  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    // Mirrors the RLS policy this would hit anyway (countries_write_
    // country_admin_only) -- checked here too so the form gets a clear
    // message instead of a raw Postgres error.
    return { ok: false, error: "Only a Country Admin may edit this." };
  }

  const parsed = CountryIdentitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    await updateCountryIdentity(scope.countryId, parsed.data);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Save failed.",
    };
  }

  revalidatePath("/admin/config-engine/identity");
  return { ok: true };
}
