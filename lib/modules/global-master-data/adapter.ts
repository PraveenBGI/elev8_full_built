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
