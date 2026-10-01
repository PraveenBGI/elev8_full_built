/**
 * lib/modules/config-engine/schemas.ts
 *
 * Validates data BEFORE it ever reaches lib/db -- the database stores
 * jsonb/text permissively (see the migration's own comments on why), this
 * is the actual shape enforcement. Field names match
 * supabase/migrations/20260918000000_config_engine_foundation.sql's
 * `countries` table columns 1:1 -- if a column is renamed there, rename it
 * here in the same change.
 *
 * Scope note: this first pass covers Country Identity only (the scalar
 * fields from the mockup's "identity" stage). corporate_classification,
 * strategic_control, thrust_sectors, and master_data are real jsonb
 * columns already in the schema but do not have a UI or a validation
 * schema yet -- that's the next slice, not invented here to avoid
 * shipping validation for a UI that doesn't exist to use it yet.
 */

import { z } from "zod";

// ISO 4217-shaped, not validated against a real currency list yet --
// Phase 1 (Master Data) owns the canonical currency reference table this
// should eventually be checked against.
const currencyCode = z
  .string()
  .trim()
  .length(3, "Currency code must be 3 letters, e.g. OMR")
  .toUpperCase();

export const CountryIdentitySchema = z.object({
  name: z.string().trim().min(2, "Country name is required"),
  countryCode: z.string().trim().max(10).optional().nullable(),
  wbCode: z.string().trim().max(10).optional().nullable(),
  officialLanguage: z.string().trim().max(100).optional().nullable(),
  masterCurrency: currencyCode,
  ancillaryCurrency: currencyCode.optional().nullable(),
  timeZone: z.string().trim().max(100).optional().nullable(),
  dialCode: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{1,4}$/, "Dial code must be digits, optionally prefixed with +")
    .optional()
    .nullable(),
  geozone: z.string().trim().max(100).optional().nullable(),
  incomeGroup: z.string().trim().max(100).optional().nullable(),
  systemOfTrade: z.string().trim().max(100).optional().nullable(),
  wtoMember: z.boolean().default(false),
  financialYearModel: z.string().trim().max(100).optional().nullable(),
  currentFinancialYear: z.string().trim().max(20).optional().nullable(),
  workingWeek: z.string().trim().max(100).optional().nullable(),
});

export type CountryIdentityInput = z.infer<typeof CountryIdentitySchema>;

/**
 * Maps the camelCase form shape above to the snake_case column names the
 * database actually uses. Kept as an explicit, visible function rather
 * than a generic camelCase-to-snake_case utility, so a renamed column is a
 * one-line diff here, not a silent behavior change somewhere generic.
 */
export function toCountryRow(input: CountryIdentityInput) {
  return {
    name: input.name,
    country_code: input.countryCode ?? null,
    wb_code: input.wbCode ?? null,
    official_language: input.officialLanguage ?? null,
    master_currency: input.masterCurrency,
    ancillary_currency: input.ancillaryCurrency ?? null,
    time_zone: input.timeZone ?? null,
    dial_code: input.dialCode ?? null,
    geozone: input.geozone ?? null,
    income_group: input.incomeGroup ?? null,
    system_of_trade: input.systemOfTrade ?? null,
    wto_member: input.wtoMember,
    financial_year_model: input.financialYearModel ?? null,
    current_financial_year: input.currentFinancialYear ?? null,
    working_week: input.workingWeek ?? null,
  };
}

/**
 * Country Master Data -- HS Code Coverage (lib/modules/config-engine/
 * README.md has the full section breakdown; only this list and Tax &
 * VAT/GST System are built so far).
 */
export const HS_CATEGORIES = [
  "Energy & Petrochemicals",
  "Industrial & Manufacturing",
  "Electronics & ICT",
  "Healthcare & Pharma",
  "Agriculture & Food",
  "Construction Materials",
  "Logistics & Maritime",
  "Textiles & Consumer Goods",
] as const;

export const HsCodeSchema = z.object({
  code: z.string().trim().min(1, "HS code is required"),
  description: z.string().trim().min(1, "Description is required"),
  category: z.enum(HS_CATEGORIES),
  // Optional link to the global HS Code Chapters master (see
  // lib/modules/global-master-data/adapter.ts), distinct from category
  // above -- that's elev8's own business categorization, this is an
  // optional tie to the real international Harmonized System chapter,
  // never required since forcing a match would pressure admins into
  // guessing one.
  hsChapterId: z.string().uuid().nullable(),
});

export type HsCodeInput = z.infer<typeof HsCodeSchema>;

/**
 * Country Master Data -- Tax & VAT/GST System. Stored as jsonb
 * (countries.master_data.tax), not its own table -- a handful of
 * single-value settings per country, not a list, so it doesn't need the
 * relational treatment HS codes and FTAs get. See the foundation
 * migration's own comment on countries.master_data for why.
 */
export const TaxSettingsSchema = z.object({
  corporateTaxRate: z.coerce.number().min(0).max(100).nullable(),
  vatGstName: z.string().trim().max(50).nullable(),
  vatGstRate: z.coerce.number().min(0).max(100).nullable(),
  withholdingTaxRate: z.coerce.number().min(0).max(100).nullable(),
  customsDutyGeneral: z.coerce.number().min(0).max(100).nullable(),
  taxAuthority: z.string().trim().max(200).nullable(),
});

export type TaxSettingsInput = z.infer<typeof TaxSettingsSchema>;

/**
 * Country Master Data -- Free Trade Agreements. Options ported from the
 * mockup's own FTA_TYPES_ALL / FTA_STATUSES_ALL, with one change: "Signed
 * — Not Yet Ratified" becomes "Signed, Not Yet Ratified" (no em dash),
 * per this project's UI style rule, applied to the stored value itself so
 * it matches the database check constraint exactly (see the
 * 20260920000001 migration).
 */
export const FTA_TYPES = [
  "Customs Union",
  "Free Trade Agreement",
  "Preferential Trade Agreement",
  "Economic Partnership Agreement",
  "Comprehensive Economic Partnership Agreement",
] as const;

export const FTA_STATUSES = [
  "In Force",
  "Signed, Not Yet Ratified",
  "Under Negotiation",
  "Suspended",
  "Expired",
] as const;

export const FreeTradeAgreementSchema = z.object({
  agreementName: z.string().trim().min(1, "Agreement name is required"),
  type: z.enum(FTA_TYPES).nullable(),
  status: z.enum(FTA_STATUSES),
  partnerCountries: z
    .array(z.string().trim().min(1))
    .min(1, "At least one partner country is required"),
  preferentialTariffRate: z.coerce.number().min(0).max(100).nullable(),
  rulesOfOrigin: z.string().trim().max(500).nullable(),
  effectiveDate: z.string().trim().nullable(),
});

export type FreeTradeAgreementInput = z.infer<typeof FreeTradeAgreementSchema>;

/**
 * Country Master Data -- HS Code Packs. Named bundles of the codes
 * from HS Code Coverage above, so Import/Export can apply a whole set in
 * one click. codes is a list of code strings (matching country_hs_codes.
 * code), not ids -- see the migration's own comment on why.
 */
export const HsCodePackSchema = z.object({
  name: z.string().trim().min(1, "Pack name is required"),
  description: z.string().trim().max(300).nullable(),
  codes: z.array(z.string().trim().min(1)),
});

export type HsCodePackInput = z.infer<typeof HsCodePackSchema>;

/**
 * Country Master Data -- Economic & Industrial Zones.
 */
export const ZONE_TYPES = [
  "Special Economic Zone",
  "Free Zone",
  "Industrial Zone",
  "Free Trade Zone",
] as const;

export const ZoneSchema = z.object({
  name: z.string().trim().min(1, "Zone name is required"),
  type: z.enum(ZONE_TYPES),
  location: z.string().trim().max(200).nullable(),
  sector: z.string().trim().max(200).nullable(),
  incentives: z.string().trim().max(500).nullable(),
});

export type ZoneInput = z.infer<typeof ZoneSchema>;

/**
 * Country Master Data -- Ports, Airports & Customs Points.
 */
export const PORT_TYPES = ["Sea Port", "Airport", "Land Border", "Dry Port"] as const;

export const PortAirportSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  type: z.enum(PORT_TYPES),
  location: z.string().trim().max(200).nullable(),
  isCustomsPoint: z.boolean(),
});

export type PortAirportInput = z.infer<typeof PortAirportSchema>;

/**
 * State Cluster -- adding/naming a state. The mockup restricts the name
 * dropdown to a fixed OMAN_GOVERNORATES list, which is specific to that
 * one demo country. Real countries have different state/province names
 * entirely, and there's no global geo-hierarchy master yet (that's a
 * Phase 1 concern), so this is free text for now, not a fixed dropdown --
 * flagged in docs/modules/config-engine/README.md so it isn't mistaken
 * for a finished decision. is_active and is_thrust_cluster are plain
 * booleans; config_control is deliberately NOT settable through this
 * schema -- it only ever changes through set_state_config_control(),
 * the existing approval-workflow RPC, never a plain column write, so the
 * audit trail (config_approval_events) is never bypassed.
 */
export const StateSchema = z.object({
  name: z.string().trim().min(1, "State name is required"),
  isThrustCluster: z.boolean(),
});

export type StateInput = z.infer<typeof StateSchema>;

/**
 * Governance pillar -- Government Authorities and Sector Stakeholders.
 * Cross-pillar reference data (see the migration's own comment: these
 * are referenced by Procurement, Investment, Sustainability, and ICV
 * later, not governance-only), hence real tables, not payload jsonb.
 */
export const AUTHORITY_TYPES = [
  "Procurement Authority",
  "Investment Authority",
  "Trade Authority",
  "Customs Authority",
  "Sustainability Authority",
  "Standards Authority",
] as const;

export const AUTHORITY_DOMAINS = ["Procurement", "Investment", "Sustainability", "Both"] as const;

export const AuthoritySchema = z.object({
  name: z.string().trim().min(1, "Authority name is required"),
  type: z.enum(AUTHORITY_TYPES),
  domain: z.enum(AUTHORITY_DOMAINS),
  headquarters: z.string().trim().max(200).nullable(),
});

export type AuthorityInput = z.infer<typeof AuthoritySchema>;

export const StakeholderSchema = z.object({
  name: z.string().trim().min(1, "Stakeholder name is required"),
  sectors: z.array(z.string().trim().min(1)),
  domain: z.enum(AUTHORITY_DOMAINS),
});

export type StakeholderInput = z.infer<typeof StakeholderSchema>;

/**
 * Governance pillar -- Escalation Matrix and Data Governance & Access
 * Policy. Genuinely governance-specific (unlike Authorities/
 * Stakeholders above), so this is the shape of pillar_configs.payload
 * where pillar='governance', validated here before it's ever written to
 * that jsonb column.
 */
export const EscalationLevelSchema = z.object({
  level: z.number().int().min(1),
  role: z.string().trim().min(1, "Role is required"),
});

export const GovernancePayloadSchema = z.object({
  escalation: z.array(EscalationLevelSchema),
  dataGovernance: z.string().trim().max(200).nullable(),
  auditFrequency: z.enum(["Monthly", "Quarterly", "Annually"]).nullable(),
  accessPolicy: z.string().trim().max(200).nullable(),
  infoClassification: z.string().trim().max(300).nullable(),
});

export type GovernancePayloadInput = z.infer<typeof GovernancePayloadSchema>;

/**
 * Procurement pillar. Unlike Governance, every section here is genuinely
 * procurement-specific -- no cross-pillar reference tables needed, the
 * whole pillar fits in one pillar_configs.payload blob. This validates
 * the generic getCountryPillarPayload()/updateCountryPillarPayload() pair
 * built for Governance: no new migration was needed for this pillar at
 * all, only this schema.
 *
 * Enum values ported verbatim from the mockup's own TENDER_TYPE_LABELS /
 * CONTRACT_TYPES_ALL / OBLIGATION_CATEGORIES_ALL constants.
 */
export const TENDER_TYPE_KEYS = [
  "open",
  "limited",
  "restricted",
  "singleSource",
  "directAward",
  "twoStage",
  "framework",
  "dialogue",
  "emergency",
  "reverseAuction",
  "prequalified",
] as const;

export const TENDER_TYPE_LABELS: Record<(typeof TENDER_TYPE_KEYS)[number], string> = {
  open: "Open Tender",
  limited: "Limited Tender",
  restricted: "Restricted Tender",
  singleSource: "Single Source",
  directAward: "Direct Award",
  twoStage: "Two-Stage Tender",
  framework: "Framework Agreement",
  dialogue: "Competitive Dialogue",
  emergency: "Emergency Procurement",
  reverseAuction: "Reverse Auction",
  prequalified: "Prequalified Tender",
};

export const CONTRACT_TYPES = [
  "Framework Agreement",
  "Fixed Price",
  "Cost Reimbursable",
  "EPC",
  "Supply-Only",
  "Service Contract",
  "PPP",
] as const;

export const OBLIGATION_CATEGORIES = [
  "Delivery",
  "Quality",
  "Documentation",
  "Payment",
  "Compliance",
  "Sustainability",
] as const;

const tenderTypesShape = Object.fromEntries(
  TENDER_TYPE_KEYS.map((k) => [k, z.boolean()]),
) as Record<(typeof TENDER_TYPE_KEYS)[number], z.ZodBoolean>;

export const ProcurementKpiRowSchema = z.object({
  area: z.string().trim().min(1),
  kpi: z.string().trim().min(1),
  micro: z.coerce.number().min(0).max(100),
  small: z.coerce.number().min(0).max(100),
  medium: z.coerce.number().min(0).max(100),
  large: z.coerce.number().min(0).max(100),
  mfn: z.coerce.number().min(0).max(100),
  row: z.coerce.number().min(0).max(100),
});

export const ProcurementPayloadSchema = z.object({
  tenderTypes: z.object(tenderTypesShape),
  contractTypes: z.array(z.enum(CONTRACT_TYPES)),
  thresholds: z.object({
    directAward: z.coerce.number().min(0),
    limited: z.coerce.number().min(0),
    open: z.coerce.number().min(0),
  }),
  evalWeights: z
    .object({
      technical: z.coerce.number().min(0).max(100),
      commercial: z.coerce.number().min(0).max(100),
      icv: z.coerce.number().min(0).max(100),
      esg: z.coerce.number().min(0).max(100),
      compliance: z.coerce.number().min(0).max(100),
    })
    .refine(
      (w) => w.technical + w.commercial + w.icv + w.esg + w.compliance === 100,
      {
        message: "Evaluation weights must total 100%.",
        path: ["technical"],
      },
    ),
  mandatoryDocuments: z.array(z.string().trim().min(1)),
  prequalification: z.object({
    required: z.boolean(),
    minScore: z.coerce.number().min(0).max(100),
  }),
  obligationCategories: z.array(z.enum(OBLIGATION_CATEGORIES)),
  kpi: z.array(ProcurementKpiRowSchema),
});

export type ProcurementPayloadInput = z.infer<typeof ProcurementPayloadSchema>;

export const DEFAULT_PROCUREMENT_PAYLOAD: ProcurementPayloadInput = {
  tenderTypes: Object.fromEntries(TENDER_TYPE_KEYS.map((k) => [k, false])) as Record<
    (typeof TENDER_TYPE_KEYS)[number],
    boolean
  >,
  contractTypes: [],
  thresholds: { directAward: 0, limited: 0, open: 0 },
  evalWeights: { technical: 0, commercial: 0, icv: 0, esg: 0, compliance: 0 },
  mandatoryDocuments: [],
  prequalification: { required: false, minScore: 0 },
  obligationCategories: [],
  kpi: [],
};

/**
 * B2B pillar. Same self-contained shape as Procurement -- no cross-pillar
 * reference tables needed, one pillar_configs blob. Enum values ported
 * verbatim from the mockup's own OPPORTUNITY_TYPES_ALL/VERIFICATION_LEVELS
 * constants and the b2b.identities fixed list.
 */
export const BUSINESS_IDENTITIES = [
  "Buyer",
  "Supplier",
  "Manufacturer",
  "Exporter",
  "Importer",
  "Trader",
  "Distributor",
  "Contractor",
  "Investor",
] as const;

export const OPPORTUNITY_TYPES = [
  "RFI",
  "RFQ",
  "RFP",
  "Tender",
  "Buyer Requirement",
  "Supplier Requirement",
  "Partnership",
  "Distributorship",
] as const;

export const VERIFICATION_LEVELS = [
  "Unverified",
  "Verification Pending",
  "Verified",
  "Restricted",
  "Expired",
] as const;

export const B2bPayloadSchema = z.object({
  enabledIdentities: z.array(z.enum(BUSINESS_IDENTITIES)),
  categories: z.array(z.string().trim().min(1)),
  opportunityTypes: z.array(z.enum(OPPORTUNITY_TYPES)),
  requireVerification: z.boolean(),
  minVerificationLevel: z.enum(VERIFICATION_LEVELS),
  matchWeights: z
    .object({
      industry: z.coerce.number().min(0).max(100),
      product: z.coerce.number().min(0).max(100),
      location: z.coerce.number().min(0).max(100),
      certification: z.coerce.number().min(0).max(100),
      pastPerformance: z.coerce.number().min(0).max(100),
      icv: z.coerce.number().min(0).max(100),
    })
    .refine(
      (w) =>
        w.industry + w.product + w.location + w.certification + w.pastPerformance + w.icv === 100,
      { message: "Matching engine weights must total 100%.", path: ["industry"] },
    ),
});

export type B2bPayloadInput = z.infer<typeof B2bPayloadSchema>;

export const DEFAULT_B2B_PAYLOAD: B2bPayloadInput = {
  enabledIdentities: [],
  categories: [],
  opportunityTypes: [],
  requireVerification: false,
  minVerificationLevel: VERIFICATION_LEVELS[0],
  matchWeights: {
    industry: 0,
    product: 0,
    location: 0,
    certification: 0,
    pastPerformance: 0,
    icv: 0,
  },
};

/**
 * Import pillar. Same self-contained shape as Procurement/B2B -- one
 * pillar_configs blob, no new tables. Two sections genuinely integrate
 * with Master Data (already built, not duplicated here): Customs Entry
 * Points references country_ports_airports by name, HS Code Coverage
 * references country_hs_codes by code string -- matching the mockup's
 * own approach of string-equality membership, not foreign keys (same
 * reasoning as country_hs_code_packs' own codes column).
 */
export const IMPORT_INCOTERMS = [
  "EXW",
  "FCA",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
] as const;

export const LANDED_COST_COMPONENTS = [
  "Product Cost",
  "Freight",
  "Insurance",
  "Customs Duty",
  "Taxes",
  "Port Charges",
  "Handling",
  "Documentation",
  "Banking Charges",
  "Inland Transportation",
] as const;

export const SubstitutionWatchItemSchema = z.object({
  product: z.string().trim().min(1),
  importValue: z.coerce.number().min(0),
  localSupply: z.coerce.number().min(0).max(100),
  potential: z.coerce.number().min(0).max(100),
});

export const ImportPayloadSchema = z.object({
  categories: z.array(z.string().trim().min(1)),
  restricted: z.array(z.string().trim().min(1)),
  dutyBands: z.object({
    general: z.coerce.number().min(0),
    foodstuffs: z.coerce.number().min(0),
    industrialInputs: z.coerce.number().min(0),
    luxury: z.coerce.number().min(0),
  }),
  licensingRequired: z.boolean(),
  customsPoints: z.array(z.string()),
  hsCodes: z.array(z.string()),
  incoterms: z.array(z.enum(IMPORT_INCOTERMS)),
  landedCostComponents: z.array(z.enum(LANDED_COST_COMPONENTS)),
  substitutionWatch: z.array(SubstitutionWatchItemSchema),
});

export type ImportPayloadInput = z.infer<typeof ImportPayloadSchema>;

export const DEFAULT_IMPORT_PAYLOAD: ImportPayloadInput = {
  categories: [],
  restricted: [],
  dutyBands: { general: 0, foodstuffs: 0, industrialInputs: 0, luxury: 0 },
  licensingRequired: false,
  customsPoints: [],
  hsCodes: [],
  incoterms: [],
  landedCostComponents: [],
  substitutionWatch: [],
};

/**
 * Export pillar. Same self-contained shape as Import -- one
 * pillar_configs blob, no new tables. Two real Master Data integrations:
 * Trade Corridors' port picker (country_ports_airports) and Priority HS
 * Codes (country_hs_codes/country_hs_code_packs), same as Import. FTA
 * Coverage is computed at read time from country_ftas (In Force
 * agreements whose partner_countries include a corridor's destination),
 * never stored -- informational only, matching the mockup's own note
 * that it "never changes a duty band or rate automatically."
 *
 * Two things the mockup has that this schema deliberately does NOT
 * implement yet, because what they depend on doesn't exist:
 * - Target Export Markets excludes countries on Country Identity's
 *   Strategic Control watchlist. Identity's Strategic Control section
 *   was never built (see docs/modules/config-engine/README.md's list of
 *   Identity's 6 unbuilt sub-sections) -- there's nothing to exclude
 *   against yet.
 * - Target country and Priority Export Sectors are free text, not
 *   picked from a real WORLD_COUNTRIES or sector master list -- neither
 *   exists in this schema (Phase 1's future Master Data phase would own
 *   a real sector master; a global country reference is a separate,
 *   even larger open question).
 */
export const CORRIDOR_STATUSES = ["Strategic", "Preferred", "Active", "Emerging", "Restricted"] as const;

export const TRADE_FINANCE_INSTRUMENTS = [
  "Letter of Credit",
  "Bank Guarantee",
  "Advance Payment",
  "Open Account",
  "Documentary Collection",
  "Export Credit Insurance",
  "Invoice Financing",
] as const;

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

export const ExportTargetMarketSchema = z.object({
  country: z.string().trim().min(1),
  budget: z.coerce.number().min(0),
  year: z.string().trim(),
  quarter: z.enum(QUARTERS),
});

export const ExportCorridorSchema = z.object({
  origin: z.string().trim(),
  destination: z.string().trim(),
  status: z.enum(CORRIDOR_STATUSES),
  port: z.string().trim().nullable(),
});

export const ExportPayloadSchema = z.object({
  prioritySectors: z.array(z.string().trim().min(1)),
  targetCountries: z.array(ExportTargetMarketSchema),
  corridors: z.array(ExportCorridorSchema),
  hsCodes: z.array(z.string()),
  incoterms: z.array(z.enum(IMPORT_INCOTERMS)),
  tradeFinance: z.array(z.enum(TRADE_FINANCE_INSTRUMENTS)),
  incentives: z.array(z.string().trim().min(1)),
  readinessWeights: z
    .object({
      productReadiness: z.coerce.number().min(0).max(100),
      certifications: z.coerce.number().min(0).max(100),
      quality: z.coerce.number().min(0).max(100),
      pricing: z.coerce.number().min(0).max(100),
      logistics: z.coerce.number().min(0).max(100),
      financial: z.coerce.number().min(0).max(100),
      marketFit: z.coerce.number().min(0).max(100),
    })
    .refine(
      (w) =>
        w.productReadiness +
          w.certifications +
          w.quality +
          w.pricing +
          w.logistics +
          w.financial +
          w.marketFit ===
        100,
      { message: "Export readiness weights must total 100%.", path: ["productReadiness"] },
    ),
});

export type ExportPayloadInput = z.infer<typeof ExportPayloadSchema>;

export const DEFAULT_EXPORT_PAYLOAD: ExportPayloadInput = {
  prioritySectors: [],
  targetCountries: [],
  corridors: [],
  hsCodes: [],
  incoterms: [],
  tradeFinance: [],
  incentives: [],
  readinessWeights: {
    productReadiness: 0,
    certifications: 0,
    quality: 0,
    pricing: 0,
    logistics: 0,
    financial: 0,
    marketFit: 0,
  },
};

/**
 * Investment pillar. Same self-contained shape as Import/Export -- one
 * pillar_configs blob, no new tables. One real Master Data integration:
 * Special Economic Zones references country_zones by name (same
 * string-membership pattern as every other Master Data picker in this
 * project). Investment Committee Governance's "Approval Workflow" list
 * (IC_WORKFLOW_STAGES) is purely a reference display in the mockup --
 * not bound to any field -- so it's not part of this schema at all,
 * just rendered as a fixed constant in the UI.
 */
export const DUE_DILIGENCE_TYPES = [
  "Financial DD",
  "Legal DD",
  "Commercial DD",
  "Technical DD",
  "Operational DD",
  "Tax DD",
  "ESG DD",
  "Cybersecurity DD",
] as const;

export const InvestmentTicketBandSchema = z.object({
  label: z.string().trim().min(1),
  min: z.coerce.number().min(0),
  max: z.coerce.number().min(0),
});

export const InvestmentPayloadSchema = z.object({
  prioritySectors: z.array(z.string().trim().min(1)),
  incentives: z.array(z.string().trim().min(1)),
  sez: z.array(z.string()),
  ticketBands: z.array(InvestmentTicketBandSchema),
  dueDiligenceRequired: z.array(z.enum(DUE_DILIGENCE_TYPES)),
  icThreshold: z.coerce.number().min(0),
  riskBands: z
    .object({
      low: z.coerce.number().min(0).max(100),
      moderate: z.coerce.number().min(0).max(100),
      elevated: z.coerce.number().min(0).max(100),
      high: z.coerce.number().min(0).max(100),
    })
    // Real business rule from the mockup's own "Out of order" check:
    // each band's threshold must strictly exceed the one before it
    // (high may equal its own ceiling, matching the mockup's "<=" on
    // the last band specifically).
    .refine((rb) => rb.low < rb.moderate && rb.moderate < rb.elevated && rb.elevated <= rb.high, {
      message: "Risk bands must be in ascending order: low < moderate < elevated <= high.",
      path: ["low"],
    }),
  investorMatchWeights: z
    .object({
      sectorFit: z.coerce.number().min(0).max(100),
      riskAppetite: z.coerce.number().min(0).max(100),
      esgAlignment: z.coerce.number().min(0).max(100),
      icvPotential: z.coerce.number().min(0).max(100),
      returnProfile: z.coerce.number().min(0).max(100),
    })
    .refine(
      (w) => w.sectorFit + w.riskAppetite + w.esgAlignment + w.icvPotential + w.returnProfile === 100,
      { message: "Investor matching weights must total 100%.", path: ["sectorFit"] },
    ),
});

export type InvestmentPayloadInput = z.infer<typeof InvestmentPayloadSchema>;

export const DEFAULT_INVESTMENT_PAYLOAD: InvestmentPayloadInput = {
  prioritySectors: [],
  incentives: [],
  sez: [],
  ticketBands: [
    { label: "Micro", min: 0, max: 1 },
    { label: "Small", min: 1, max: 10 },
    { label: "Medium", min: 10, max: 50 },
    { label: "Large", min: 50, max: 200 },
    { label: "Mega", min: 200, max: 1000 },
  ],
  dueDiligenceRequired: [],
  icThreshold: 0,
  riskBands: { low: 0, moderate: 0, elevated: 0, high: 0 },
  investorMatchWeights: {
    sectorFit: 0,
    riskAppetite: 0,
    esgAlignment: 0,
    icvPotential: 0,
    returnProfile: 0,
  },
};

export const IC_WORKFLOW_STAGES = [
  "Screening",
  "Investment Analysis",
  "Due Diligence",
  "Investment Committee Review",
  "Approved",
  "Committed",
] as const;

/**
 * ICV / Local Content pillar -- the last of the 8. Same self-contained
 * shape as every other pillar -- one pillar_configs blob, no new
 * migration.
 *
 * Contribution Score is deliberately NOT a strict per-key schema. The
 * mockup's own ICV_SCORE_LABELS defines 58 distinct category keys spread
 * across 6 tabs (goods, services, workforce, investment, supplierDev,
 * csr), each tab with its own different key set. Hand-enumerating all 58
 * as individual Zod fields would be a huge, error-prone undertaking for
 * marginal safety benefit -- instead this validates the general SHAPE
 * (a dictionary of tabs, each a dictionary of category -> percentage),
 * while the UI still renders the exact real labels per tab from
 * ICV_SCORE_TABS/ICV_SCORE_LABELS below, ported verbatim from the
 * mockup. The labels' own em dashes ("National — MSME Micro") are
 * rendered with a colon instead ("National: MSME Micro"), matching this
 * project's no-em-dash rule.
 */
export const ICV_SCORE_TABS = [
  ["goods", "Goods"],
  ["services", "Services"],
  ["workforce", "Workforce"],
  ["investment", "Investment"],
  ["supplierDev", "Supplier Development"],
  ["csr", "CSR"],
] as const;

export const ICV_SCORE_LABELS: Record<string, Record<string, string>> = {
  goods: {
    msmeMicro: "National: MSME Micro",
    msmeSmall: "National: MSME Small",
    msmeMedium: "National: MSME Medium",
    large: "National: Large",
    mfn: "International: MFN",
    row: "International: RoW",
    lcc: "Special: LCC",
    riyada: "Special: Riyada",
    nationalProduct: "Product Categories: National Product",
    perfAbove75: "Bonus: Supplier Performance > 75",
    perfAbove50: "Bonus: Supplier Performance > 50",
  },
  services: {
    msmeMicro: "National: MSME Micro",
    msmeSmall: "National: MSME Small",
    msmeMedium: "National: MSME Medium",
    large: "National: Large",
    mfn: "International: MFN",
    row: "International: RoW",
    lcc: "Special: LCC",
    riyada: "Special: Riyada",
    perfAbove75: "Bonus: Supplier Performance > 75",
    perfAbove50: "Bonus: Supplier Performance > 50",
  },
  workforce: {
    nationalSalary: "Salaries: National (% of Gross Salary)",
    expatMfn: "Salaries: Expat MFN",
    expatRow: "Salaries: Expat RoW",
    trainNationalInst: "Training: National Institutes",
    trainIntlMfn: "Training: Intl MFN Institutes",
    trainIntlRow: "Training: Intl RoW Institutes",
    apprenticeship: "Apprenticeship",
    trainingLevy: "Training Levy",
    perfAbove75: "Bonus: Enterprise Performance > 75",
    perfAbove50: "Bonus: Enterprise Performance > 50",
    natnAbove80: "Bonus: Nationalisation > 80%",
    natnAbove50: "Bonus: Nationalisation > 50%",
  },
  investment: {
    repairing: "Repairing Facility",
    serviceMaint: "Service & Maintaining Facility",
    heavyEquip: "Heavy Equipment",
    rigsHoists: "Rigs & Hoists",
    warehouse: "Warehouse",
    newProdLine: "New Production Line",
    perfAbove75: "Bonus: Performance > 75",
    perfAbove50: "Bonus: Performance > 50",
  },
  supplierDev: {
    isoCert: "Capability: ISO Certification",
    training: "Capability: Training",
    rnd: "Capability: R&D",
    msmeMicro: "Classification: MSME Micro",
    msmeSmall: "Classification: MSME Small",
    msmeMedium: "Classification: MSME Medium",
    large: "Classification: Large",
    lcc: "Special: LCC",
    riyada: "Special: Riyada",
    ringfencing: "Capacity: Ringfencing",
    inDemandProducts: "In-Demand Products",
    inDemandServices: "In-Demand Services",
    perfAbove75: "Bonus: Performance > 75",
    perfAbove50: "Bonus: Performance > 50",
  },
  csr: {
    infrastructure: "Infrastructure",
    religious: "Religious Institutions",
    charity: "Charity Institutions",
  },
};

function zeroedScoreDefaults(): Record<string, Record<string, number>> {
  const result: Record<string, Record<string, number>> = {};
  for (const [tab] of ICV_SCORE_TABS) {
    result[tab] = Object.fromEntries(Object.keys(ICV_SCORE_LABELS[tab]).map((k) => [k, 0]));
  }
  return result;
}

export const IcvObligationRowSchema = z.object({
  sector: z.string().trim().min(1),
  micro: z.coerce.number().min(0).max(100),
  small: z.coerce.number().min(0).max(100),
  medium: z.coerce.number().min(0).max(100),
  lcc: z.coerce.number().min(0).max(100),
  riyada: z.coerce.number().min(0).max(100),
});

export const IcvPayloadSchema = z.object({
  enabled: z.boolean(),
  scoreBand: z
    .object({
      bronze: z.coerce.number().min(0).max(100),
      silver: z.coerce.number().min(0).max(100),
      gold: z.coerce.number().min(0).max(100),
      platinum: z.coerce.number().min(0).max(100),
    })
    .refine(
      (b) => b.bronze < b.silver && b.silver < b.gold && b.gold <= b.platinum,
      {
        message: "Score bands must be in ascending order: bronze < silver < gold <= platinum.",
        path: ["bronze"],
      },
    ),
  obligationAllocation: z.array(IcvObligationRowSchema),
  templates: z.object({
    fixedAssets: z.array(z.string().trim().min(1)),
    csrHeads: z.array(z.string().trim().min(1)),
    inDemandProducts: z.array(z.string().trim().min(1)),
    inDemandServices: z.array(z.string().trim().min(1)),
    capabilityDev: z.array(z.string().trim().min(1)),
  }),
  contributionScore: z.record(z.string(), z.record(z.string(), z.coerce.number())),
  spendTargets: z.object({
    procGoodsTotal: z.coerce.number().min(0),
    procGoodsNationalPct: z.coerce.number().min(0).max(100),
    procGoodsIntlPct: z.coerce.number().min(0).max(100),
    procGoodsMsmePct: z.coerce.number().min(0).max(100),
    procGoodsLccPct: z.coerce.number().min(0).max(100),
    procGoodsNatProdPct: z.coerce.number().min(0).max(100),
    procServicesTotal: z.coerce.number().min(0),
    procServicesNationalPct: z.coerce.number().min(0).max(100),
    procServicesIntlPct: z.coerce.number().min(0).max(100),
    procServicesMsmePct: z.coerce.number().min(0).max(100),
    procServicesLccPct: z.coerce.number().min(0).max(100),
    investNewTotal: z.coerce.number().min(0),
    investMsmePct: z.coerce.number().min(0).max(100),
    investLargePct: z.coerce.number().min(0).max(100),
    investLccPct: z.coerce.number().min(0).max(100),
    workforceSalaryTotal: z.coerce.number().min(0),
    workforceNationalPct: z.coerce.number().min(0).max(100),
    workforceNationalisationPct: z.coerce.number().min(0).max(100),
    supplierDevTotal: z.coerce.number().min(0),
    supplierDevMicroPct: z.coerce.number().min(0).max(100),
    supplierDevSmallPct: z.coerce.number().min(0).max(100),
    supplierDevMediumPct: z.coerce.number().min(0).max(100),
    supplierDevLargePct: z.coerce.number().min(0).max(100),
  }),
});

export type IcvPayloadInput = z.infer<typeof IcvPayloadSchema>;

export const DEFAULT_ICV_PAYLOAD: IcvPayloadInput = {
  enabled: false,
  scoreBand: { bronze: 0, silver: 0, gold: 0, platinum: 0 },
  obligationAllocation: [],
  templates: {
    fixedAssets: [],
    csrHeads: [],
    inDemandProducts: [],
    inDemandServices: [],
    capabilityDev: [],
  },
  contributionScore: zeroedScoreDefaults(),
  spendTargets: {
    procGoodsTotal: 0,
    procGoodsNationalPct: 0,
    procGoodsIntlPct: 0,
    procGoodsMsmePct: 0,
    procGoodsLccPct: 0,
    procGoodsNatProdPct: 0,
    procServicesTotal: 0,
    procServicesNationalPct: 0,
    procServicesIntlPct: 0,
    procServicesMsmePct: 0,
    procServicesLccPct: 0,
    investNewTotal: 0,
    investMsmePct: 0,
    investLargePct: 0,
    investLccPct: 0,
    workforceSalaryTotal: 0,
    workforceNationalPct: 0,
    workforceNationalisationPct: 0,
    supplierDevTotal: 0,
    supplierDevMicroPct: 0,
    supplierDevSmallPct: 0,
    supplierDevMediumPct: 0,
    supplierDevLargePct: 0,
  },
};

/**
 * Sustainability pillar. Same self-contained shape as every other
 * pillar built so far -- one pillar_configs blob, no new tables. The
 * mockup's own framing: "Sustainability is the pillar that protects
 * everything the other seven build" -- and it shows up as real
 * cross-pillar reads, not just prose: Sustainable/Green Procurement
 * displays Procurement's own current ESG evaluation weight inline
 * (read-only context, fetched from that pillar's own payload, not
 * duplicated or stored here). Verification Workflow (VERIFICATION_
 * STAGES) is purely a reference display, same pattern as Investment
 * Committee Governance's Approval Workflow -- not part of this schema.
 */
export const GHG_SCOPES = ["Scope 1", "Scope 2", "Scope 3"] as const;
export const ESG_FRAMEWORKS = ["GRI", "TCFD", "ISO 14064", "CDP", "SASB"] as const;
export const SUSTAINABILITY_VERIFICATION_STAGES = [
  "Draft",
  "Submitted",
  "Under Review",
  "Clarification Required",
  "Verified",
  "Approved",
  "Rejected",
] as const;

export const SustainabilityKpiSchema = z.object({
  name: z.string().trim().min(1),
  unit: z.string().trim(),
  baseline: z.coerce.number(),
  baselineYear: z.string().trim(),
  target: z.coerce.number(),
  targetYear: z.string().trim(),
  actual: z.coerce.number(),
});

/** Reproduces the mockup's own kpiAchievement() exactly. */
export function computeKpiAchievement(k: {
  baseline: number;
  target: number;
  actual: number;
}): number {
  if (k.target === k.baseline) return k.actual === k.target ? 100 : 0;
  const pct =
    k.target > k.baseline
      ? ((k.actual - k.baseline) / (k.target - k.baseline)) * 100
      : ((k.baseline - k.actual) / (k.baseline - k.target)) * 100;
  return Math.max(0, Math.round(pct));
}

export const SustainabilityPayloadSchema = z.object({
  enabled: z.boolean(),
  authority: z.string().trim().nullable(),
  reportingPeriod: z.enum(["Annual", "Quarterly"]),
  baselineYear: z.string().trim(),
  netZeroTarget: z.string().trim(),
  interimTarget: z.string().trim().nullable(),
  renewableTarget: z.string().trim().nullable(),

  scopesRequired: z.array(z.enum(GHG_SCOPES)),
  scope3Optional: z.boolean(),
  emissionUnit: z.string().trim().nullable(),
  emissionFactorSource: z.string().trim().nullable(),

  kpis: z.array(SustainabilityKpiSchema),

  frameworks: z.array(z.enum(ESG_FRAMEWORKS)),

  greenProcurement: z.object({
    esgThreshold: z.coerce.number().min(0).max(100),
    minSupplierEsgScore: z.coerce.number().min(0).max(100),
    requireGhgDisclosure: z.boolean(),
    requireGreenCertification: z.boolean(),
    sustainableMaterials: z.array(z.string().trim().min(1)),
  }),

  circularEconomy: z.object({
    enabled: z.boolean(),
    wasteDiversionTarget: z.coerce.number().min(0).max(100),
    categories: z.array(z.string().trim().min(1)),
  }),

  carbonMarket: z.object({
    offsetsAllowed: z.boolean(),
    creditsAllowed: z.boolean(),
    maxOffsetPctOfTarget: z.coerce.number().min(0).max(100),
    registries: z.array(z.string().trim().min(1)),
  }),

  verification: z.object({
    required: z.boolean(),
    assuranceLevel: z.enum(["Limited Assurance", "Reasonable Assurance"]),
    thresholdSpend: z.coerce.number().min(0),
    evidenceRequired: z.array(z.string().trim().min(1)),
  }),

  greenInvestment: z.object({
    enabled: z.boolean(),
    minEsgImpactForIncentive: z.coerce.number().min(0).max(100),
  }),
});

export type SustainabilityPayloadInput = z.infer<typeof SustainabilityPayloadSchema>;

export const DEFAULT_SUSTAINABILITY_PAYLOAD: SustainabilityPayloadInput = {
  enabled: false,
  authority: null,
  reportingPeriod: "Annual",
  baselineYear: "",
  netZeroTarget: "",
  interimTarget: null,
  renewableTarget: null,
  scopesRequired: [],
  scope3Optional: false,
  emissionUnit: null,
  emissionFactorSource: null,
  kpis: [],
  frameworks: [],
  greenProcurement: {
    esgThreshold: 0,
    minSupplierEsgScore: 0,
    requireGhgDisclosure: false,
    requireGreenCertification: false,
    sustainableMaterials: [],
  },
  circularEconomy: { enabled: false, wasteDiversionTarget: 0, categories: [] },
  carbonMarket: { offsetsAllowed: false, creditsAllowed: false, maxOffsetPctOfTarget: 0, registries: [] },
  verification: {
    required: false,
    assuranceLevel: "Limited Assurance",
    thresholdSpend: 0,
    evidenceRequired: [],
  },
  greenInvestment: { enabled: false, minEsgImpactForIncentive: 0 },
};

/**
 * Country Master Data -- Business Registration Types and Units of
 * Measurement. Both are plain string lists in the mockup (its own
 * chipBlock() helper: add a string, remove by index, no other fields) --
 * stored as text[] in countries.master_data, same reasoning as Tax & VAT
 * settings: no relational query need, just a handful of country-specific
 * values.
 */
export const ChipListSchema = z.array(z.string().trim().min(1)).max(100);
export type ChipListInput = z.infer<typeof ChipListSchema>;
