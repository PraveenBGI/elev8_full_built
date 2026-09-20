"use server";

/**
 * app/admin/config-engine/statecluster/actions.ts
 *
 * Same pattern as identity/actions.ts and masterdata/actions.ts:
 * requireAuth() first, re-derive the caller's admin scope from the
 * database, validate with Zod before writing.
 *
 * setStateConfigControlAction is the one action here that does NOT go
 * through requireCountryAdminScope() + a direct adapter write -- it calls
 * setStateConfigControl(), which wraps the set_state_config_control() RPC
 * from the approval-workflow migration. That RPC does its own
 * authorization check (is_country_admin of the state's country) and
 * writes the audit trail itself, so duplicating an authorization check
 * here would just be redundant, not safer.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import {
  addCountryState,
  deleteCountryState,
  getMyAdminScope,
  setStateActive,
  setStateConfigControl,
  setStateThrustCluster,
} from "@/lib/modules/config-engine/adapter";
import { StateSchema, type StateInput } from "@/lib/modules/config-engine/schemas";

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

export async function addStateAction(input: StateInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = StateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryState(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/statecluster");
  return { ok: true };
}

export async function toggleStateActiveAction(
  stateId: string,
  isActive: boolean,
): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await setStateActive(stateId, isActive);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/statecluster");
  return { ok: true };
}

export async function toggleStateThrustAction(
  stateId: string,
  isThrust: boolean,
): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await setStateThrustCluster(stateId, isThrust);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/statecluster");
  return { ok: true };
}

export async function removeStateAction(stateId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryState(stateId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/statecluster");
  return { ok: true };
}

export async function setStateConfigControlAction(
  stateId: string,
  control: "central" | "state",
): Promise<ActionResult> {
  await requireAuth();

  try {
    await setStateConfigControl(
      stateId,
      control,
      control === "state"
        ? "Delegated to State Admin from the State Cluster screen."
        : "Reverted to central configuration from the State Cluster screen.",
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/statecluster");
  return { ok: true };
}
