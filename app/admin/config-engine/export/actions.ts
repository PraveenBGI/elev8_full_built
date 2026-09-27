"use server";

/**
 * app/admin/config-engine/export/actions.ts
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import { getMyAdminScope, updateCountryPillarPayload } from "@/lib/modules/config-engine/adapter";
import { ExportPayloadSchema, type ExportPayloadInput } from "@/lib/modules/config-engine/schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function saveExportPayloadAction(input: ExportPayloadInput): Promise<ActionResult> {
  await requireAuth();
  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    return { ok: false, error: "Only a Country Admin may edit this." };
  }

  const parsed = ExportPayloadSchema.safeParse(input);
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
      "export",
      parsed.data,
      "configuration_in_progress",
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/export");
  return { ok: true };
}
