/**
 * app/admin/config-engine/country/page.tsx
 *
 * Server Component. requireAuth() first, then getMyAdminScope() -- an
 * ordinary company user (no config_admin_roles row at all) gets a plain
 * "not authorized" message, never a broken form or a leaked country row.
 * This mirrors, at the UI layer, the same boundary the RLS policies and
 * tests/db/config-engine-rls.test.sql already enforce at the database
 * layer -- belt and suspenders, not a substitute for the RLS.
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
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-zinc-500">
          You don&apos;t have a configuration admin role. This page is for
          Country Admins only.
        </p>
      </main>
    );
  }

  if (scope.role !== "country_admin") {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-zinc-500">
          Country Identity is managed by your country&apos;s Country Admin.
          You&apos;re a State Admin -- state-level configuration screens are
          not built yet.
        </p>
      </main>
    );
  }

  const country = await getCountryById(scope.countryId);

  if (!country) {
    // Should not happen if config_admin_roles was assigned correctly, but
    // fail loudly and specifically rather than render a blank form.
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-red-600">
          Your admin role points at a country that no longer exists (id{" "}
          {scope.countryId}). This needs fixing at the data level, not the
          UI level.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-xl font-semibold">Country Identity</h1>
      <p className="mb-6 text-sm text-zinc-500">{country.name}</p>
      <CountryIdentityForm country={country} />
    </main>
  );
}
