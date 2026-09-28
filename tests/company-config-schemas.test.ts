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
  computePillarSignals,
  CompanyPillarSelectionSchema,
  type CompanyPillarSelectionInput,
  DEFAULT_PILLAR_SELECTION,
  CompanyComplianceSchema,
  type CompanyComplianceInput,
  DEFAULT_COMPLIANCE,
  CompanyDocChecklistSchema,
  REQUIRED_CERTIFICATIONS,
  SECTOR_CERT_SUGGEST,
  CompanyRfqPrefsSchema,
  type CompanyRfqPrefsInput,
  DEFAULT_RFQ_PREFS,
  CompanyTenderPrefsSchema,
  type CompanyTenderPrefsInput,
  DEFAULT_TENDER_PREFS,
  CompanyContractPrefsSchema,
  type CompanyContractPrefsInput,
  DEFAULT_CONTRACT_PREFS,
  CompanyB2BProductsSchema,
  type CompanyB2BProductsInput,
  DEFAULT_B2B_PRODUCTS,
  CompanyBuyerTargetSchema,
  type CompanyBuyerTargetInput,
  DEFAULT_BUYER_TARGET,
  CompanySupplierTargetSchema,
  type CompanySupplierTargetInput,
  DEFAULT_SUPPLIER_TARGET,
  ImportCorridorSchema,
  type ImportCorridorInput,
  CompanyImportLogisticsSchema,
  DEFAULT_IMPORT_LOGISTICS,
  SHIP_MODES,
  SHIPMENT_VOLUMES,
  ImportRequirementSchema,
  DEFAULT_IMPORT_REQ,
  CompanyExportProductsSchema,
  CompanyExportCorridorsSchema,
  CompanyExportPrefsSchema,
  type CompanyExportPrefsInput,
  computeLandedCost,
  DEFAULT_LANDED_COST,
  CompanyInvestmentPrefsSchema,
  type CompanyInvestmentPrefsInput,
  DEFAULT_INVESTMENT_REQ,
  CompanyFinanceInstrumentsSchema,
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

describe("computePillarSignals", () => {
  it("counts a single role's pillars as 1 signal each", () => {
    const signals = computePillarSignals(["Investor"], []);
    expect(signals.investment).toBe(1);
    expect(signals.governance).toBe(1);
    expect(signals.procurement).toBeUndefined();
  });

  it("counts a role AND a goal pointing to the same pillar as 2 signals", () => {
    const signals = computePillarSignals(["Exporter"], ["Increase Exports"]);
    expect(signals.export).toBe(2);
  });

  it("accumulates signals across multiple roles and multiple goals", () => {
    const signals = computePillarSignals(
      ["Buyer", "Investor"],
      ["Improve ICV", "Find Investment"],
    );
    // Buyer -> icv (1), Investor -> icv (1) = 2; Improve ICV -> icv (1) = 3 total
    expect(signals.icv).toBe(3);
    // Investor -> investment (1), Find Investment -> investment (1) = 2
    expect(signals.investment).toBe(2);
  });

  it("returns an empty object for no roles and no goals", () => {
    expect(computePillarSignals([], [])).toEqual({});
  });

  it("ignores an unrecognized role or goal rather than throwing", () => {
    const signals = computePillarSignals(["Not A Real Role"], ["Not A Real Goal"]);
    expect(signals).toEqual({});
  });
});

describe("CompanyPillarSelectionSchema", () => {
  const valid: CompanyPillarSelectionInput = {
    pillars: ["procurement", "export", "b2b"],
    pillarSource: { procurement: "ai", export: "ai", b2b: "manual" },
    autoApplied: true,
  };

  it("accepts a complete, valid selection", () => {
    expect(CompanyPillarSelectionSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-empty default (nothing selected yet)", () => {
    expect(CompanyPillarSelectionSchema.safeParse(DEFAULT_PILLAR_SELECTION).success).toBe(true);
  });

  it("rejects an invalid pillar id", () => {
    const result = CompanyPillarSelectionSchema.safeParse({
      ...valid,
      pillars: ["not_a_real_pillar"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid pillarSource value (must be 'ai' or 'manual')", () => {
    const result = CompanyPillarSelectionSchema.safeParse({
      ...valid,
      pillarSource: { procurement: "algorithm" },
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyComplianceSchema", () => {
  const valid: CompanyComplianceInput = {
    requiredCerts: ["ISO 9001"],
    tradeRequirements: ["Export License"],
    certsHeld: ["ISO 9001", "CE Marking"],
    certExpiry: { "ISO 9001": "2027-01-01" },
  };

  it("accepts a complete, valid compliance payload", () => {
    expect(CompanyComplianceSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-empty default", () => {
    expect(CompanyComplianceSchema.safeParse(DEFAULT_COMPLIANCE).success).toBe(true);
  });

  it("rejects an invalid certification value", () => {
    const result = CompanyComplianceSchema.safeParse({ ...valid, requiredCerts: ["Not A Real Cert"] });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid trade requirement value", () => {
    const result = CompanyComplianceSchema.safeParse({ ...valid, tradeRequirements: ["Not A Real Requirement"] });
    expect(result.success).toBe(false);
  });

  it("certExpiry accepts an arbitrary dictionary of cert name to date string", () => {
    const result = CompanyComplianceSchema.safeParse({
      ...valid,
      certExpiry: { "ISO 9001": "2027-01-01", "CE Marking": "2026-06-15" },
    });
    expect(result.success).toBe(true);
  });
});

describe("CompanyDocChecklistSchema", () => {
  it("accepts a valid checklist", () => {
    const result = CompanyDocChecklistSchema.safeParse({
      docChecklist: ["Commercial Invoice", "Packing List"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty checklist", () => {
    expect(CompanyDocChecklistSchema.safeParse({ docChecklist: [] }).success).toBe(true);
  });

  it("rejects an invalid document type", () => {
    const result = CompanyDocChecklistSchema.safeParse({ docChecklist: ["Not A Real Document"] });
    expect(result.success).toBe(false);
  });
});

describe("SECTOR_CERT_SUGGEST", () => {
  it("only suggests certifications from the real REQUIRED_CERTIFICATIONS list", () => {
    const allSuggested = Object.values(SECTOR_CERT_SUGGEST).flat();
    for (const cert of allSuggested) {
      expect(REQUIRED_CERTIFICATIONS as readonly string[]).toContain(cert);
    }
  });
});

describe("CompanyRfqPrefsSchema", () => {
  it("accepts a complete, valid RFQ preferences payload", () => {
    const valid: CompanyRfqPrefsInput = {
      categories: "Renewable Energy",
      countries: "Oman",
      size: "USD 50K-2M",
      oppType: "Product Supply",
      timeline: "Short-term (3-6 months)",
    };
    expect(CompanyRfqPrefsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-null default", () => {
    expect(CompanyRfqPrefsSchema.safeParse(DEFAULT_RFQ_PREFS).success).toBe(true);
  });

  it("rejects an invalid opportunity type", () => {
    const result = CompanyRfqPrefsSchema.safeParse({
      ...DEFAULT_RFQ_PREFS,
      oppType: "Not A Real Type",
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyTenderPrefsSchema", () => {
  it("accepts a complete, valid tender preferences payload", () => {
    const valid: CompanyTenderPrefsInput = {
      types: ["Open Tender", "EPC Tender"],
      sector: "Energy",
      countries: "Oman",
      value: "USD 250K-10M",
      categories: "Solar",
      timeline: "Medium-term (6-12 months)",
    };
    expect(CompanyTenderPrefsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-empty default", () => {
    expect(CompanyTenderPrefsSchema.safeParse(DEFAULT_TENDER_PREFS).success).toBe(true);
  });

  it("rejects an invalid tender type", () => {
    const result = CompanyTenderPrefsSchema.safeParse({
      ...DEFAULT_TENDER_PREFS,
      types: ["Not A Real Tender Type"],
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyContractPrefsSchema", () => {
  it("accepts a complete, valid contract preferences payload", () => {
    const valid: CompanyContractPrefsInput = {
      types: ["Supply Contract"],
      value: "USD 100K-5M",
      duration: "1-5 Years",
      industries: "Energy",
      timeline: "Long-term (12-24 months)",
    };
    expect(CompanyContractPrefsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-empty default", () => {
    expect(CompanyContractPrefsSchema.safeParse(DEFAULT_CONTRACT_PREFS).success).toBe(true);
  });

  it("rejects an invalid contract duration", () => {
    const result = CompanyContractPrefsSchema.safeParse({
      ...DEFAULT_CONTRACT_PREFS,
      duration: "10 Years",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid contract type", () => {
    const result = CompanyContractPrefsSchema.safeParse({
      ...DEFAULT_CONTRACT_PREFS,
      types: ["Not A Real Contract Type"],
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyB2BProductsSchema", () => {
  it("accepts a complete, valid products payload", () => {
    const valid: CompanyB2BProductsInput = {
      sell: [
        {
          cat: "Electronics",
          name: "Solar Inverter",
          hs: "8504.40",
          country: "Oman",
          moq: "100 units",
          cert: "CE",
          budget: "$50K-$250K",
          timeline: "Short-term (3-6 months)",
        },
      ],
      source: [],
    };
    expect(CompanyB2BProductsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-empty default", () => {
    expect(CompanyB2BProductsSchema.safeParse(DEFAULT_B2B_PRODUCTS).success).toBe(true);
  });

  it("rejects a sell item missing a product name", () => {
    const result = CompanyB2BProductsSchema.safeParse({
      sell: [{ cat: "Electronics", name: "", hs: "", country: "", moq: "", cert: "", budget: null, timeline: null }],
      source: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid budget band", () => {
    const result = CompanyB2BProductsSchema.safeParse({
      sell: [{ cat: "", name: "X", hs: "", country: "", moq: "", cert: "", budget: "Not A Real Band", timeline: null }],
      source: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyBuyerTargetSchema", () => {
  it("accepts a complete, valid buyer target", () => {
    const valid: CompanyBuyerTargetInput = {
      country: "Saudi Arabia",
      type: "Government / Public Sector",
      industry: "Energy",
      size: "Large Enterprise",
      contractValue: "USD 500K-5M",
      budget: "$250K-$1M",
      timeline: "Medium-term (6-12 months)",
    };
    expect(CompanyBuyerTargetSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-null default", () => {
    expect(CompanyBuyerTargetSchema.safeParse(DEFAULT_BUYER_TARGET).success).toBe(true);
  });

  it("rejects an invalid buyer type", () => {
    const result = CompanyBuyerTargetSchema.safeParse({ ...DEFAULT_BUYER_TARGET, type: "Not A Real Type" });
    expect(result.success).toBe(false);
  });
});

describe("CompanySupplierTargetSchema", () => {
  it("accepts a complete, valid supplier target", () => {
    const valid: CompanySupplierTargetInput = {
      type: "Manufacturer",
      countries: "China, India",
      certs: "ISO 9001",
      esg: "Preferred",
      capability: "Export capable",
      budget: "<$50K",
      timeline: "Immediate (0-3 months)",
    };
    expect(CompanySupplierTargetSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the all-null default", () => {
    expect(CompanySupplierTargetSchema.safeParse(DEFAULT_SUPPLIER_TARGET).success).toBe(true);
  });

  it("rejects an invalid ESG rating requirement", () => {
    const result = CompanySupplierTargetSchema.safeParse({ ...DEFAULT_SUPPLIER_TARGET, esg: "Optional" });
    expect(result.success).toBe(false);
  });
});

describe("ImportCorridorSchema", () => {
  it("accepts a complete, valid import corridor", () => {
    const valid: ImportCorridorInput = {
      o: "India",
      d: "Oman",
      incoterm: "CIF",
      products: "Solar Modules, Inverters",
      port: "Mumbai to Sohar",
      duty: 5,
      freight: 1800,
      transit: 14,
      demand: "High",
      risk: "Low",
      budget: "$50K-$250K",
      timeline: "Immediate (0-3 months)",
    };
    expect(ImportCorridorSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a corridor missing an origin or destination", () => {
    const result = ImportCorridorSchema.safeParse({
      o: "",
      d: "Oman",
      incoterm: "CIF",
      products: "",
      port: "",
      duty: 0,
      freight: 0,
      transit: 0,
      demand: "Medium",
      risk: "Medium",
      budget: null,
      timeline: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an incoterm outside the corridor's own 5-option dropdown (e.g. a valid Incoterm elsewhere but not here)", () => {
    const result = ImportCorridorSchema.safeParse({
      o: "India",
      d: "Oman",
      incoterm: "DPU",
      products: "",
      port: "",
      duty: 0,
      freight: 0,
      transit: 0,
      demand: "Medium",
      risk: "Medium",
      budget: null,
      timeline: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative duty percentage", () => {
    const result = ImportCorridorSchema.safeParse({
      o: "India",
      d: "Oman",
      incoterm: "FOB",
      products: "",
      port: "",
      duty: -5,
      freight: 0,
      transit: 0,
      demand: "Medium",
      risk: "Medium",
      budget: null,
      timeline: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyImportLogisticsSchema", () => {
  it("accepts the all-empty default", () => {
    expect(CompanyImportLogisticsSchema.safeParse(DEFAULT_IMPORT_LOGISTICS).success).toBe(true);
  });

  it("rejects an invalid shipping mode", () => {
    const result = CompanyImportLogisticsSchema.safeParse({
      ...DEFAULT_IMPORT_LOGISTICS,
      shipModes: ["Space Freight"],
    });
    expect(result.success).toBe(false);
  });

  it("SHIP_MODES and SHIPMENT_VOLUMES contain no em dashes (converted to colons)", () => {
    const all = [...SHIP_MODES, ...SHIPMENT_VOLUMES];
    expect(all.some((v) => v.includes("\u2014"))).toBe(false);
  });
});

describe("ImportRequirementSchema", () => {
  it("accepts the all-null default", () => {
    expect(ImportRequirementSchema.safeParse(DEFAULT_IMPORT_REQ).success).toBe(true);
  });

  it("rejects an incoterm outside import requirement's own smaller 3-option dropdown", () => {
    const result = ImportRequirementSchema.safeParse({ ...DEFAULT_IMPORT_REQ, incoterm: "EXW" });
    expect(result.success).toBe(false);
  });
});

describe("CompanyExportProductsSchema and CompanyExportCorridorsSchema (reuse of B2B/Import shapes)", () => {
  it("accepts an export product using B2B's sell item shape", () => {
    const result = CompanyExportProductsSchema.safeParse({
      exportProducts: [
        { cat: "Solar", name: "Solar Panels", hs: "8541.40", country: "Oman", moq: "200 units", cert: "CE", budget: "$50K-$250K", timeline: "Short-term (3-6 months)" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an export corridor using the same shape as an import corridor", () => {
    const result = CompanyExportCorridorsSchema.safeParse({
      exportCorridors: [
        { o: "Oman", d: "Kenya", incoterm: "CIF", products: "Solar Modules", port: "Sohar to Mombasa", duty: 5, freight: 1500, transit: 18, demand: "Medium", risk: "Medium", budget: "$250K-$1M", timeline: "Medium-term (6-12 months)" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an export corridor missing an origin or destination, same rule as import", () => {
    const result = CompanyExportCorridorsSchema.safeParse({
      exportCorridors: [
        { o: "", d: "Kenya", incoterm: "CIF", products: "", port: "", duty: 0, freight: 0, transit: 0, demand: "Medium", risk: "Medium", budget: null, timeline: null },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyExportPrefsSchema", () => {
  it("accepts a complete, valid per-country preferences payload", () => {
    const valid: CompanyExportPrefsInput = {
      exportCountries: ["Kenya", "Tanzania"],
      exportTier: { Kenya: "high", Tanzania: "medium" },
      exportBudget: { Kenya: "$250K-$1M" },
      exportTimeline: { Kenya: "Medium-term (6-12 months)" },
    };
    expect(CompanyExportPrefsSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an empty export preferences payload (nothing added yet)", () => {
    const result = CompanyExportPrefsSchema.safeParse({
      exportCountries: [],
      exportTier: {},
      exportBudget: {},
      exportTimeline: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid market tier value, reusing the same MARKET_TIERS enum as company-level Target Market Priority", () => {
    const result = CompanyExportPrefsSchema.safeParse({
      exportCountries: ["Kenya"],
      exportTier: { Kenya: "urgent" },
      exportBudget: {},
      exportTimeline: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("computeLandedCost", () => {
  it("reproduces the mockup's own runLanded() formula exactly for a simple scenario", () => {
    // goods = 100*1000 = 100,000; insurance = (100000+1800)*0.005 = 509;
    // cif = 100000+1800+509 = 102309; duty = 102309*0.05 = 5115.45;
    // tax = (102309+5115.45)*0.05 = 5371.225; landedTotal = 100000+1800+509+5115.45+5371.225+500+300 = 113595.675
    const result = computeLandedCost({ cost: 100, qty: 1000, freight: 1800, ins: 0.5, duty: 5, tax: 5, port: 500, bank: 300, sell: 150 });
    expect(result.goods).toBe(100000);
    expect(result.landedTotal).toBeCloseTo(113595.675, 2);
    expect(result.landedPerUnit).toBeCloseTo(113.595675, 5);
    expect(result.revenue).toBe(150000);
    expect(result.profit).toBeCloseTo(150000 - 113595.675, 2);
  });

  it("returns 0 landed-per-unit when quantity is 0 (avoids a divide-by-zero)", () => {
    const result = computeLandedCost({ ...DEFAULT_LANDED_COST, cost: 100, qty: 0 });
    expect(result.landedPerUnit).toBe(0);
  });

  it("returns 0 margin when revenue is 0 (avoids a divide-by-zero)", () => {
    const result = computeLandedCost({ ...DEFAULT_LANDED_COST, cost: 100, qty: 10, sell: 0 });
    expect(result.marginPct).toBe(0);
  });

  it("reports a negative profit when landed cost exceeds revenue", () => {
    const result = computeLandedCost({ cost: 100, qty: 10, freight: 500, ins: 1, duty: 10, tax: 10, port: 100, bank: 50, sell: 50 });
    expect(result.profit).toBeLessThan(0);
  });
});

describe("CompanyInvestmentPrefsSchema", () => {
  it("accepts a complete, valid investment preferences payload", () => {
    const valid: CompanyInvestmentPrefsInput = {
      investmentCountries: ["Kenya"],
      investmentTier: { Kenya: "high" },
      investmentBudget: { Kenya: "$1M-$5M" },
      investmentTimeline: { Kenya: "Long-term (12-24 months)" },
      investmentReq: {
        type: "Joint Venture",
        ownership: "JV Partner",
        sectorFocus: "Renewable Energy",
        budget: "$1M-$5M",
        timeline: "Long-term (12-24 months)",
      },
    };
    expect(CompanyInvestmentPrefsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid investment type", () => {
    const result = CompanyInvestmentPrefsSchema.safeParse({
      investmentCountries: [],
      investmentTier: {},
      investmentBudget: {},
      investmentTimeline: {},
      investmentReq: { ...DEFAULT_INVESTMENT_REQ, type: "Crowdfunding" },
    });
    expect(result.success).toBe(false);
  });
});

describe("CompanyFinanceInstrumentsSchema", () => {
  it("accepts a valid set of finance instruments", () => {
    const result = CompanyFinanceInstrumentsSchema.safeParse({
      financeInstruments: ["Letter of Credit", "Bank Guarantee"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid finance instrument", () => {
    const result = CompanyFinanceInstrumentsSchema.safeParse({
      financeInstruments: ["Crypto Escrow"],
    });
    expect(result.success).toBe(false);
  });
});
