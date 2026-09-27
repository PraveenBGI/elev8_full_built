/**
 * app/admin/config-engine/icv/page.tsx
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryPillarPayload,
  getCountryPillarLockedFields,
  getMyAdminScope,
  listCountryPillarConditions,
} from "@/lib/modules/config-engine/adapter";
import { DEFAULT_ICV_PAYLOAD, type IcvPayloadInput } from "@/lib/modules/config-engine/schemas";
import { IcvForm } from "./IcvForm";

export default async function IcvPage() {
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
        ICV / Local Content is managed by your country&apos;s Country
        Admin.
      </p>
    );
  }

  const [payload, lockedFields, conditions] = await Promise.all([
    getCountryPillarPayload<IcvPayloadInput>(scope.countryId, "icv"),
    getCountryPillarLockedFields(scope.countryId, "icv"),
    listCountryPillarConditions(scope.countryId, "icv"),
  ]);

  return (
    <IcvForm
      initial={payload ?? DEFAULT_ICV_PAYLOAD}
      lockedFields={lockedFields}
      conditions={conditions}
    />
  );
}
