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
  type CompanyIdentityInput,
  type CompanyRoleInput,
  type CompanyTradeIntentInput,
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
  pref_level: "company" | "individual";
  primary_role: string | null;
  secondary_roles: string[];
  sell_intents: string[];
  buy_intents: string[];
  strategic_intent: string | null;
  existing_partners: string | null;
  competitors: string | null;
};

const COMPANY_COLUMNS =
  "id, country_id, name, type, sector, size, year_established, annual_revenue, trade_years, countries_exported_to, differentiator, pref_level, primary_role, secondary_roles, sell_intents, buy_intents, strategic_intent, existing_partners, competitors";

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
