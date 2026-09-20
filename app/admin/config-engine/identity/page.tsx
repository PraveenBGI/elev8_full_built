/**
 * app/admin/config-engine/identity/page.tsx
 *
 * Renders inside app/admin/config-engine/layout.tsx's shell (Topbar +
 * Stepper), so this file only owns the content area -- no page-level
 * max-width/padding wrapper here, the layout already provides it.
 */

import { requireAuth } from "@/lib/auth/adapter";
import {
  getCountryById,
  getMyAdminScope,
} from "@/lib/modules/config-engine/adapter";
import { CountryIdentityForm } from "./CountryIdentityForm";

export default async function CountryIdentityPage() {
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
        Country Identity is managed by your country&apos;s Country Admin.
        You&apos;re a State Admin — state-level configuration screens are
        not built yet.
      </p>
    );
  }

  const country = await getCountryById(scope.countryId);

  if (!country) {
    return (
      <p className="text-sm" style={{ color: "var(--elev8-red)" }}>
        Your admin role points at a country that no longer exists (id{" "}
        {scope.countryId}). This needs fixing at the data level, not the
        UI level.
      </p>
    );
  }

  return <CountryIdentityForm country={country} />;
}
