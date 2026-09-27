"use server";

/**
 * lib/modules/config-engine/country-publish-actions.ts
 *
 * One action: a Country Admin publishes their own country directly, no
 * approval step. See the migration's own comment for why this collapsed
 * from a 3-step workflow to one action.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import { getMyAdminScope, publishCountryConfig } from "@/lib/modules/config-engine/adapter";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function publishCountryConfigAction(notes?: string): Promise<ActionResult> {
  await requireAuth();
  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    return { ok: false, error: "Only a Country Admin may publish this." };
  }

  try {
    await publishCountryConfig(scope.countryId, notes);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Publish failed." };
  }

  revalidatePath("/admin/config-engine", "layout");
  return { ok: true };
}
