"use server";

/**
 * app/admin/config-engine/import/actions.ts
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import { getMyAdminScope, updateCountryPillarPayload } from "@/lib/modules/config-engine/adapter";
import { ImportPayloadSchema, type ImportPayloadInput } from "@/lib/modules/config-engine/schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function saveImportPayloadAction(input: ImportPayloadInput): Promise<ActionResult> {
  await requireAuth();
  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    return { ok: false, error: "Only a Country Admin may edit this." };
  }

  const parsed = ImportPayloadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCountryPillarPayload(
      scope.countryId,
      "import",
      parsed.data,
      "configuration_in_progress",
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/import");
  return { ok: true };
}
