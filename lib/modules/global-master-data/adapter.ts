/**
 * lib/modules/global-master-data/adapter.ts
 *
 * Typed data-access for genuinely GLOBAL reference data -- tables with
 * no country_id, owned by the Portal Admin / Super Admin tier in the
 * legacy architecture (confirmed via the LyPIS/elev8 architecture
 * diagrams' own "3. MASTER MAINTENANCE" panel), distinct from
 * config-engine's per-country Master Data (country_hs_codes,
 * country_ports_airports, etc).
 *
 * Starts with just the Sector Master -- the first concrete slice of
 * Phase 1 (Master Data) in 02-MODULE-ROADMAP.md, and a real, repeatedly
 * -flagged gap: Business Identity's Sector field, and Export/
 * Investment/ICV's sector-focus fields, have all used a hardcoded
 * enum until now, despite the FRD itself saying Sector "will be pulled
 * from the database -- Active Sectors."
 */

import { getDb } from "@/lib/db/client";

export type SectorRow = {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
};

/**
 * Active sectors only, in the order the Portal Admin tier would define
 * for display (sort_order), not alphabetical -- matches how every other
 * master-data picker in this project orders its options (country_ftas,
 * country_hs_code_packs), rather than introducing a different
 * convention here.
 */
export async function listActiveSectors(): Promise<SectorRow[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("sectors")
    .select("id, name, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type StyleOfIncorporationRow = { id: string; name: string; is_active: boolean; sort_order: number };

/**
 * Active styles of incorporation only, same ordering convention as
 * listActiveSectors() -- sort_order, not alphabetical.
 */
export async function listActiveStylesOfIncorporation(): Promise<StyleOfIncorporationRow[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("styles_of_incorporation")
    .select("id, name, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type HsCodeChapterRow = {
  id: string;
  chapter: string;
  description: string;
  section: string;
  sort_order: number;
};

/**
 * Chapter-level (2-digit) HS code reference only -- see
 * 20260930000003_global_hs_code_chapters.sql for why 6-digit
 * subheadings aren't seeded. Does not touch country_hs_codes (the
 * existing per-country table) -- reconciling the two is real, separate
 * follow-on work, not done by this function.
 */
export async function listHsCodeChapters(): Promise<HsCodeChapterRow[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("hs_code_chapters")
    .select("id, chapter, description, section, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export type WorldRegionRow = { id: string; name: string; sort_order: number };
export type WorldSubRegionRow = { id: string; region_id: string; name: string; sort_order: number };
export type WorldCountryRow = {
  id: string;
  name: string;
  iso2: string | null;
  iso3: string | null;
  region_id: string;
  sub_region_id: string | null;
  sort_order: number;
};

/**
 * World Region Reference -- resolves the "no world-country list" gap
 * flagged repeatedly across Export/Investment/ICV's free-text market
 * and sourcing-country fields. Deliberately distinct from
 * listCountriesForDropdown() in company-config/adapter.ts, which lists
 * platform-ONBOARDED countries (Oman, India, Tanzania) for things like
 * Geography's home-country picker -- this lists every country a
 * company might reference for trade purposes, onboarded or not.
 *
 * Two flat queries, not a nested Supabase relationship select
 * (.select("world_countries(name)")) -- no precedent for that syntax
 * anywhere in this codebase, same reasoning as getStateById() in
 * config-engine/adapter.ts.
 */
export async function listWorldRegionsWithCountries(): Promise<{
  regions: WorldRegionRow[];
  subRegions: WorldSubRegionRow[];
  countries: WorldCountryRow[];
}> {
  const db = await getDb();

  const [regionsRes, subRegionsRes, countriesRes] = await Promise.all([
    db.from("world_regions").select("id, name, sort_order").order("sort_order"),
    db
      .from("world_sub_regions")
      .select("id, region_id, name, sort_order")
      .order("sort_order"),
    db
      .from("world_countries")
      .select("id, name, iso2, iso3, region_id, sub_region_id, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (regionsRes.error) throw regionsRes.error;
  if (subRegionsRes.error) throw subRegionsRes.error;
  if (countriesRes.error) throw countriesRes.error;

  return {
    regions: regionsRes.data ?? [],
    subRegions: subRegionsRes.data ?? [],
    countries: countriesRes.data ?? [],
  };
}
