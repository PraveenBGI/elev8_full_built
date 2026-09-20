/**
 * app/admin/config-engine/governance/page.tsx
 *
 * Renders inside the shared shell. Same auth/scope gating pattern as
 * every other module page.
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryPillarPayload,
  getMyAdminScope,
  listCountryAuthorities,
  listCountryStakeholders,
} from "@/lib/modules/config-engine/adapter";
import type { GovernancePayloadInput } from "@/lib/modules/config-engine/schemas";
import { GovernanceForm } from "./GovernanceForm";

const DEFAULT_GOVERNANCE_PAYLOAD: GovernancePayloadInput = {
  escalation: [],
  dataGovernance: null,
  auditFrequency: null,
  accessPolicy: null,
  infoClassification: null,
};

export default async function GovernancePage() {
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
        Governance is managed by your country&apos;s Country Admin.
      </p>
    );
  }

  const [authorities, stakeholders, governancePayload] = await Promise.all([
    listCountryAuthorities(scope.countryId),
    listCountryStakeholders(scope.countryId),
    getCountryPillarPayload<GovernancePayloadInput>(scope.countryId, "governance"),
  ]);

  return (
    <GovernanceForm
      authorities={authorities}
      stakeholders={stakeholders}
      governancePayload={governancePayload ?? DEFAULT_GOVERNANCE_PAYLOAD}
    />
  );
}
