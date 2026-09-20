/**
 * app/admin/config-engine/procurement/page.tsx
 */

import { requireAuth } from "@/lib/auth/adapter";
import { getCountryPillarPayload, getMyAdminScope } from "@/lib/modules/config-engine/adapter";
import {
  DEFAULT_PROCUREMENT_PAYLOAD,
  type ProcurementPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import { ProcurementForm } from "./ProcurementForm";

export default async function ProcurementPage() {
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
        Procurement is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const payload = await getCountryPillarPayload<ProcurementPayloadInput>(
    scope.countryId,
    "procurement",
  );

  return <ProcurementForm initial={payload ?? DEFAULT_PROCUREMENT_PAYLOAD} />;
}
