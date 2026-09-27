/**
 * app/admin/config-engine/import/page.tsx
 *
 * Two sections here read live from Master Data (already built, not
 * duplicated): Customs Entry Points from country_ports_airports,
 * HS Code Coverage from country_hs_codes and country_hs_code_packs.
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryPillarPayload,
  getCountryPillarLockedFields,
  getMyAdminScope,
  listCountryPillarConditions,
  listCountryPortsAirports,
  listCountryHsCodes,
  listCountryHsCodePacks,
} from "@/lib/modules/config-engine/adapter";
import { DEFAULT_IMPORT_PAYLOAD, type ImportPayloadInput } from "@/lib/modules/config-engine/schemas";
import { ImportForm } from "./ImportForm";

export default async function ImportPage() {
  await requireAuth();
  const scope = await getMyAdminScope();

  if (!scope) {
    return (
      <p className="text-sm" style={{ color: "var(--elev8-g500)" }}>
        You don&apos;t have a configuration admin role. This page is for
        Country Admins only.
      </p>
    );
  }

  if (scope.role !== "country_admin") {
    return (
      <p className="text-sm" style={{ color: "var(--elev8-g500)" }}>
        Import is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const [payload, lockedFields, conditions, portsAirports, hsCodes, hsCodePacks] =
    await Promise.all([
      getCountryPillarPayload<ImportPayloadInput>(scope.countryId, "import"),
      getCountryPillarLockedFields(scope.countryId, "import"),
      listCountryPillarConditions(scope.countryId, "import"),
      listCountryPortsAirports(scope.countryId),
      listCountryHsCodes(scope.countryId),
      listCountryHsCodePacks(scope.countryId),
    ]);

  return (
    <ImportForm
      initial={payload ?? DEFAULT_IMPORT_PAYLOAD}
      lockedFields={lockedFields}
      conditions={conditions}
      portsAirports={portsAirports}
      hsCodes={hsCodes}
      hsCodePacks={hsCodePacks}
    />
  );
}
