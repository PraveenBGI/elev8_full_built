/**
 * app/admin/config-engine/masterdata/page.tsx
 *
 * Renders inside the shared shell (see ../layout.tsx). Same auth/scope
 * gating pattern as identity/page.tsx.
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryRegistrationTypes,
  getCountryTaxSettings,
  getCountryUnitsOfMeasurement,
  getMyAdminScope,
  listCountryFtas,
  listCountryHsCodes,
} from "@/lib/modules/config-engine/adapter";
import { MasterDataForm } from "./MasterDataForm";

export default async function MasterDataPage() {
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
        Country Master Data is managed by your country&apos;s Country
        Admin. State-level configuration screens are not built yet.
      </p>
    );
  }

  const [hsCodes, taxSettings, ftas, registrationTypes, unitsOfMeasurement] =
    await Promise.all([
      listCountryHsCodes(scope.countryId),
      getCountryTaxSettings(scope.countryId),
      listCountryFtas(scope.countryId),
      getCountryRegistrationTypes(scope.countryId),
      getCountryUnitsOfMeasurement(scope.countryId),
    ]);

  return (
    <MasterDataForm
      hsCodes={hsCodes}
      taxSettings={taxSettings}
      ftas={ftas}
      registrationTypes={registrationTypes}
      unitsOfMeasurement={unitsOfMeasurement}
    />
  );
}
