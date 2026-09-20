"use server";

/**
 * app/admin/config-engine/governance/actions.ts
 *
 * Same pattern as every other module's actions.ts. saveGovernancePayloadAction
 * is the one worth reading closely: it validates with GovernancePayloadSchema
 * (this pillar's own shape) before calling the generic
 * updateCountryPillarPayload() -- the schema is what's pillar-specific,
 * not the write path.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import {
  addCountryAuthority,
  addCountryStakeholder,
  deleteCountryAuthority,
  deleteCountryStakeholder,
  getMyAdminScope,
  updateCountryPillarPayload,
} from "@/lib/modules/config-engine/adapter";
import {
  AuthoritySchema,
  StakeholderSchema,
  GovernancePayloadSchema,
  type AuthorityInput,
  type StakeholderInput,
  type GovernancePayloadInput,
} from "@/lib/modules/config-engine/schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function requireCountryAdminScope() {
  await requireAuth();
  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    throw new Error("Only a Country Admin may edit this.");
  }
  return scope;
}

export async function addAuthorityAction(input: AuthorityInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = AuthoritySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryAuthority(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/governance");
  return { ok: true };
}

export async function deleteAuthorityAction(authorityId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryAuthority(authorityId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/governance");
  return { ok: true };
}

export async function addStakeholderAction(input: StakeholderInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = StakeholderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryStakeholder(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/governance");
  return { ok: true };
}

export async function deleteStakeholderAction(stakeholderId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryStakeholder(stakeholderId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/governance");
  return { ok: true };
}

export async function saveGovernancePayloadAction(
  input: GovernancePayloadInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = GovernancePayloadSchema.safeParse(input);
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
      "governance",
      parsed.data,
      "configuration_in_progress",
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/governance");
  return { ok: true };
}
