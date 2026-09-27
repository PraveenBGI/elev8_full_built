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
