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
