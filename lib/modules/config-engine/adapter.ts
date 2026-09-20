/**
 * lib/modules/config-engine/adapter.ts
 *
 * Typed data-access functions for the config-engine module. Every function
 * here goes through lib/db/client.ts's getDb() -- never a raw Supabase
 * call from a component or Server Action. Per
 * 01-ARCHITECTURE-AND-PORTABILITY.md sec 3, this is what makes the AWS
 * move a config change instead of a rewrite: this file doesn't care that
 * getDb() happens to wrap Supabase today.
 */

import { getDb } from "@/lib/db/client";
import {
  CountryIdentitySchema,
  toCountryRow,
  HsCodeSchema,
  TaxSettingsSchema,
  type HsCodeInput,
  type TaxSettingsInput,
  type CountryIdentityInput,
} from "./schemas";

export type CountryAdminScope = {
  role: "country_admin";
  countryId: string;
};

export type StateAdminScope = {
  role: "state_admin";
  countryId: string;
  stateId: string;
};

export type AdminScope = CountryAdminScope | StateAdminScope | null;

/**
 * Resolves the signed-in user's config-admin role, if any. Returns null
 * for an ordinary company user -- this is a deliberate read of
 * config_admin_roles (RLS there only returns the caller's own rows or,
 * for a country_admin, their states' rollup rows -- see the migration),
 * never a client-side role guess.
 */
export async function getMyAdminScope(): Promise<AdminScope> {
  const db = await getDb();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;

  const { data, error } = await db
    .from("config_admin_roles")
    .select("role, country_id, state_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (data.role === "country_admin") {
    return { role: "country_admin", countryId: data.country_id };
  }
  return {
    role: "state_admin",
    countryId: data.country_id,
    stateId: data.state_id as string,
  };
}

export type CountryIdentityRow = {
  id: string;
  name: string;
  country_code: string | null;
  wb_code: string | null;
  official_language: string | null;
  master_currency: string;
  ancillary_currency: string | null;
  time_zone: string | null;
  dial_code: string | null;
  geozone: string | null;
  income_group: string | null;
  system_of_trade: string | null;
  wto_member: boolean;
  financial_year_model: string | null;
  current_financial_year: string | null;
  working_week: string | null;
  approval_status: string;
};

const IDENTITY_COLUMNS =
  "id, name, country_code, wb_code, official_language, master_currency, ancillary_currency, time_zone, dial_code, geozone, income_group, system_of_trade, wto_member, financial_year_model, current_financial_year, working_week, approval_status";

export async function getCountryById(
  countryId: string,
): Promise<CountryIdentityRow | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("countries")
    .select(IDENTITY_COLUMNS)
    .eq("id", countryId)
    .maybeSingle();

  if (error) throw error;
  return data as CountryIdentityRow | null;
}

/**
 * Validates with CountryIdentitySchema BEFORE writing -- the database's
 * columns are mostly permissive text/jsonb (see the migration), so this
 * function, not a CHECK constraint, is what actually enforces shape.
 * RLS still enforces WHO may write (countries_write_country_admin_only in
 * the migration) -- this function does not duplicate that check, it
 * relies on it, exactly as intended for defense in depth without
 * duplicated logic.
 */
export async function updateCountryIdentity(
  countryId: string,
  input: CountryIdentityInput,
): Promise<void> {
  const parsed = CountryIdentitySchema.parse(input);
  const row = toCountryRow(parsed);

  const db = await getDb();
  const { error } = await db.from("countries").update(row).eq("id", countryId);

  if (error) throw error;
}

/**
 * Country-level readiness per pillar, keyed by pillar id (e.g.
 * "procurement" -> "not_started"). Used by the stepper (see
 * app/admin/config-engine/layout.tsx) to show real progress instead of a
 * fabricated number. Deliberately country-scoped only (state_id is null)
 * -- this is the Country Admin's own view of their country's pillars, not
 * a rollup of every delegated state.
 */
export async function getCountryPillarReadiness(
  countryId: string,
): Promise<Record<string, string>> {
  const db = await getDb();
  const { data, error } = await db
    .from("pillar_configs")
    .select("pillar, readiness_level")
    .eq("country_id", countryId)
    .is("state_id", null);

  if (error) throw error;

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    result[row.pillar as string] = row.readiness_level as string;
  }
  return result;
}

/**
 * Country Master Data -- HS Code Coverage.
 */
export type HsCodeRow = {
  id: string;
  code: string;
  description: string;
  category: string;
};

export async function listCountryHsCodes(countryId: string): Promise<HsCodeRow[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("country_hs_codes")
    .select("id, code, description, category")
    .eq("country_id", countryId)
    .order("code");

  if (error) throw error;
  return (data ?? []) as HsCodeRow[];
}

export async function addCountryHsCode(
  countryId: string,
  input: HsCodeInput,
): Promise<void> {
  const parsed = HsCodeSchema.parse(input);
  const db = await getDb();
  const { error } = await db.from("country_hs_codes").insert({
    country_id: countryId,
    code: parsed.code,
    description: parsed.description,
    category: parsed.category,
  });
  if (error) throw error;
}

export async function deleteCountryHsCode(hsCodeId: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("country_hs_codes").delete().eq("id", hsCodeId);
  if (error) throw error;
}

/**
 * Lightweight existence check for the stepper (see
 * app/admin/config-engine/layout.tsx) -- avoids pulling every HS code row
 * just to know whether the Master Data stage has any content yet.
 */
export async function countryHasAnyHsCodes(countryId: string): Promise<boolean> {
  const db = await getDb();
  const { count, error } = await db
    .from("country_hs_codes")
    .select("id", { count: "exact", head: true })
    .eq("country_id", countryId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Country Master Data -- Tax & VAT/GST System. Reads/writes
 * countries.master_data.tax (see TaxSettingsSchema's own comment for why
 * this is jsonb, not a table).
 */
export async function getCountryTaxSettings(
  countryId: string,
): Promise<TaxSettingsInput> {
  const db = await getDb();
  const { data, error } = await db
    .from("countries")
    .select("master_data")
    .eq("id", countryId)
    .maybeSingle();

  if (error) throw error;

  const tax = (data?.master_data as { tax?: unknown } | null)?.tax ?? {};
  const parsed = TaxSettingsSchema.safeParse(tax);
  if (parsed.success) return parsed.data;

  // No tax settings saved yet -- return an empty-but-valid shape rather
  // than throwing, since "not configured yet" is the normal first state.
  return {
    corporateTaxRate: null,
    vatGstName: null,
    vatGstRate: null,
    withholdingTaxRate: null,
    customsDutyGeneral: null,
    taxAuthority: null,
  };
}

export async function updateCountryTaxSettings(
  countryId: string,
  input: TaxSettingsInput,
): Promise<void> {
  const parsed = TaxSettingsSchema.parse(input);
  const db = await getDb();

  // Merge into the existing master_data blob rather than overwrite it --
  // other Master Data sections (zones, ports, etc.) will eventually live
  // in sibling keys of the same jsonb column, and a plain .update() would
  // silently wipe them.
  const { data: current, error: readError } = await db
    .from("countries")
    .select("master_data")
    .eq("id", countryId)
    .maybeSingle();
  if (readError) throw readError;

  const merged = {
    ...((current?.master_data as Record<string, unknown>) ?? {}),
    tax: parsed,
  };

  const { error } = await db
    .from("countries")
    .update({ master_data: merged })
    .eq("id", countryId);
  if (error) throw error;
}
