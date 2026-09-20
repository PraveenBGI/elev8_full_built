/**
 * app/admin/config-engine/statecluster/page.tsx
 *
 * Renders inside the shared shell. Same auth/scope gating pattern as
 * identity/page.tsx and masterdata/page.tsx.
 */

import { requireAuth } from "@/lib/auth/adapter";
import { getMyAdminScope, listCountryStates } from "@/lib/modules/config-engine/adapter";
import { StateClusterForm } from "./StateClusterForm";

export default async function StateClusterPage() {
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
        State Cluster is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const states = await listCountryStates(scope.countryId);

  return <StateClusterForm states={states} />;
}
