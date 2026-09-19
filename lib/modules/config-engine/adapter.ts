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
