"use server";

/**
 * app/admin/config-engine/procurement/actions.ts
 *
 * Single Server Action for the whole pillar -- unlike Governance
 * (authorities/stakeholders needed their own tables and actions),
 * Procurement's entire payload is one pillar_configs blob, so one
 * validate-and-save action covers all 8 sections at once. Uses the same
 * generic updateCountryPillarPayload() built for Governance -- no new
 * adapter code needed for this pillar at all.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import { getMyAdminScope, updateCountryPillarPayload } from "@/lib/modules/config-engine/adapter";
import {
  ProcurementPayloadSchema,
  type ProcurementPayloadInput,
} from "@/lib/modules/config-engine/schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function saveProcurementPayloadAction(
  input: ProcurementPayloadInput,
): Promise<ActionResult> {
  await requireAuth();
  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    return { ok: false, error: "Only a Country Admin may edit this." };
  }

  const parsed = ProcurementPayloadSchema.safeParse(input);
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
      "procurement",
      parsed.data,
      "configuration_in_progress",
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/procurement");
  return { ok: true };
}
