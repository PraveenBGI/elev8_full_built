"use server";

/**
 * app/company/actions.ts
 *
 * Two kinds of actions here: createCompanyAction (the entry point when a
 * signed-in user has no company yet) and the three edit actions
 * (Identity/Role/Trade Intent), each re-deriving the caller's company
 * scope from the database rather than trusting a companyId the client
 * might send -- same pattern as every other module's actions.ts.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import {
  createCompany,
  getMyCompanyScope,
  getRealStateNamesForCountry,
  updateCompanyGeography,
  updateCompanyIdentity,
  updateCompanyMarketPriority,
  updateCompanyRole,
  updateCompanyTradeIntent,
} from "@/lib/modules/company-config/adapter";
import {
  CompanyIdentitySchema,
  CompanyRoleSchema,
  CompanyTradeIntentSchema,
  CompanyGeographySchema,
  CompanyMarketPrioritySchema,
  type CompanyIdentityInput,
  type CompanyRoleInput,
  type CompanyTradeIntentInput,
  type CompanyGeographyInput,
  type CompanyMarketPriorityInput,
} from "@/lib/modules/company-config/schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createCompanyAction(
  countryId: string,
  name: string,
): Promise<ActionResult> {
  await requireAuth();

  if (!countryId) {
    return { ok: false, error: "Choose a registration country." };
  }
  if (!name.trim()) {
    return { ok: false, error: "Company name is required." };
  }

  try {
    await createCompany(countryId, name);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create company." };
  }

  revalidatePath("/company");
  return { ok: true };
}

async function requireCompanyScope() {
  await requireAuth();
  const scope = await getMyCompanyScope();
  if (!scope) {
    throw new Error("No company found for this account.");
  }
  return scope;
}

export async function saveCompanyIdentityAction(
  input: CompanyIdentityInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyIdentitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyIdentity(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyRoleAction(input: CompanyRoleInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyRole(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyTradeIntentAction(
  input: CompanyTradeIntentInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyTradeIntentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyTradeIntent(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyGeographyAction(
  input: CompanyGeographyInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyGeographySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyGeography(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyMarketPriorityAction(
  input: CompanyMarketPriorityInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyMarketPrioritySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyMarketPriority(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

/**
 * Client-callable lookup: does this country have real platform states
 * (built via config-engine's State Cluster), and if so, what are their
 * names? Lets the Geography & Corridors UI offer a real picker for a
 * newly-selected corridor country without needing every possible
 * country's states preloaded on initial page load.
 */
export async function getRealStateNamesForCountryAction(countryId: string): Promise<string[]> {
  await requireAuth();
  try {
    return await getRealStateNamesForCountry(countryId);
  } catch {
    return [];
  }
}
