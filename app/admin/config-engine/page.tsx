/**
 * app/admin/config-engine/page.tsx
 *
 * The index route -- previously nothing lived here, so logging in
 * dropped everyone straight into Country Identity with no "who am I,
 * what can I do here" landing page. Role-aware: a Country Admin sees
 * their country's full pillar completion picture and state rollup; a
 * State Admin sees their one delegated state's own picture instead.
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryById,
  getCountryPillarReadiness,
  getStateById,
  getStatePillarReadiness,
  getMyAdminScope,
  listCountryStates,
  listStatePillarApprovalStatuses,
} from "@/lib/modules/config-engine/adapter";
import { STAGES } from "@/lib/modules/config-engine/stages";
import { CountryAdminDashboard } from "./CountryAdminDashboard";
import { StateAdminDashboard } from "./StateAdminDashboard";

export default async function ConfigEngineDashboardPage() {
  await requireAuth();
  const scope = await getMyAdminScope();

  if (!scope) {
    return (
      <p className="text-sm" style={{ color: "var(--elev8-g500)" }}>
        You don&apos;t have a configuration admin role. This area is for
        Country and State Admins only.
      </p>
    );
  }

  const pillarStages = STAGES.filter((s) => s.isPillar);

  if (scope.role === "country_admin") {
    const [country, readiness, states] = await Promise.all([
      getCountryById(scope.countryId),
      getCountryPillarReadiness(scope.countryId),
      listCountryStates(scope.countryId),
    ]);

    return (
      <CountryAdminDashboard
        country={country}
        pillarStages={pillarStages}
        readiness={readiness}
        states={states}
      />
    );
  }

  const [state, readiness, approvals] = await Promise.all([
    getStateById(scope.stateId),
    getStatePillarReadiness(scope.stateId),
    listStatePillarApprovalStatuses(scope.stateId),
  ]);

  return (
    <StateAdminDashboard
      state={state}
      pillarStages={pillarStages}
      readiness={readiness}
      approvals={approvals}
    />
  );
}
