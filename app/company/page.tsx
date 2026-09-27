/**
 * app/company/page.tsx
 *
 * Two states: no company yet (show the create-company entry point) or a
 * real company exists (show Identity/Role/Trade Intent). Unlike
 * config-engine's pages, there's no admin-role gate here -- any signed-in
 * user can create and edit their own company, that's the point of
 * self-service company configuration (see the migration's own comment
 * on why this differs from config_admin_roles' high-trust model).
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCompanyById,
  getMyCompanyScope,
  getRealStateNamesForCountry,
  listCountriesForDropdown,
} from "@/lib/modules/company-config/adapter";
import { CreateCompanyForm } from "./CreateCompanyForm";
import { CompanyConfigForm } from "./CompanyConfigForm";

export default async function CompanyPage() {
  await requireAuth();
  const scope = await getMyCompanyScope();
  const countries = await listCountriesForDropdown();

  if (!scope) {
    return <CreateCompanyForm countries={countries} />;
  }

  const company = await getCompanyById(scope.companyId);

  if (!company) {
    return (
      <p className="text-sm" style={{ color: "var(--elev8-red)" }}>
        Your account is linked to a company that no longer exists (id{" "}
        {scope.companyId}). This needs fixing at the data level.
      </p>
    );
  }

  const homeCountryStates = company.home_country_id
    ? await getRealStateNamesForCountry(company.home_country_id)
    : [];

  return (
    <CompanyConfigForm
      company={company}
      countries={countries}
      homeCountryStates={homeCountryStates}
    />
  );
}
