"use server";

/**
 * app/company/actions.ts
 *
 * Two kinds of actions here: createCompanyAction (the entry point when a
 * signed-in user has no company yet) and the three edit actions
 * (Identity/Role/Trade Intent), each re-deriving the caller's company
 * scope from the database rather than trusting a companyId the client
 * might send -- same pattern as every other module's actions.ts.
 */

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/adapter";
import {
  createCompany,
  getMyCompanyScope,
  updateCompanyIdentity,
  updateCompanyRole,
  updateCompanyTradeIntent,
} from "@/lib/modules/company-config/adapter";
import {
  CompanyIdentitySchema,
  CompanyRoleSchema,
  CompanyTradeIntentSchema,
  type CompanyIdentityInput,
  type CompanyRoleInput,
  type CompanyTradeIntentInput,
} from "@/lib/modules/company-config/schemas";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createCompanyAction(
  countryId: string,
  name: string,
): Promise<ActionResult> {
  await requireAuth();

  if (!countryId) {
    return { ok: false, error: "Choose a registration country." };
  }
  if (!name.trim()) {
    return { ok: false, error: "Company name is required." };
  }

  try {
    await createCompany(countryId, name);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create company." };
  }

  revalidatePath("/company");
  return { ok: true };
}

async function requireCompanyScope() {
  await requireAuth();
  const scope = await getMyCompanyScope();
  if (!scope) {
    throw new Error("No company found for this account.");
  }
  return scope;
}

export async function saveCompanyIdentityAction(
  input: CompanyIdentityInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyIdentitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyIdentity(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyRoleAction(input: CompanyRoleInput): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyRoleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyRole(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}

export async function saveCompanyTradeIntentAction(
  input: CompanyTradeIntentInput,
): Promise<ActionResult> {
  let scope;
  try {
    scope = await requireCompanyScope();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Not authorized." };
  }

  const parsed = CompanyTradeIntentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Some fields need attention.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompanyTradeIntent(scope.companyId, parsed.data);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Save failed." };
  }

  revalidatePath("/company");
  return { ok: true };
}
