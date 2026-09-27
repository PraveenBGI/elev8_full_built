"use server";

/**
 * app/login/actions.ts
 *
 * Login itself stays a client-side call (getBrowserDb().auth.signInWithPassword)
 * so the Supabase session cookie is set correctly by the browser client. But
 * deciding WHERE to send someone afterward needs their role, and role checks
 * (getMyAdminScope, getMyCompanyScope) are server-only adapter functions --
 * this Server Action is the bridge between the two, called once sign-in
 * succeeds.
 */

import { getMyAdminScope } from "@/lib/modules/config-engine/adapter";
import { getMyCompanyScope } from "@/lib/modules/company-config/adapter";

export async function resolvePostLoginRedirectAction(): Promise<string> {
  const adminScope = await getMyAdminScope();
  if (adminScope) {
    return "/admin/config-engine";
  }

  const companyScope = await getMyCompanyScope();
  if (companyScope) {
    return "/company";
  }

  // No config admin role and no company yet -- most likely a brand new
  // company user. /company itself handles this case (shows the
  // create-company entry point), so it's still the right destination.
  return "/company";
}
