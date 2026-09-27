/**
 * app/admin/config-engine/investment/page.tsx
 *
 * Special Economic Zones reads live from Master Data's country_zones,
 * same string-membership pattern as every other Master Data picker.
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryPillarPayload,
  getCountryPillarLockedFields,
  getMyAdminScope,
  listCountryPillarConditions,
  listCountryZones,
} from "@/lib/modules/config-engine/adapter";
import {
  DEFAULT_INVESTMENT_PAYLOAD,
  type InvestmentPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import { InvestmentForm } from "./InvestmentForm";

export default async function InvestmentPage() {
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
        Investment is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const [payload, lockedFields, conditions, zones] = await Promise.all([
    getCountryPillarPayload<InvestmentPayloadInput>(scope.countryId, "investment"),
    getCountryPillarLockedFields(scope.countryId, "investment"),
    listCountryPillarConditions(scope.countryId, "investment"),
    listCountryZones(scope.countryId),
  ]);

  return (
    <InvestmentForm
      initial={payload ?? DEFAULT_INVESTMENT_PAYLOAD}
      lockedFields={lockedFields}
      conditions={conditions}
      zones={zones}
    />
  );
}
