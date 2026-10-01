/**
 * lib/modules/company-config/adapter.ts
 *
 * Typed data-access functions for the company-config module. Every
 * function goes through lib/db/client.ts's getDb(), never a raw Supabase
 * call from a component or Server Action -- same rule as every other
 * module.
 */

import { getDb } from "@/lib/db/client";
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
  CompanySustainabilityDeepSchema,
  DEFAULT_SUSTAINABILITY_DEEP,
  CompanyIcvDeepSchema,
  DEFAULT_ICV_DEEP,
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
  type CompanySustainabilityDeepInput,
  type CompanyIcvDeepInput,
} from "./schemas";

export type CompanyScope = {
  companyId: string;
  role: "owner" | "member";
};

/**
 * Resolves the signed-in user's company, if any. A user can belong to
 * more than one company (company_users is many-to-many); this picks the
 * first one, same simplicity precedent as config-engine's
 * getMyAdminScope() -- most users will have exactly one company for now.
 */
export async function getMyCompanyScope(): Promise<CompanyScope | null> {
  const db = await getDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

  const { data, error } = await db
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return { companyId: data.company_id as string, role: data.role as "owner" | "member" };
}

/**
 * The only way a company is ever created -- wraps the create_company()
 * RPC (companies-foundation migration), which atomically creates the
 * company row and makes the caller its owner. Never done as two
 * separate client-side inserts.
 */
export async function createCompany(countryId: string, name: string): Promise<string> {
  const db = await getDb();
  const { data, error } = await db.rpc("create_company", {
    p_country_id: countryId,
    p_name: name,
  });
  if (error) throw error;
  return data as string;
}

export type CompanyRow = {
  id: string;
  country_id: string;
  name: string;
  type: string | null;
  sector: string | null;
  size: string | null;
  year_established: number | null;
  annual_revenue: string | null;
  trade_years: string | null;
  countries_exported_to: number | null;
  differentiator: string | null;
  style_of_incorporation: string | null;
  pref_level: "company" | "individual";
  primary_role: string | null;
  secondary_roles: string[];
  sell_intents: string[];
  buy_intents: string[];
  strategic_intent: string | null;
  existing_partners: string | null;
  competitors: string | null;
  home_country_id: string | null;
  home_state: string | null;
  home_city: string | null;
  corridor_country_ids: string[];
  corridor_states: Record<string, string[]>;
  market_priority: Record<string, string>;
  state_priority: Record<string, Record<string, string>>;
  goals: string[];
  commercial_terms: Record<string, unknown>;
  pillar_selection: Record<string, unknown>;
  compliance: Record<string, unknown>;
  risk_reviewed: boolean;
  doc_checklist: string[];
  procurement_rfq_prefs: Record<string, unknown>;
  procurement_tender_prefs: Record<string, unknown>;
  procurement_contract_prefs: Record<string, unknown>;
  b2b_products: Record<string, unknown>;
  buyer_target: Record<string, unknown>;
  buyer_segments: string[];
  supplier_target: Record<string, unknown>;
  supplier_filters: string[];
  import_products: unknown[];
  import_corridors: unknown[];
  import_logistics: Record<string, unknown>;
  import_countries: string[];
  import_req: Record<string, unknown>;
  export_products: unknown[];
  export_corridors: unknown[];
  export_logistics: Record<string, unknown>;
  export_countries: string[];
  export_tier: Record<string, string>;
  export_budget: Record<string, string>;
  export_timeline: Record<string, string>;
  investment_countries: string[];
  investment_tier: Record<string, string>;
  investment_budget: Record<string, string>;
  investment_timeline: Record<string, string>;
  investment_req: Record<string, unknown>;
  landed_cost: Record<string, unknown>;
  corridor_compare_reviewed: boolean;
  finance_instruments: string[];
  sustainability_deep: Record<string, unknown>;
  icv_deep: Record<string, unknown>;
};

const COMPANY_COLUMNS =
  "id, country_id, name, type, sector, style_of_incorporation, size, year_established, annual_revenue, trade_years, countries_exported_to, differentiator, pref_level, primary_role, secondary_roles, sell_intents, buy_intents, strategic_intent, existing_partners, competitors, home_country_id, home_state, home_city, corridor_country_ids, corridor_states, market_priority, state_priority, goals, commercial_terms, pillar_selection, compliance, risk_reviewed, doc_checklist, procurement_rfq_prefs, procurement_tender_prefs, procurement_contract_prefs, b2b_products, buyer_target, buyer_segments, supplier_target, supplier_filters, import_products, import_corridors, import_logistics, import_countries, import_req, export_products, export_corridors, export_logistics, export_countries, export_tier, export_budget, export_timeline, investment_countries, investment_tier, investment_budget, investment_timeline, investment_req, landed_cost, corridor_compare_reviewed, finance_instruments, sustainability_deep, icv_deep";

export async function getCompanyById(companyId: string): Promise<CompanyRow | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw error;
  return data as CompanyRow | null;
}

export async function updateCompanyIdentity(
  companyId: string,
  input: CompanyIdentityInput,
): Promise<void> {
  const parsed = CompanyIdentitySchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({
      name: parsed.name,
      country_id: parsed.countryId,
      type: parsed.type,
      sector: parsed.sector,
      style_of_incorporation: parsed.styleOfIncorporation,
      size: parsed.size,
      year_established: parsed.yearEstablished,
      annual_revenue: parsed.annualRevenue,
      trade_years: parsed.tradeYears,
      countries_exported_to: parsed.countriesExportedTo,
      differentiator: parsed.differentiator,
      pref_level: parsed.prefLevel,
    })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyRole(
  companyId: string,
  input: CompanyRoleInput,
): Promise<void> {
  const parsed = CompanyRoleSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({
      primary_role: parsed.primaryRole,
      secondary_roles: parsed.secondaryRoles,
    })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyTradeIntent(
  companyId: string,
  input: CompanyTradeIntentInput,
): Promise<void> {
  const parsed = CompanyTradeIntentSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({
      sell_intents: parsed.sellIntents,
      buy_intents: parsed.buyIntents,
      strategic_intent: parsed.strategicIntent,
      existing_partners: parsed.existingPartners,
      competitors: parsed.competitors,
    })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyGeography(
  companyId: string,
  input: CompanyGeographyInput,
): Promise<void> {
  const parsed = CompanyGeographySchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({
      home_country_id: parsed.homeCountryId,
      home_state: parsed.homeState,
      home_city: parsed.homeCity,
      corridor_country_ids: parsed.corridorCountryIds,
      corridor_states: parsed.corridorStates,
    })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyMarketPriority(
  companyId: string,
  input: CompanyMarketPriorityInput,
): Promise<void> {
  const parsed = CompanyMarketPrioritySchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({
      market_priority: parsed.marketPriority,
      state_priority: parsed.statePriority,
    })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyGoals(
  companyId: string,
  input: CompanyGoalsInput,
): Promise<void> {
  const parsed = CompanyGoalsSchema.parse(input);
  const db = await getDb();
  const { error } = await db.from("companies").update({ goals: parsed.goals }).eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyCommercialTerms(
  companyId: string,
  input: CompanyCommercialTermsInput,
): Promise<void> {
  const parsed = CompanyCommercialTermsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ commercial_terms: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyPillarSelection(
  companyId: string,
  input: CompanyPillarSelectionInput,
): Promise<void> {
  const parsed = CompanyPillarSelectionSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ pillar_selection: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyCompliance(
  companyId: string,
  input: CompanyComplianceInput,
): Promise<void> {
  const parsed = CompanyComplianceSchema.parse(input);
  const db = await getDb();
  const { error } = await db.from("companies").update({ compliance: parsed }).eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyRiskReviewed(
  companyId: string,
  reviewed: boolean,
): Promise<void> {
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ risk_reviewed: reviewed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyDocChecklist(
  companyId: string,
  input: CompanyDocChecklistInput,
): Promise<void> {
  const parsed = CompanyDocChecklistSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ doc_checklist: parsed.docChecklist })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyRfqPrefs(
  companyId: string,
  input: CompanyRfqPrefsInput,
): Promise<void> {
  const parsed = CompanyRfqPrefsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ procurement_rfq_prefs: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyTenderPrefs(
  companyId: string,
  input: CompanyTenderPrefsInput,
): Promise<void> {
  const parsed = CompanyTenderPrefsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ procurement_tender_prefs: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyContractPrefs(
  companyId: string,
  input: CompanyContractPrefsInput,
): Promise<void> {
  const parsed = CompanyContractPrefsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ procurement_contract_prefs: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyB2BProducts(
  companyId: string,
  input: CompanyB2BProductsInput,
): Promise<void> {
  const parsed = CompanyB2BProductsSchema.parse(input);
  const db = await getDb();
  const { error } = await db.from("companies").update({ b2b_products: parsed }).eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyBuyerTarget(
  companyId: string,
  target: CompanyBuyerTargetInput,
  segments: CompanyBuyerSegmentsInput,
): Promise<void> {
  const parsedTarget = CompanyBuyerTargetSchema.parse(target);
  const parsedSegments = CompanyBuyerSegmentsSchema.parse(segments);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ buyer_target: parsedTarget, buyer_segments: parsedSegments.buyerSegments })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanySupplierTarget(
  companyId: string,
  target: CompanySupplierTargetInput,
  filters: CompanySupplierFiltersInput,
): Promise<void> {
  const parsedTarget = CompanySupplierTargetSchema.parse(target);
  const parsedFilters = CompanySupplierFiltersSchema.parse(filters);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ supplier_target: parsedTarget, supplier_filters: parsedFilters.supplierFilters })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyImportProducts(
  companyId: string,
  input: CompanyImportProductsInput,
): Promise<void> {
  const parsed = CompanyImportProductsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ import_products: parsed.importProducts })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyImportCorridors(
  companyId: string,
  input: CompanyImportCorridorsInput,
): Promise<void> {
  const parsed = CompanyImportCorridorsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ import_corridors: parsed.importCorridors })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyImportLogistics(
  companyId: string,
  input: CompanyImportLogisticsInput,
): Promise<void> {
  const parsed = CompanyImportLogisticsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ import_logistics: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyImportPrefs(
  companyId: string,
  input: CompanyImportPrefsInput,
): Promise<void> {
  const parsed = CompanyImportPrefsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ import_countries: parsed.importCountries, import_req: parsed.importReq })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyExportProducts(
  companyId: string,
  input: CompanyExportProductsInput,
): Promise<void> {
  const parsed = CompanyExportProductsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ export_products: parsed.exportProducts })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyExportCorridors(
  companyId: string,
  input: CompanyExportCorridorsInput,
): Promise<void> {
  const parsed = CompanyExportCorridorsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ export_corridors: parsed.exportCorridors })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyExportLogistics(
  companyId: string,
  input: CompanyExportLogisticsInput,
): Promise<void> {
  const parsed = CompanyExportLogisticsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ export_logistics: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyExportPrefs(
  companyId: string,
  input: CompanyExportPrefsInput,
): Promise<void> {
  const parsed = CompanyExportPrefsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({
      export_countries: parsed.exportCountries,
      export_tier: parsed.exportTier,
      export_budget: parsed.exportBudget,
      export_timeline: parsed.exportTimeline,
    })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyInvestmentPrefs(
  companyId: string,
  input: CompanyInvestmentPrefsInput,
): Promise<void> {
  const parsed = CompanyInvestmentPrefsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({
      investment_countries: parsed.investmentCountries,
      investment_tier: parsed.investmentTier,
      investment_budget: parsed.investmentBudget,
      investment_timeline: parsed.investmentTimeline,
      investment_req: parsed.investmentReq,
    })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyLandedCost(
  companyId: string,
  input: LandedCostInputsInput,
): Promise<void> {
  const parsed = LandedCostInputsSchema.parse(input);
  const db = await getDb();
  const { error } = await db.from("companies").update({ landed_cost: parsed }).eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyCorridorCompareReviewed(
  companyId: string,
  reviewed: boolean,
): Promise<void> {
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ corridor_compare_reviewed: reviewed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyFinanceInstruments(
  companyId: string,
  input: CompanyFinanceInstrumentsInput,
): Promise<void> {
  const parsed = CompanyFinanceInstrumentsSchema.parse(input);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ finance_instruments: parsed.financeInstruments })
    .eq("id", companyId);
  if (error) throw error;
}

/**
 * Sustainability's 3 sub-pages and ICV's 4 sub-pages each write to just
 * one key within their pillar's single shared jsonb blob (matching the
 * mockup's own S.sustainabilityDeep/S.icvDeep) -- so each save is a
 * read-merge-write against the current row rather than a plain update,
 * reproducing the mockup's own per-page save functions without needing
 * a separate column per sub-page.
 */
export async function updateCompanySustainabilityDeep(
  companyId: string,
  patch: Partial<CompanySustainabilityDeepInput>,
): Promise<void> {
  const current = await getCompanyById(companyId);
  if (!current) throw new Error("Company not found.");
  const merged = {
    ...DEFAULT_SUSTAINABILITY_DEEP,
    ...(current.sustainability_deep as Partial<CompanySustainabilityDeepInput>),
    ...patch,
  };
  const parsed = CompanySustainabilityDeepSchema.parse(merged);
  const db = await getDb();
  const { error } = await db
    .from("companies")
    .update({ sustainability_deep: parsed })
    .eq("id", companyId);
  if (error) throw error;
}

export async function updateCompanyIcvDeep(
  companyId: string,
  patch: Partial<CompanyIcvDeepInput>,
): Promise<void> {
  const current = await getCompanyById(companyId);
  if (!current) throw new Error("Company not found.");
  const merged = {
    ...DEFAULT_ICV_DEEP,
    ...(current.icv_deep as Partial<CompanyIcvDeepInput>),
    ...patch,
  };
  const parsed = CompanyIcvDeepSchema.parse(merged);
  const db = await getDb();
  const { error } = await db.from("companies").update({ icv_deep: parsed }).eq("id", companyId);
  if (error) throw error;
}

/**
 * Appends one row to the real, append-only audit trail (see the
 * migration's own RLS: only SELECT/INSERT policies exist, no UPDATE or
 * DELETE, verified in tests/db/company-config.test.sql). SCOPE NOTE:
 * only Governance's own save actions call this so far -- every earlier
 * Enterprise Configuration and Pillar Selection action does not yet,
 * and backfilling those is real, flagged follow-up work, not silently
 * assumed done.
 */
export async function logCompanyAudit(
  companyId: string,
  section: string,
  detail: string,
): Promise<void> {
  const db = await getDb();
  const { error } = await db
    .from("company_audit_log")
    .insert({ company_id: companyId, section, detail });
  if (error) throw error;
}

export type CompanyAuditLogRow = {
  id: string;
  section: string;
  detail: string;
  created_at: string;
};

export async function listCompanyAuditLog(
  companyId: string,
  limit = 20,
): Promise<CompanyAuditLogRow[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("company_audit_log")
    .select("id, section, detail, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CompanyAuditLogRow[];
}

/**
 * Cross-module reuse: whether a given country has real platform states
 * (built via config-engine's State Cluster), and if so, their names --
 * lets Geography & Corridors offer a real governorate/state picker for
 * home country and each corridor country instead of always falling back
 * to free text. Wraps config-engine's own listCountryStates() rather
 * than duplicating the query -- one source of truth for "does this
 * country have real states," used by two different modules.
 */
export async function getRealStateNamesForCountry(countryId: string): Promise<string[]> {
  const { listCountryStates } = await import("@/lib/modules/config-engine/adapter");
  const states = await listCountryStates(countryId);
  return states.filter((s) => s.is_active).map((s) => s.name);
}

/**
 * For the "Registration Country" dropdown -- reads the REAL countries
 * table (built for Phase 0.5), not a duplicated fixed list. The mockup's
 * own CNAMES constant was a 12-country demo fixture; the real product
 * already has actual country data.
 */
export async function listCountriesForDropdown(): Promise<
  { id: string; name: string }[]
> {
  const db = await getDb();
  const { data, error } = await db.from("countries").select("id, name").order("name");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string }[];
}
