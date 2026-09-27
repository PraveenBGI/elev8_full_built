/**
 * app/admin/config-engine/export/page.tsx
 *
 * Trade Corridors' port picker and Priority HS Codes read live from
 * Master Data, same integration pattern as Import. FTA Coverage is
 * computed in the form component from listCountryFtas() -- informational
 * only, never stored, never changes a duty band automatically.
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
  listCountryFtas,
} from "@/lib/modules/config-engine/adapter";
import { DEFAULT_EXPORT_PAYLOAD, type ExportPayloadInput } from "@/lib/modules/config-engine/schemas";
import { ExportForm } from "./ExportForm";

export default async function ExportPage() {
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
        Export is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const [payload, lockedFields, conditions, portsAirports, hsCodes, hsCodePacks, ftas] =
    await Promise.all([
      getCountryPillarPayload<ExportPayloadInput>(scope.countryId, "export"),
      getCountryPillarLockedFields(scope.countryId, "export"),
      listCountryPillarConditions(scope.countryId, "export"),
      listCountryPortsAirports(scope.countryId),
      listCountryHsCodes(scope.countryId),
      listCountryHsCodePacks(scope.countryId),
      listCountryFtas(scope.countryId),
    ]);

  return (
    <ExportForm
      initial={payload ?? DEFAULT_EXPORT_PAYLOAD}
      lockedFields={lockedFields}
      conditions={conditions}
      portsAirports={portsAirports}
      hsCodes={hsCodes}
      hsCodePacks={hsCodePacks}
      ftas={ftas}
    />
  );
}
