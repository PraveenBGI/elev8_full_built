/**
 * app/admin/config-engine/sustainability/page.tsx
 *
 * Sustainable/Green Procurement displays Procurement's own current ESG
 * evaluation weight inline -- a real cross-pillar read (that pillar's
 * own payload, fetched here), not duplicated or stored in this schema.
 * The mockup's own framing: sustainability becomes measurable inside
 * every tender, not just a national statement.
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryPillarPayload,
  getCountryPillarLockedFields,
  getMyAdminScope,
  listCountryPillarConditions,
} from "@/lib/modules/config-engine/adapter";
import {
  DEFAULT_SUSTAINABILITY_PAYLOAD,
  type ProcurementPayloadInput,
  type SustainabilityPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import { SustainabilityForm } from "./SustainabilityForm";

export default async function SustainabilityPage() {
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
        Sustainability is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const [payload, lockedFields, conditions, procurementPayload] = await Promise.all([
    getCountryPillarPayload<SustainabilityPayloadInput>(scope.countryId, "sustainability"),
    getCountryPillarLockedFields(scope.countryId, "sustainability"),
    listCountryPillarConditions(scope.countryId, "sustainability"),
    getCountryPillarPayload<ProcurementPayloadInput>(scope.countryId, "procurement"),
  ]);

  return (
    <SustainabilityForm
      initial={payload ?? DEFAULT_SUSTAINABILITY_PAYLOAD}
      lockedFields={lockedFields}
      conditions={conditions}
      procurementEsgWeight={procurementPayload?.evalWeights?.esg ?? null}
    />
  );
}
