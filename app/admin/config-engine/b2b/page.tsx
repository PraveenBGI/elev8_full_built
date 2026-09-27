/**
 * app/admin/config-engine/b2b/page.tsx
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryPillarLockedFields,
  getCountryPillarPayload,
  getMyAdminScope,
  listCountryPillarConditions,
} from "@/lib/modules/config-engine/adapter";
import { DEFAULT_B2B_PAYLOAD, type B2bPayloadInput } from "@/lib/modules/config-engine/schemas";
import { B2bForm } from "./B2bForm";

export default async function B2bPage() {
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
        B2B is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const [payload, lockedFields, conditions] = await Promise.all([
    getCountryPillarPayload<B2bPayloadInput>(scope.countryId, "b2b"),
    getCountryPillarLockedFields(scope.countryId, "b2b"),
    listCountryPillarConditions(scope.countryId, "b2b"),
  ]);

  return (
    <B2bForm
      initial={payload ?? DEFAULT_B2B_PAYLOAD}
      lockedFields={lockedFields}
      conditions={conditions}
    />
  );
}
