/**
 * app/admin/config-engine/layout.tsx
 *
 * Wraps every /admin/config-engine/* page in the Topbar + Stepper shell,
 * matching elev8-country-admin-config_3.html's visual structure. Fetches
 * real data once here (country name, pillar readiness) rather than each
 * page re-fetching it -- Server Component, so this runs on every
 * navigation without a client-side waterfall.
 *
 * Not authenticated / not a country admin: renders children directly,
 * without the shell, and each page underneath is responsible for its own
 * "not authorized" message (see identity/page.tsx) -- the shell itself
 * assumes there's a country to show, so it can't meaningfully render for
 * someone with no country.
 */

import { getUser } from "@/lib/auth/adapter";
import {
  countryHasAnyHsCodes,
  getCountryById,
  getCountryPillarReadiness,
  getMyAdminScope,
} from "@/lib/modules/config-engine/adapter";
import { STAGES, readinessToStageStatus, type StageStatus } from "@/lib/modules/config-engine/stages";
import { Topbar } from "./Topbar";
import { Stepper } from "./Stepper";

export default async function ConfigEngineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const scope = await getMyAdminScope();

  if (!user || !scope) {
    return <>{children}</>;
  }

  const country = await getCountryById(scope.countryId);
  if (!country) {
    return <>{children}</>;
  }

  const readiness =
    scope.role === "country_admin"
      ? await getCountryPillarReadiness(scope.countryId)
      : {};

  const hasMasterData =
    scope.role === "country_admin" ? await countryHasAnyHsCodes(scope.countryId) : false;

  const statusByStageId: Record<string, StageStatus> = {};
  for (const stage of STAGES) {
    if (stage.isPillar) {
      statusByStageId[stage.id] = readinessToStageStatus(readiness[stage.id]);
    } else if (stage.id === "identity") {
      // No dedicated readiness column for Identity yet (see
      // docs/modules/config-engine/README.md) -- a simple heuristic
      // stands in for now: the two required fields are present.
      statusByStageId[stage.id] =
        country.name && country.master_currency ? "done" : "pending";
    } else if (stage.id === "masterdata") {
      // Same kind of heuristic as Identity -- no dedicated readiness
      // column for this stage yet, only 2 of its 8 sections are built.
      statusByStageId[stage.id] = hasMasterData ? "in_progress" : "pending";
    } else {
      statusByStageId[stage.id] = "pending";
    }
  }

  const totalMandatory = STAGES.filter((s) => s.mandatory).length;
  const doneMandatory = STAGES.filter(
    (s) => s.mandatory && statusByStageId[s.id] === "done",
  ).length;
  const progressPercent = Math.round((doneMandatory / totalMandatory) * 100);

  const userInitial = (user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar
        countryName={country.name}
        progressPercent={progressPercent}
        userInitial={userInitial}
      />
      <div className="flex min-h-0 flex-1">
        <Stepper stages={STAGES} statusByStageId={statusByStageId} />
        <main className="min-w-0 flex-1 overflow-y-auto bg-[var(--elev8-g50)] px-9 py-7">
          <div className="mx-auto max-w-[980px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
