"use server";

/**
 * app/admin/config-engine/masterdata/actions.ts
 *
 * Same pattern as identity/actions.ts: requireAuth() first, re-derive the
 * caller's admin scope from the database rather than trusting client
 * input, validate with the Zod schema before writing.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import {
  addCountryHsCode,
  addCountryFta,
  addCountryHsCodePack,
  addCountryZone,
  addCountryPortAirport,
  deleteCountryHsCode,
  deleteCountryFta,
  deleteCountryHsCodePack,
  deleteCountryZone,
  deleteCountryPortAirport,
  getMyAdminScope,
  updateCountryTaxSettings,
  updateCountryRegistrationTypes,
  updateCountryUnitsOfMeasurement,
} from "@/lib/modules/config-engine/adapter";
import {
  HsCodeSchema,
  TaxSettingsSchema,
  FreeTradeAgreementSchema,
  ChipListSchema,
  HsCodePackSchema,
  ZoneSchema,
  PortAirportSchema,
  type HsCodeInput,
  type TaxSettingsInput,
  type FreeTradeAgreementInput,
  type ChipListInput,
  type HsCodePackInput,
  type ZoneInput,
  type PortAirportInput,
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

export async function addHsCodeAction(input: HsCodeInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = HsCodeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryHsCode(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function deleteHsCodeAction(hsCodeId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryHsCode(hsCodeId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function saveTaxSettingsAction(
  input: TaxSettingsInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = TaxSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCountryTaxSettings(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function addFtaAction(
  input: FreeTradeAgreementInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = FreeTradeAgreementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryFta(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function deleteFtaAction(ftaId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryFta(ftaId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function saveRegistrationTypesAction(items: ChipListInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = ChipListSchema.safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: "Invalid list." };
  }

  try {
    await updateCountryRegistrationTypes(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function saveUnitsOfMeasurementAction(items: ChipListInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = ChipListSchema.safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: "Invalid list." };
  }

  try {
    await updateCountryUnitsOfMeasurement(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function addHsCodePackAction(input: HsCodePackInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = HsCodePackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryHsCodePack(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function deleteHsCodePackAction(packId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryHsCodePack(packId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function addZoneAction(input: ZoneInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = ZoneSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryZone(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function deleteZoneAction(zoneId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryZone(zoneId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function addPortAirportAction(input: PortAirportInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = PortAirportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await addCountryPortAirport(scope.countryId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}

export async function deletePortAirportAction(portId: string): Promise<ActionResult> {
  try {
    await requireCountryAdminScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await deleteCountryPortAirport(portId);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed." };
  }

  revalidatePath("/admin/config-engine/masterdata");
  return { ok: true };
}
