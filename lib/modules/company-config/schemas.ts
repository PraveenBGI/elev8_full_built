import { z } from "zod";

/**
 * lib/modules/company-config/schemas.ts
 *
 * Company Configuration (the Preference Engine) -- a genuinely new
 * module, distinct from lib/modules/config-engine (Country/State). That
 * module is the RULES layer; this is a company's own PREFERENCES within
 * those rules. Source: elev8-final__1___2_.html, read field-by-field,
 * same discipline as every other module in this project.
 *
 * Scope this file covers: Business Identity, Role, Trade Intent -- the
 * first 3 of the mockup's 7 "Enterprise Configuration" steps. Geography
 * & Corridors, Target Market Priority, Business Objectives (Goals), and
 * Commercial Terms are not built yet -- see
 * docs/modules/company-config/README.md for the full picture and what's
 * deliberately deferred.
 */

export const COMPANY_TYPES = [
  "Buyer Organization",
  "Seller / Supplier Organization",
  "Government Entity",
  "SME",
  "Startup",
  "Consultant",
  "Logistics Provider",
  "Financial Institution",
] as const;

export const COMPANY_SECTORS = [
  "Energy",
  "Oil & Gas",
  "Manufacturing",
  "Construction",
  "ICT",
  "Healthcare",
  "Logistics",
  "Food & Agriculture",
  "Tourism",
  "Mining",
  "Financial Services",
] as const;

export const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-1000 employees",
  "1000+ employees",
] as const;

export const ANNUAL_REVENUE_BANDS = [
  "Under $500K",
  "$500K to $2M",
  "$2M to $10M",
  "$10M to $50M",
  "$50M+",
] as const;

export const TRADE_EXPERIENCE_BANDS = [
  "New to trade",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10+ years",
] as const;

export const PRIMARY_ROLES = [
  "Buyer",
  "Seller / Supplier",
  "Importer",
  "Exporter",
  "Investor",
  "Project Owner",
] as const;

export const ADDITIONAL_ROLES = [
  "Manufacturer",
  "Distributor",
  "Wholesaler",
  "Retailer",
  "Trader",
  "Service Provider",
  "Contractor",
  "EPC Contractor",
  "Agent",
  "Dealer",
] as const;

export const SELL_INTENTS = [
  "Export products",
  "Sell products domestically",
  "Offer services",
  "Find international buyers",
  "Find distributors",
  "Find agents",
  "Respond to RFQs",
  "Participate in tenders",
  "Win contracts",
  "Find channel partners",
] as const;

export const BUY_INTENTS = [
  "Import products",
  "Source products",
  "Source raw materials",
  "Find suppliers",
  "Request quotations",
  "Issue RFQs",
  "Issue tenders",
  "Identify manufacturers",
  "Find service providers",
  "Establish supply agreements",
] as const;

export const CompanyIdentitySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  countryId: z.string().uuid("Registration country is required"),
  type: z.enum(COMPANY_TYPES).nullable(),
  sector: z.enum(COMPANY_SECTORS).nullable(),
  size: z.enum(COMPANY_SIZES).nullable(),
  yearEstablished: z.coerce.number().int().min(1800).max(2100).nullable(),
  annualRevenue: z.enum(ANNUAL_REVENUE_BANDS).nullable(),
  tradeYears: z.enum(TRADE_EXPERIENCE_BANDS).nullable(),
  countriesExportedTo: z.coerce.number().int().min(0).nullable(),
  differentiator: z.string().trim().max(500).nullable(),
  prefLevel: z.enum(["company", "individual"]),
});

export type CompanyIdentityInput = z.infer<typeof CompanyIdentitySchema>;

export const CompanyRoleSchema = z.object({
  primaryRole: z.enum(PRIMARY_ROLES),
  secondaryRoles: z.array(z.enum([...PRIMARY_ROLES, ...ADDITIONAL_ROLES])),
});

export type CompanyRoleInput = z.infer<typeof CompanyRoleSchema>;

export const CompanyTradeIntentSchema = z.object({
  sellIntents: z.array(z.enum(SELL_INTENTS)),
  buyIntents: z.array(z.enum(BUY_INTENTS)),
  strategicIntent: z.string().trim().max(1000).nullable(),
  existingPartners: z.string().trim().max(500).nullable(),
  competitors: z.string().trim().max(500).nullable(),
});

export type CompanyTradeIntentInput = z.infer<typeof CompanyTradeIntentSchema>;

/**
 * Geography & Corridors, the 4th of 7 Enterprise Configuration steps.
 * homeCountryId is deliberately separate from the company's own
 * countryId (Business Identity's registration country) -- see the
 * migration's own comment on why these are two distinct fields, not one
 * value duplicated.
 *
 * homeState and each corridor's state list are plain strings (state/
 * governorate NAMES), not foreign keys -- same reasoning as every other
 * Master Data picker in this project. The UI decides at render time
 * whether to offer a real picker (when the selected country has actual
 * platform states via config-engine's listCountryStates()) or a free-text
 * add/remove list (when it doesn't) -- the schema doesn't need to know
 * which case applies, it just stores whatever name ends up chosen.
 */
export const CompanyGeographySchema = z.object({
  homeCountryId: z.string().uuid("Home country is required"),
  homeState: z.string().trim().nullable(),
  homeCity: z.string().trim().nullable(),
  corridorCountryIds: z.array(z.string().uuid()),
  corridorStates: z.record(z.string(), z.array(z.string())),
});

export type CompanyGeographyInput = z.infer<typeof CompanyGeographySchema>;

/**
 * Target Market Priority, the 5th of 7 Enterprise Configuration steps.
 * Genuinely simple by design: this step has no data of its own beyond a
 * priority ranking, it reuses Geography & Corridors' own home/corridor
 * countries (which countries to rank) and corridor states (which
 * countries get a state-level sub-ranking too), matching the mockup's
 * own comment: "Reuses that selection rather than asking again."
 *
 * Keyed by country UUID (as a jsonb object key, i.e. a string) --
 * consistent with Geography's own corridorStates, not the mockup's
 * 2-letter country codes.
 */
export const MARKET_TIERS = ["high", "medium", "explore"] as const;
export const MARKET_TIER_LABELS: Record<(typeof MARKET_TIERS)[number], string> = {
  high: "Priority Market",
  medium: "Secondary Market",
  explore: "Emerging / Explore",
};

export const CompanyMarketPrioritySchema = z.object({
  marketPriority: z.record(z.string(), z.enum(MARKET_TIERS)),
  statePriority: z.record(z.string(), z.record(z.string(), z.enum(MARKET_TIERS))),
});

export type CompanyMarketPriorityInput = z.infer<typeof CompanyMarketPrioritySchema>;

/**
 * Business Objectives (Goals), the 6th of 7 Enterprise Configuration
 * steps. The mockup's own "top 3 priorities" is guidance text in its UI
 * copy, not a hard technical limit -- its save gate only requires at
 * least one goal selected, no upper bound anywhere. This schema
 * deliberately doesn't invent a stricter max-3 constraint the mockup
 * itself doesn't have.
 *
 * This is the field GOAL_PILLAR_MAP will read directly once Pillar
 * Selection is built, alongside ROLE_PILLAR_MATRIX (already keyed off
 * primaryRole/secondaryRoles, built for Role).
 */
export const GOALS = [
  "Find Opportunities",
  "Find Buyers",
  "Find Suppliers",
  "Increase Exports",
  "Reduce Import Cost",
  "Win Procurement",
  "Find Investment",
  "Find Projects",
  "Improve Compliance",
  "Improve Sustainability",
  "Improve ICV",
  "Build Partnerships",
  "Market Intelligence",
] as const;

export const CompanyGoalsSchema = z.object({
  goals: z.array(z.enum(GOALS)),
});

export type CompanyGoalsInput = z.infer<typeof CompanyGoalsSchema>;

/**
 * Commercial Terms, the 7th and LAST of the Enterprise Configuration
 * steps. One nested object stored in one jsonb column
 * (companies.commercial_terms) -- these fields are always read/written
 * together as one coherent unit (matching the mockup's own
 * S.commercial sub-object), never queried individually elsewhere, so
 * there's no reason to flatten them into their own columns the way
 * Identity's fields were.
 *
 * incotermsPreferred/incotermsAccepted are folded into this same object
 * even though the mockup keeps them as siblings of S.commercial
 * (S.incotermsPreferred, not S.commercial.incotermsPreferred) -- a
 * minor reshaping for one clean column, not a behavior change.
 *
 * INCOTERM_LIST is redeclared here rather than imported from
 * config-engine's schemas (which has the identical list as
 * IMPORT_INCOTERMS, reused between Import and Export there) --
 * deliberately keeping company-config's only cross-module dependency on
 * config-engine limited to the one real integration point
 * (getRealStateNamesForCountry for Geography), not extended to trivial
 * constants too.
 */
export const CURRENCIES = ["USD", "OMR", "SAR", "AED", "EUR", "INR"] as const;
export const PAYMENT_TERMS = ["Letter of Credit", "Advance Payment", "Net 30", "Net 60"] as const;
export const INCOTERM_LIST = [
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
export const CONTRACT_PREF_OPTIONS = [
  "Spot / One-off Deal",
  "Short-Term Contract",
  "Framework Agreement",
  "Long-Term Contract",
] as const;

export const DEAL_SIZE_VALUES = ["lt50k", "50k250k", "250k1m", "1m5m", "gt5m"] as const;
export const DEAL_SIZES: [(typeof DEAL_SIZE_VALUES)[number], string][] = [
  ["lt50k", "<$50K"],
  ["50k250k", "$50K-$250K"],
  ["250k1m", "$250K-$1M"],
  ["1m5m", "$1M-$5M"],
  ["gt5m", ">$5M"],
];
export const DEAL_SIZE_LABELS: Record<string, string> = Object.fromEntries(DEAL_SIZES);

export const CompanyCommercialTermsSchema = z.object({
  currency: z.enum(CURRENCIES).nullable(),
  payment: z.enum(PAYMENT_TERMS).nullable(),
  acceptedCurrencies: z.array(z.enum(CURRENCIES)),
  dealSize: z.enum(DEAL_SIZE_VALUES).nullable(),
  dealMin: z.string().trim().nullable(),
  dealMax: z.string().trim().nullable(),
  contractPref: z.enum(CONTRACT_PREF_OPTIONS).nullable(),
  incotermsPreferred: z.array(z.enum(INCOTERM_LIST)),
  incotermsAccepted: z.array(z.enum(INCOTERM_LIST)),
});

export type CompanyCommercialTermsInput = z.infer<typeof CompanyCommercialTermsSchema>;

export const DEFAULT_COMMERCIAL_TERMS: CompanyCommercialTermsInput = {
  currency: null,
  payment: null,
  acceptedCurrencies: [],
  dealSize: null,
  dealMin: null,
  dealMax: null,
  contractPref: null,
  incotermsPreferred: [],
  incotermsAccepted: [],
};

/**
 * Pillar Selection, Phase 2's first step. Reads Role and Goals (both
 * already captured in Enterprise Configuration) against two fixed
 * lookup tables ported verbatim from the mockup -- ROLE_PILLAR_MATRIX
 * and GOAL_PILLAR_MAP -- to recommend which of the 8 pillars are
 * relevant. This is deliberately NOT a Claude API call: per
 * 03-AI-ENGINES-CLAUDE-API.md's own guidance, matching/recommendation
 * work over structured data belongs in plain logic, and counting how
 * many independent signals point to each pillar is exactly that.
 * "AI Suggested" in the UI names the origin of the suggestion, not the
 * mechanism producing it.
 */
export const PILLAR_IDS = [
  "governance",
  "procurement",
  "b2b",
  "import",
  "export",
  "investment",
  "sustainability",
  "icv",
] as const;

export type PillarIdLiteral = (typeof PILLAR_IDS)[number];

export const PILLAR_META: { id: PillarIdLiteral; label: string; desc: string }[] = [
  { id: "governance", label: "Governance", desc: "Laws, regulations, compliance" },
  { id: "procurement", label: "Procurement", desc: "RFQs, tenders, suppliers" },
  { id: "b2b", label: "B2B", desc: "Buyers, suppliers, networking" },
  { id: "import", label: "Import", desc: "Sourcing, tariffs, customs" },
  { id: "export", label: "Export", desc: "Markets, buyers, logistics" },
  { id: "investment", label: "Investment", desc: "Investors, projects, funding" },
  { id: "sustainability", label: "Sustainability", desc: "ESG, green products, carbon" },
  { id: "icv", label: "ICV", desc: "Local content, mandatory lists" },
];

export const ROLE_PILLAR_MATRIX: Record<string, string[]> = {
  "Seller / Supplier": ["governance", "procurement", "export", "b2b", "sustainability", "icv"],
  Exporter: ["governance", "procurement", "export", "b2b", "sustainability", "icv"],
  Buyer: ["governance", "procurement", "import", "b2b", "sustainability", "icv"],
  Importer: ["governance", "procurement", "import", "b2b", "sustainability", "icv"],
  Investor: ["governance", "investment", "b2b", "sustainability", "icv"],
  "Project Owner": ["governance", "procurement", "investment", "b2b", "sustainability", "icv"],
};

export const GOAL_PILLAR_MAP: Record<string, string[]> = {
  "Improve Sustainability": ["sustainability"],
  "Improve ICV": ["icv"],
  "Find Investment": ["investment"],
  "Find Projects": ["investment"],
  "Win Procurement": ["procurement"],
  "Increase Exports": ["export"],
  "Reduce Import Cost": ["import"],
  "Improve Compliance": ["governance"],
  "Build Partnerships": ["b2b"],
  "Find Buyers": ["b2b"],
  "Find Suppliers": ["b2b"],
  "Find Opportunities": ["b2b"],
  "Market Intelligence": ["b2b", "governance"],
};

/**
 * Counts independent signals (role matrix + goals) pointing to each
 * pillar -- reproduces the mockup's own computePillarSignals() exactly.
 * 2+ signals is treated as "High confidence", 1 as "Medium", by the UI,
 * not by this function.
 */
export function computePillarSignals(
  roles: string[],
  goals: string[],
): Record<string, number> {
  const signals: Record<string, number> = {};
  for (const role of roles) {
    for (const pillarId of ROLE_PILLAR_MATRIX[role] ?? []) {
      signals[pillarId] = (signals[pillarId] ?? 0) + 1;
    }
  }
  for (const goal of goals) {
    for (const pillarId of GOAL_PILLAR_MAP[goal] ?? []) {
      signals[pillarId] = (signals[pillarId] ?? 0) + 1;
    }
  }
  return signals;
}

export const CompanyPillarSelectionSchema = z.object({
  pillars: z.array(z.enum(PILLAR_IDS)),
  pillarSource: z.record(z.string(), z.enum(["ai", "manual"])),
  autoApplied: z.boolean(),
});

export type CompanyPillarSelectionInput = z.infer<typeof CompanyPillarSelectionSchema>;

export const DEFAULT_PILLAR_SELECTION: CompanyPillarSelectionInput = {
  pillars: [],
  pillarSource: {},
  autoApplied: false,
};

/**
 * Governance Pillar, first of the 8 per-pillar preference sub-groups
 * (Phase 2). Three sub-pages.
 *
 * Compliance & Certs: requiredCerts/tradeRequirements/certsHeld/
 * certExpiry, one jsonb blob (same reasoning as commercial_terms).
 * Both requiredCerts and certsHeld draw from the same fixed
 * certification list -- "what you expect from partners" vs "what you
 * hold yourself" are two different selections over one shared list,
 * matching the mockup exactly.
 *
 * Risk Intelligence: the mockup's own risk table is entirely computed
 * from trade corridor data (allCorridors(), built from Import/Export
 * corridor sub-groups not built yet in this schema) -- there is
 * genuinely no editable data here yet, so this is just an
 * acknowledgment boolean, not a jsonb blob standing in for data that
 * doesn't exist.
 *
 * Document Room & Audit: docChecklist is the one real editable field
 * (a plain string array). "Documents Held on File" in the mockup is
 * hardcoded illustrative sample data with no S.field backing it at
 * all -- not reproduced here, since presenting fabricated document
 * statuses as real would be actively misleading, not just incomplete.
 */
export const REQUIRED_CERTIFICATIONS = [
  "ISO 9001",
  "ISO 14001",
  "ISO 45001",
  "IEC Certification",
  "CE Marking",
  "ESG Qualification",
  "GCC/GSO Mark",
  "Product Certification",
  "ICV Certificate",
  "Country-specific Approval",
] as const;

export const TRADE_REQUIREMENTS = [
  "Import License",
  "Export License",
  "Certificate of Origin",
  "Customs Registration",
  "Authorized Distributor",
  "Local Content Requirement",
  "ESG Requirement",
  "Product Compliance",
] as const;

export const DOC_CHECKLIST = [
  "Commercial Invoice",
  "Proforma Invoice",
  "Purchase Order",
  "Packing List",
  "Certificate of Origin",
  "Bill of Lading / Airway Bill",
  "Insurance Certificate",
  "Inspection Certificate",
  "Customs Declaration",
  "Import / Export License",
  "Quality Certificate",
  "Letter of Credit Documentation",
] as const;

export const CompanyComplianceSchema = z.object({
  requiredCerts: z.array(z.enum(REQUIRED_CERTIFICATIONS)),
  tradeRequirements: z.array(z.enum(TRADE_REQUIREMENTS)),
  certsHeld: z.array(z.enum(REQUIRED_CERTIFICATIONS)),
  certExpiry: z.record(z.string(), z.string()),
});

export type CompanyComplianceInput = z.infer<typeof CompanyComplianceSchema>;

export const DEFAULT_COMPLIANCE: CompanyComplianceInput = {
  requiredCerts: [],
  tradeRequirements: [],
  certsHeld: [],
  certExpiry: {},
};

export const CompanyDocChecklistSchema = z.object({
  docChecklist: z.array(z.enum(DOC_CHECKLIST)),
});

export type CompanyDocChecklistInput = z.infer<typeof CompanyDocChecklistSchema>;

/**
 * Procurement Pillar, second of 8 per-pillar preference sub-groups.
 * Three jsonb sub-groups, same pattern as every pillar so far.
 * "Live RFQ Matches" in the mockup's own RFQ page is hardcoded
 * illustrative sample data with no backing field -- not reproduced,
 * same reasoning as Governance's "Documents Held on File".
 */
export const TIMELINE_HORIZONS = [
  "Immediate (0-3 months)",
  "Short-term (3-6 months)",
  "Medium-term (6-12 months)",
  "Long-term (12-24 months)",
  "Strategic (24+ months)",
] as const;

export const RFQ_OPPORTUNITY_TYPES = ["Product Supply", "Service Delivery", "Both"] as const;

export const CompanyRfqPrefsSchema = z.object({
  categories: z.string().trim().nullable(),
  countries: z.string().trim().nullable(),
  size: z.string().trim().nullable(),
  oppType: z.enum(RFQ_OPPORTUNITY_TYPES).nullable(),
  timeline: z.enum(TIMELINE_HORIZONS).nullable(),
});

export type CompanyRfqPrefsInput = z.infer<typeof CompanyRfqPrefsSchema>;

export const DEFAULT_RFQ_PREFS: CompanyRfqPrefsInput = {
  categories: null,
  countries: null,
  size: null,
  oppType: null,
  timeline: null,
};

export const TENDER_TYPES = [
  "Open Tender",
  "Limited Tender",
  "Selective Tender",
  "International Tender",
  "Local Tender",
  "Government Tender",
  "Private Tender",
  "EPC Tender",
  "Framework Tender",
  "Prequalification",
  "Expression of Interest",
  "Request for Proposal",
] as const;

export const CompanyTenderPrefsSchema = z.object({
  types: z.array(z.enum(TENDER_TYPES)),
  sector: z.string().trim().nullable(),
  countries: z.string().trim().nullable(),
  value: z.string().trim().nullable(),
  categories: z.string().trim().nullable(),
  timeline: z.enum(TIMELINE_HORIZONS).nullable(),
});

export type CompanyTenderPrefsInput = z.infer<typeof CompanyTenderPrefsSchema>;

export const DEFAULT_TENDER_PREFS: CompanyTenderPrefsInput = {
  types: [],
  sector: null,
  countries: null,
  value: null,
  categories: null,
  timeline: null,
};

export const CONTRACT_TYPES = [
  "Supply Contract",
  "Service Contract",
  "EPC Contract",
  "Framework Agreement",
  "Distribution Agreement",
  "Agency Agreement",
  "Purchase Agreement",
  "Long-Term Supply Agreement",
  "Maintenance Contract",
  "Consulting Contract",
] as const;

export const CONTRACT_DURATIONS = ["Under 1 Year", "1-5 Years", "5+ Years"] as const;

export const CompanyContractPrefsSchema = z.object({
  types: z.array(z.enum(CONTRACT_TYPES)),
  value: z.string().trim().nullable(),
  duration: z.enum(CONTRACT_DURATIONS).nullable(),
  industries: z.string().trim().nullable(),
  timeline: z.enum(TIMELINE_HORIZONS).nullable(),
});

export type CompanyContractPrefsInput = z.infer<typeof CompanyContractPrefsSchema>;

export const DEFAULT_CONTRACT_PREFS: CompanyContractPrefsInput = {
  types: [],
  value: null,
  duration: null,
  industries: null,
  timeline: null,
};

/**
 * B2B Pillar, third of 8 per-pillar preference sub-groups. Three
 * sub-pages: Products & Services, Target Buyers, Target Suppliers.
 *
 * Target Buyers is only shown when the company has at least one sell
 * intent, Target Suppliers only with at least one buy intent --
 * reproducing the mockup's own hideIf logic using this schema's real
 * sellIntents/buyIntents fields (already captured by Trade Intent),
 * not a separate flag.
 *
 * "Sample Matched Buyers"/"Sample Matched Suppliers" in the mockup are
 * hardcoded illustrative rows, same principle as every other fake
 * "live match" section skipped so far.
 */
export const BUDGET_BANDS = ["<$50K", "$50K-$250K", "$250K-$1M", "$1M-$5M", ">$5M"] as const;

export const B2BSellItemSchema = z.object({
  cat: z.string().trim(),
  name: z.string().trim().min(1),
  hs: z.string().trim(),
  country: z.string().trim(),
  moq: z.string().trim(),
  cert: z.string().trim(),
  budget: z.enum(BUDGET_BANDS).nullable(),
  timeline: z.enum(TIMELINE_HORIZONS).nullable(),
});

export const B2BSourceItemSchema = z.object({
  cat: z.string().trim(),
  name: z.string().trim().min(1),
  hs: z.string().trim(),
  price: z.string().trim(),
  lead: z.string().trim(),
  src: z.string().trim(),
  budget: z.enum(BUDGET_BANDS).nullable(),
  timeline: z.enum(TIMELINE_HORIZONS).nullable(),
});

export const CompanyB2BProductsSchema = z.object({
  sell: z.array(B2BSellItemSchema),
  source: z.array(B2BSourceItemSchema),
});

export type CompanyB2BProductsInput = z.infer<typeof CompanyB2BProductsSchema>;

export const DEFAULT_B2B_PRODUCTS: CompanyB2BProductsInput = { sell: [], source: [] };

export const BUYER_TYPES = [
  "Government / Public Sector",
  "Operator",
  "EPC Contractor",
  "Distributor",
  "Large Industrial Enterprise",
] as const;

export const COMPANY_SIZE_BANDS = ["Large Enterprise", "Mid-Market", "SME"] as const;

export const TYPICAL_CONTRACT_VALUES = [
  "USD 500K-5M",
  "USD 50K-500K",
  "USD 5M+",
] as const;

export const BUYER_SEGMENTS = [
  "Government Buyers",
  "Oil & Gas Operators",
  "EPC Contractors",
  "Renewable Energy Developers",
  "Industrial Distributors",
] as const;

export const CompanyBuyerTargetSchema = z.object({
  country: z.string().trim().nullable(),
  type: z.enum(BUYER_TYPES).nullable(),
  industry: z.string().trim().nullable(),
  size: z.enum(COMPANY_SIZE_BANDS).nullable(),
  contractValue: z.enum(TYPICAL_CONTRACT_VALUES).nullable(),
  budget: z.enum(BUDGET_BANDS).nullable(),
  timeline: z.enum(TIMELINE_HORIZONS).nullable(),
});

export type CompanyBuyerTargetInput = z.infer<typeof CompanyBuyerTargetSchema>;

export const DEFAULT_BUYER_TARGET: CompanyBuyerTargetInput = {
  country: null,
  type: null,
  industry: null,
  size: null,
  contractValue: null,
  budget: null,
  timeline: null,
};

export const CompanyBuyerSegmentsSchema = z.object({
  buyerSegments: z.array(z.enum(BUYER_SEGMENTS)),
});

export type CompanyBuyerSegmentsInput = z.infer<typeof CompanyBuyerSegmentsSchema>;

export const SUPPLIER_TYPES = [
  "Manufacturer",
  "Distributor",
  "Trading House",
  "Service Provider",
] as const;

export const ESG_RATING_REQUIREMENTS = ["Not required", "Preferred", "Mandatory"] as const;

export const SUPPLIER_FILTERS = [
  "Manufacturer only",
  "ISO 9001 certified",
  "ISO 14001 certified",
  "Local content compliant",
  "ESG qualified",
  "Minimum 5 years in business",
  "Export capable",
  "Financially verified",
] as const;

export const CompanySupplierTargetSchema = z.object({
  type: z.enum(SUPPLIER_TYPES).nullable(),
  countries: z.string().trim().nullable(),
  certs: z.string().trim().nullable(),
  esg: z.enum(ESG_RATING_REQUIREMENTS).nullable(),
  capability: z.string().trim().nullable(),
  budget: z.enum(BUDGET_BANDS).nullable(),
  timeline: z.enum(TIMELINE_HORIZONS).nullable(),
});

export type CompanySupplierTargetInput = z.infer<typeof CompanySupplierTargetSchema>;

export const DEFAULT_SUPPLIER_TARGET: CompanySupplierTargetInput = {
  type: null,
  countries: null,
  certs: null,
  esg: null,
  capability: null,
  budget: null,
  timeline: null,
};

export const CompanySupplierFiltersSchema = z.object({
  supplierFilters: z.array(z.enum(SUPPLIER_FILTERS)),
});

export type CompanySupplierFiltersInput = z.infer<typeof CompanySupplierFiltersSchema>;

/**
 * Lightweight sector -> suggested certification map, ported verbatim
 * from the mockup. Used only as a one-click starting point on the
 * Compliance page -- the user can add/remove freely afterward. Sectors
 * not listed simply show no suggestion row, so nothing forces a choice
 * that doesn't apply.
 */
export const SECTOR_CERT_SUGGEST: Record<string, (typeof REQUIRED_CERTIFICATIONS)[number][]> = {
  Energy: ["ISO 14001", "ESG Qualification"],
  "Oil & Gas": ["ISO 14001", "ISO 45001", "Product Certification"],
  Manufacturing: ["ISO 9001", "CE Marking"],
  Construction: ["ISO 45001", "Country-specific Approval"],
  ICT: ["ISO 9001", "IEC Certification"],
  Healthcare: ["ISO 9001", "Product Certification"],
  "Food & Agriculture": ["ISO 9001", "Product Certification", "Country-specific Approval"],
  Mining: ["ISO 14001", "ISO 45001"],
  "Financial Services": ["ISO 9001", "ESG Qualification"],
};
