"use server";

/**
 * app/admin/config-engine/b2b/actions.ts
 *
 * Same one-action-per-pillar pattern as Procurement -- the whole payload
 * is one blob, one save.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import { getMyAdminScope, updateCountryPillarPayload } from "@/lib/modules/config-engine/adapter";
import { B2bPayloadSchema, type B2bPayloadInput } from "@/lib/modules/config-engine/schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function saveB2bPayloadAction(input: B2bPayloadInput): Promise<ActionResult> {
  await requireAuth();
  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    return { ok: false, error: "Only a Country Admin may edit this." };
  }

  const parsed = B2bPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCountryPillarPayload(scope.countryId, "b2b", parsed.data, "configuration_in_progress");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/b2b");
  return { ok: true };
}
