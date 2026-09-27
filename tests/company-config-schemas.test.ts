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
  CompanyGeographySchema,
  type CompanyGeographyInput,
  CompanyMarketPrioritySchema,
  type CompanyMarketPriorityInput,
  CompanyGoalsSchema,
  CompanyCommercialTermsSchema,
  type CompanyCommercialTermsInput,
  DEFAULT_COMMERCIAL_TERMS,
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

describe("CompanyGeographySchema", () => {
  const valid: CompanyGeographyInput = {
    homeCountryId: "11111111-1111-4111-8111-111111111111",
    homeState: "Muscat Governorate",
    homeCity: "Muscat",
    corridorCountryIds: ["22222222-2222-4222-8222-222222222222"],
    corridorStates: { "22222222-2222-4222-8222-222222222222": ["Maharashtra", "Gujarat"] },
  };

  it("accepts a complete, valid geography payload", () => {
    expect(CompanyGeographySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing/invalid home country id", () => {
    expect(CompanyGeographySchema.safeParse({ ...valid, homeCountryId: "not-a-uuid" }).success).toBe(false);
  });

  it("allows homeState and homeCity to be null (not yet chosen)", () => {
    const result = CompanyGeographySchema.safeParse({ ...valid, homeState: null, homeCity: null });
    expect(result.success).toBe(true);
  });

  it("allows an empty corridor list", () => {
    const result = CompanyGeographySchema.safeParse({
      ...valid,
      corridorCountryIds: [],
      corridorStates: {},
    });
    expect(result.success).toBe(true);
  });

  it("corridorStates accepts an arbitrary dictionary of country id to state name arrays", () => {
    const result = CompanyGeographySchema.safeParse({
      ...valid,
      corridorStates: {
        "22222222-2222-4222-8222-222222222222": ["Any Region Name At All"],
      },
    });
    expect(result.success).toBe(true);
  });
});

describe("CompanyMarketPrioritySchema", () => {
  const valid: CompanyMarketPriorityInput = {
    marketPriority: {
      "11111111-1111-4111-8111-111111111111": "high",
      "22222222-2222-4222-8222-222222222222": "medium",
    },
    statePriority: {
      "22222222-2222-4222-8222-222222222222": { Maharashtra: "high", Gujarat: "explore" },
    },
  };

  it("accepts a complete, valid market priority payload", () => {
    expect(CompanyMarketPrioritySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid market tier value", () => {
    const result = CompanyMarketPrioritySchema.safeParse({
      ...valid,
      marketPriority: { "11111111-1111-4111-8111-111111111111": "urgent" },
    });
    expect(result.success).toBe(false);
  });

  it("allows an empty market priority and state priority (nothing ranked yet)", () => {
    const result = CompanyMarketPrioritySchema.safeParse({ marketPriority: {}, statePriority: {} });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid state-level tier value", () => {
    const result = CompanyMarketPrioritySchema.safeParse({
      ...valid,
      statePriority: { "22222222-2222-4222-8222-222222222222": { Maharashtra: "urgent" } },
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyGoalsSchema", () => {
  it("accepts a valid set of goals", () => {
    const result = CompanyGoalsSchema.safeParse({
      goals: ["Find Buyers", "Increase Exports", "Improve ICV"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty goals list (nothing chosen yet, in progress)", () => {
    expect(CompanyGoalsSchema.safeParse({ goals: [] }).success).toBe(true);
  });

  it("does not enforce a maximum of 3 -- the mockup's own 'top 3' is guidance text, not a limit", () => {
    const result = CompanyGoalsSchema.safeParse({
      goals: ["Find Buyers", "Increase Exports", "Improve ICV", "Build Partnerships", "Win Procurement"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid goal value", () => {
    const result = CompanyGoalsSchema.safeParse({ goals: ["Not A Real Goal"] });
    expect(result.success).toBe(false);
  });
});

describe("CompanyCommercialTermsSchema", () => {
  const valid: CompanyCommercialTermsInput = {
    currency: "USD",
    payment: "Letter of Credit",
    acceptedCurrencies: ["USD", "OMR"],
    dealSize: "250k1m",
    dealMin: "USD 250,000",
    dealMax: "USD 1,000,000",
    contractPref: "Framework Agreement",
    incotermsPreferred: ["FOB"],
    incotermsAccepted: ["FOB", "CIF"],
  };

  it("accepts a complete, valid commercial terms payload", () => {
    expect(CompanyCommercialTermsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-null/empty default (nothing set yet, in progress)", () => {
    expect(CompanyCommercialTermsSchema.safeParse(DEFAULT_COMMERCIAL_TERMS).success).toBe(true);
  });

  it("rejects an invalid currency", () => {
    const result = CompanyCommercialTermsSchema.safeParse({ ...valid, currency: "GBP" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid deal size band", () => {
    const result = CompanyCommercialTermsSchema.safeParse({ ...valid, dealSize: "gt50m" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid Incoterm in either preferred or accepted list", () => {
    const result = CompanyCommercialTermsSchema.safeParse({
      ...valid,
      incotermsPreferred: ["NOT_A_REAL_INCOTERM"],
    });
    expect(result.success).toBe(false);
  });
});
