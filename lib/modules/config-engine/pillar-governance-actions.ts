"use server";

/**
 * lib/modules/config-engine/pillar-governance-actions.ts
 *
 * Shared across every pillar's UI (Governance, Procurement, B2B, and
 * whichever pillar comes next) -- field-level locking and sector/location
 * conditions work identically regardless of which pillar they're
 * managing, so this is one set of actions, not duplicated per pillar the
 * way each pillar's own payload save action necessarily is (since each
 * pillar has its own Zod schema for its payload, but locking/conditions
 * don't touch payload shape at all).
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import {
  addCountryPillarCondition,
  deleteCountryPillarCondition,
  getMyAdminScope,
  setCountryPillarLockedFields,
} from "@/lib/modules/config-engine/adapter";
import type { PillarId } from "@/lib/modules/config-engine/stages";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireCountryAdminScope() {
  await requireAuth();
  const scope = await getMyAdminScope();
  if (!scope || scope.role !== "country_admin") {
    throw new Error("Only a Country Admin may edit this.");
  }
  return scope;
}

export async function saveLockedFieldsAction(
  pillar: PillarId,
  lockedFields: string[],
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await setCountryPillarLockedFields(scope.countryId, pillar, lockedFields);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath(`/admin/config-engine/${pillar}`);
  return { ok: true };
}

export async function addConditionAction(
  pillar: PillarId,
  conditionType: "sector" | "location",
  conditionValue: string,
  overridePayloadJson: string,
  priority: number,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  if (!conditionValue.trim()) {
    return { ok: false, error: "Condition value is required." };
  }

  let overridePayload: Record<string, unknown>;
  try {
    overridePayload = JSON.parse(overridePayloadJson);
  } catch {
    return { ok: false, error: "Override payload must be valid JSON, e.g. {\"minScore\": 80}." };
  }

  try {
    await addCountryPillarCondition(
      scope.countryId,
      pillar,
      conditionType,
      conditionValue.trim(),
      overridePayload,
      priority,
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath(`/admin/config-engine/${pillar}`);
  return { ok: true };
}

export async function deleteConditionAction(
  pillar: PillarId,
  conditionId: string,
): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryPillarCondition(conditionId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath(`/admin/config-engine/${pillar}`);
  return { ok: true };
}
