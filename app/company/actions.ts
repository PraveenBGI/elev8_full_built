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
  listCompanyAuditLog,
  logCompanyAudit,
  updateCompanyCommercialTerms,
  updateCompanyCompliance,
  updateCompanyContractPrefs,
  updateCompanyDocChecklist,
  updateCompanyGeography,
  updateCompanyGoals,
  updateCompanyIdentity,
  updateCompanyMarketPriority,
  updateCompanyPillarSelection,
  updateCompanyRfqPrefs,
  updateCompanyRiskReviewed,
  updateCompanyRole,
  updateCompanyTenderPrefs,
  updateCompanyTradeIntent,
} from "@/lib/modules/company-config/adapter";
import {
  CompanyIdentitySchema,
  CompanyRoleSchema,
  CompanyTradeIntentSchema,
  CompanyGeographySchema,
  CompanyMarketPrioritySchema,
  CompanyGoalsSchema,
  CompanyCommercialTermsSchema,
  CompanyPillarSelectionSchema,
  CompanyComplianceSchema,
  CompanyDocChecklistSchema,
  CompanyRfqPrefsSchema,
  CompanyTenderPrefsSchema,
  CompanyContractPrefsSchema,
  type CompanyIdentityInput,
  type CompanyRoleInput,
  type CompanyTradeIntentInput,
  type CompanyGeographyInput,
  type CompanyMarketPriorityInput,
  type CompanyGoalsInput,
  type CompanyCommercialTermsInput,
  type CompanyPillarSelectionInput,
  type CompanyComplianceInput,
  type CompanyDocChecklistInput,
  type CompanyRfqPrefsInput,
  type CompanyTenderPrefsInput,
  type CompanyContractPrefsInput,
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

export async function saveCompanyGoalsAction(input: CompanyGoalsInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyGoalsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyGoals(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyCommercialTermsAction(
  input: CompanyCommercialTermsInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyCommercialTermsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyCommercialTerms(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyPillarSelectionAction(
  input: CompanyPillarSelectionInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyPillarSelectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyPillarSelection(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyComplianceAction(
  input: CompanyComplianceInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyComplianceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyCompliance(scope.companyId, parsed.data);
    await logCompanyAudit(
      scope.companyId,
      "Compliance & Certs",
      "Saved certification & regulatory requirements",
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyRiskReviewedAction(reviewed: boolean): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await updateCompanyRiskReviewed(scope.companyId, reviewed);
    if (reviewed) {
      await logCompanyAudit(scope.companyId, "Risk Intelligence", "Reviewed corridor risk register");
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyDocChecklistAction(
  input: CompanyDocChecklistInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyDocChecklistSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyDocChecklist(scope.companyId, parsed.data);
    await logCompanyAudit(scope.companyId, "Document Room", "Reviewed document checklist");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

async function saveWithSchema<T>(
  schema: { safeParse: (input: unknown) => { success: boolean; data?: T; error?: { flatten: () => { fieldErrors: unknown } } } },
  input: T,
  update: (companyId: string, parsed: T) => Promise<void>,
  auditSection: string,
  auditDetail: string,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success || parsed.data === undefined) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: (parsed.error?.flatten().fieldErrors ?? {}) as Record<string, string[]>,
    };
  }

  try {
    await update(scope.companyId, parsed.data);
    await logCompanyAudit(scope.companyId, auditSection, auditDetail);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyRfqPrefsAction(input: CompanyRfqPrefsInput): Promise<ActionResult> {
  return saveWithSchema(
    CompanyRfqPrefsSchema,
    input,
    updateCompanyRfqPrefs,
    "RFQ Preferences",
    "Saved RFQ feed preferences",
  );
}

export async function saveCompanyTenderPrefsAction(
  input: CompanyTenderPrefsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyTenderPrefsSchema,
    input,
    updateCompanyTenderPrefs,
    "Tender Preferences",
    "Saved tender filters",
  );
}

export async function saveCompanyContractPrefsAction(
  input: CompanyContractPrefsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyContractPrefsSchema,
    input,
    updateCompanyContractPrefs,
    "Contract Interests",
    "Saved contract interest filters",
  );
}

export async function listCompanyAuditLogAction(): Promise<
  ReturnType<typeof listCompanyAuditLog>
> {
  const scope = await requireCompanyScope();
  return listCompanyAuditLog(scope.companyId);
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
