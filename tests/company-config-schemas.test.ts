/**
 * tests/company-config-schemas.test.ts
 *
 * Unit tests for lib/modules/company-config/schemas.ts. Same honest
 * ceiling as config-engine-schemas.test.ts: proves the validation logic,
 * not the actual Server Action -> Supabase round trip, which needs a
 * live session this sandbox cannot provide. The database side (RLS,
 * create_company(), the recursion bug that was found and fixed) already
 * has real integration tests in tests/db/company-config.test.sql, run
 * against a genuine Postgres in CI.
 */

import { describe, expect, it } from "vitest";
import {
  CompanyIdentitySchema,
  CompanyRoleSchema,
  CompanyTradeIntentSchema,
} from "@/lib/modules/company-config/schemas";

describe("CompanyIdentitySchema", () => {
  const valid = {
    name: "Al Jazeera Steel Engineering LLC",
    countryId: "11111111-1111-4111-8111-111111111111",
    type: "Seller / Supplier Organization" as const,
    sector: "Manufacturing" as const,
    size: "51-200 employees" as const,
    yearEstablished: 2005,
    annualRevenue: "$10M to $50M" as const,
    tradeYears: "10+ years" as const,
    countriesExportedTo: 5,
    differentiator: "Only CEPA-certified steel pipe manufacturer in Oman",
    prefLevel: "company" as const,
  };

  it("accepts a complete, valid identity", () => {
    expect(CompanyIdentitySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing company name", () => {
    expect(CompanyIdentitySchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects a non-UUID countryId", () => {
    expect(CompanyIdentitySchema.safeParse({ ...valid, countryId: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  it("allows every optional field to be null", () => {
    const result = CompanyIdentitySchema.safeParse({
      ...valid,
      type: null,
      sector: null,
      size: null,
      yearEstablished: null,
      annualRevenue: null,
      tradeYears: null,
      countriesExportedTo: null,
      differentiator: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid prefLevel", () => {
    const result = CompanyIdentitySchema.safeParse({ ...valid, prefLevel: "everyone" });
    expect(result.success).toBe(false);
  });
});

describe("CompanyRoleSchema", () => {
  it("accepts a valid primary role with secondary roles", () => {
    const result = CompanyRoleSchema.safeParse({
      primaryRole: "Seller / Supplier",
      secondaryRoles: ["Buyer", "Manufacturer"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid primary role", () => {
    const result = CompanyRoleSchema.safeParse({
      primaryRole: "Not A Real Role",
      secondaryRoles: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty secondary roles list", () => {
    const result = CompanyRoleSchema.safeParse({
      primaryRole: "Buyer",
      secondaryRoles: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("CompanyTradeIntentSchema", () => {
  it("accepts valid sell and buy intents together", () => {
    const result = CompanyTradeIntentSchema.safeParse({
      sellIntents: ["Export products", "Find distributors"],
      buyIntents: ["Source raw materials"],
      strategicIntent: "Grow export share into East Africa",
      existingPartners: "Oman Steel Co",
      competitors: "Gulf Steel",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid sell intent", () => {
    const result = CompanyTradeIntentSchema.safeParse({
      sellIntents: ["Not A Real Intent"],
      buyIntents: [],
      strategicIntent: null,
      existingPartners: null,
      competitors: null,
    });
    expect(result.success).toBe(false);
  });

  it("allows empty intent lists and null free-text fields", () => {
    const result = CompanyTradeIntentSchema.safeParse({
      sellIntents: [],
      buyIntents: [],
      strategicIntent: null,
      existingPartners: null,
      competitors: null,
    });
    expect(result.success).toBe(true);
  });
});
