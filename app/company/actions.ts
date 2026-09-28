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
  getCompanyById,
  getMyCompanyScope,
  getRealStateNamesForCountry,
  listCompanyAuditLog,
  logCompanyAudit,
  updateCompanyB2BProducts,
  updateCompanyBuyerTarget,
  updateCompanyCommercialTerms,
  updateCompanyCompliance,
  updateCompanyContractPrefs,
  updateCompanyCorridorCompareReviewed,
  updateCompanyDocChecklist,
  updateCompanyExportCorridors,
  updateCompanyExportLogistics,
  updateCompanyExportPrefs,
  updateCompanyExportProducts,
  updateCompanyFinanceInstruments,
  updateCompanyGeography,
  updateCompanyGoals,
  updateCompanyIdentity,
  updateCompanyImportCorridors,
  updateCompanyImportLogistics,
  updateCompanyImportPrefs,
  updateCompanyImportProducts,
  updateCompanyInvestmentPrefs,
  updateCompanyLandedCost,
  updateCompanyMarketPriority,
  updateCompanyPillarSelection,
  updateCompanyRfqPrefs,
  updateCompanyRiskReviewed,
  updateCompanyRole,
  updateCompanySupplierTarget,
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
  CompanyB2BProductsSchema,
  CompanyBuyerTargetSchema,
  CompanyBuyerSegmentsSchema,
  CompanySupplierTargetSchema,
  CompanySupplierFiltersSchema,
  CompanyImportProductsSchema,
  CompanyImportCorridorsSchema,
  CompanyImportLogisticsSchema,
  CompanyImportPrefsSchema,
  CompanyExportProductsSchema,
  CompanyExportCorridorsSchema,
  CompanyExportLogisticsSchema,
  CompanyExportPrefsSchema,
  CompanyInvestmentPrefsSchema,
  LandedCostInputsSchema,
  CompanyFinanceInstrumentsSchema,
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
  type CompanyB2BProductsInput,
  type CompanyBuyerTargetInput,
  type CompanyBuyerSegmentsInput,
  type CompanySupplierTargetInput,
  type CompanySupplierFiltersInput,
  type CompanyImportProductsInput,
  type CompanyImportCorridorsInput,
  type CompanyImportLogisticsInput,
  type CompanyImportPrefsInput,
  type CompanyExportProductsInput,
  type CompanyExportCorridorsInput,
  type CompanyExportLogisticsInput,
  type CompanyExportPrefsInput,
  type CompanyInvestmentPrefsInput,
  type LandedCostInputsInput,
  type CompanyFinanceInstrumentsInput,
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

export async function saveCompanyB2BProductsAction(
  input: CompanyB2BProductsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyB2BProductsSchema,
    input,
    updateCompanyB2BProducts,
    "Products & Services",
    "Saved B2B products and sourcing needs",
  );
}

export async function saveCompanyBuyerTargetAction(
  target: CompanyBuyerTargetInput,
  segments: CompanyBuyerSegmentsInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsedTarget = CompanyBuyerTargetSchema.safeParse(target);
  const parsedSegments = CompanyBuyerSegmentsSchema.safeParse(segments);
  if (!parsedTarget.success || !parsedSegments.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: (parsedTarget.error?.flatten().fieldErrors ?? {}) as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyBuyerTarget(scope.companyId, parsedTarget.data, parsedSegments.data);
    await logCompanyAudit(scope.companyId, "Target Buyers", "Saved buyer target profile");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanySupplierTargetAction(
  target: CompanySupplierTargetInput,
  filters: CompanySupplierFiltersInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsedTarget = CompanySupplierTargetSchema.safeParse(target);
  const parsedFilters = CompanySupplierFiltersSchema.safeParse(filters);
  if (!parsedTarget.success || !parsedFilters.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: (parsedTarget.error?.flatten().fieldErrors ?? {}) as Record<string, string[]>,
    };
  }

  try {
    await updateCompanySupplierTarget(scope.companyId, parsedTarget.data, parsedFilters.data);
    await logCompanyAudit(scope.companyId, "Target Suppliers", "Saved supplier target profile");
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyImportProductsAction(
  input: CompanyImportProductsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyImportProductsSchema,
    input,
    updateCompanyImportProducts,
    "Import Products & Services",
    "Saved import sourcing needs",
  );
}

export async function saveCompanyImportCorridorsAction(
  input: CompanyImportCorridorsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyImportCorridorsSchema,
    input,
    updateCompanyImportCorridors,
    "Import Trade Corridors",
    "Saved import corridors",
  );
}

export async function saveCompanyImportLogisticsAction(
  input: CompanyImportLogisticsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyImportLogisticsSchema,
    input,
    updateCompanyImportLogistics,
    "Import Logistics Preferences",
    "Saved ports & shipping mode",
  );
}

export async function saveCompanyImportPrefsAction(
  input: CompanyImportPrefsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyImportPrefsSchema,
    input,
    updateCompanyImportPrefs,
    "Import Preferences",
    "Saved sourcing requirement detail",
  );
}

export async function saveCompanyExportProductsAction(
  input: CompanyExportProductsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyExportProductsSchema,
    input,
    updateCompanyExportProducts,
    "Export Products & Services",
    "Saved export products",
  );
}

export async function saveCompanyExportCorridorsAction(
  input: CompanyExportCorridorsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyExportCorridorsSchema,
    input,
    updateCompanyExportCorridors,
    "Export Trade Corridors",
    "Saved export corridors",
  );
}

export async function saveCompanyExportLogisticsAction(
  input: CompanyExportLogisticsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyExportLogisticsSchema,
    input,
    updateCompanyExportLogistics,
    "Export Logistics Preferences",
    "Saved ports & shipping mode",
  );
}

export async function saveCompanyExportPrefsAction(
  input: CompanyExportPrefsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyExportPrefsSchema,
    input,
    updateCompanyExportPrefs,
    "Export Preferences",
    "Saved export markets with budget/timeline",
  );
}

export async function saveCompanyInvestmentPrefsAction(
  input: CompanyInvestmentPrefsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyInvestmentPrefsSchema,
    input,
    updateCompanyInvestmentPrefs,
    "Investment Preferences",
    "Saved investment markets with deal structure",
  );
}

export async function saveCompanyLandedCostAction(
  input: LandedCostInputsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    LandedCostInputsSchema,
    input,
    updateCompanyLandedCost,
    "Landed Cost & Margin",
    "Modelled a landed cost scenario",
  );
}

export async function saveCompanyCorridorCompareReviewedAction(
  reviewed: boolean,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  try {
    await updateCompanyCorridorCompareReviewed(scope.companyId, reviewed);
    if (reviewed) {
      await logCompanyAudit(scope.companyId, "Corridor Comparison", "Compared two trade corridors");
    }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyFinanceInstrumentsAction(
  input: CompanyFinanceInstrumentsInput,
): Promise<ActionResult> {
  return saveWithSchema(
    CompanyFinanceInstrumentsSchema,
    input,
    updateCompanyFinanceInstruments,
    "Trade Finance",
    "Saved financing instrument preferences",
  );
}

/**
 * Fetches both import and export corridors combined for Corridor
 * Comparison, mirroring the mockup's own allCorridors() -- one
 * combined list regardless of which pillar a corridor was added under.
 */
export async function getCompanyAllCorridorsAction(): Promise<
  Array<Record<string, unknown> & { corridorType: "Import" | "Export" }>
> {
  const scope = await requireCompanyScope();
  const company = await getCompanyById(scope.companyId);
  if (!company) return [];
  const imports = (company.import_corridors as Record<string, unknown>[]).map((c) => ({
    ...c,
    corridorType: "Import" as const,
  }));
  const exports = (company.export_corridors as Record<string, unknown>[]).map((c) => ({
    ...c,
    corridorType: "Export" as const,
  }));
  return [...imports, ...exports];
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
