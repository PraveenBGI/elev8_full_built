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
