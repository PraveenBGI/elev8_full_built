"use client";

/**
 * components/ui/CountryPicker.tsx
 *
 * Replaces the free-text "type a country name, press Enter or Add"
 * pattern confirmed identical across Import, Export, and Investment
 * Preferences (grepped for the exact shape first, not assumed): three
 * copies of the same countryDraft/addCountry logic, each accepting any
 * typed string with no validation against a real country at all.
 *
 * Grouped by region (with sub-region shown in parentheses when a
 * country has one -- South Asia/Central Asia countries don't, by
 * design, see 20260930000001_world_region_reference.sql) rather than a
 * flat alphabetical list, since a company thinking about "where do I
 * want to export" naturally thinks in terms of regions first, not one
 * unbroken list of 42 names.
 *
 * Deliberately does NOT replace Company Geography's home-country/
 * corridor-country pickers -- those read from listCountriesForDropdown()
 * (platform-ONBOARDED countries), a genuinely different, smaller list
 * with a different meaning (where elev8 itself is deployed), not this
 * component's job.
 */

import { useState } from "react";
import { Tag } from "./Tag";
import type {
  WorldRegionRow,
  WorldSubRegionRow,
  WorldCountryRow,
} from "@/lib/modules/global-master-data/adapter";

export function CountryPicker({
  regions,
  subRegions,
  countries,
  selected,
  onAdd,
  onRemove,
}: {
  regions: WorldRegionRow[];
  subRegions: WorldSubRegionRow[];
  countries: WorldCountryRow[];
  selected: string[];
  onAdd: (countryName: string) => void;
  onRemove: (countryName: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const subRegionById = new Map(subRegions.map((sr) => [sr.id, sr]));
  const countriesByRegion = new Map<string, WorldCountryRow[]>();
  for (const c of countries) {
    if (selected.includes(c.name)) continue;
    const list = countriesByRegion.get(c.region_id) ?? [];
    list.push(c);
    countriesByRegion.set(c.region_id, list);
  }

  function handleAdd() {
    if (!draft) return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((c) => (
            <Tag key={c} label={c} onRemove={() => onRemove(c)} />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <select
          className="w-full rounded-md border px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        >
          <option value="">Choose a country...</option>
          {regions.map((region) => {
            const regionCountries = countriesByRegion.get(region.id);
            if (!regionCountries || regionCountries.length === 0) return null;
            return (
              <optgroup key={region.id} label={region.name}>
                {regionCountries.map((c) => {
                  const subRegion = c.sub_region_id ? subRegionById.get(c.sub_region_id) : undefined;
                  return (
                    <option key={c.id} value={c.name}>
                      {c.name}
                      {subRegion ? ` (${subRegion.name})` : ""}
                    </option>
                  );
                })}
              </optgroup>
            );
          })}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft}
          className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--brand-blue)" }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
