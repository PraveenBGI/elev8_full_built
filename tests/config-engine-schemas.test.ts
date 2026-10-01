/**
 * tests/config-engine-schemas.test.ts
 *
 * Unit tests for the validation logic in
 * lib/modules/config-engine/schemas.ts. This is the honest ceiling of
 * automated testing available for this module's UI slice in this
 * environment: it proves the shape-enforcement rules are correct, but
 * does not exercise the actual Server Action/Supabase round trip -- that
 * needs a live Supabase session, which this sandbox cannot provide (see
 * docs/modules/config-engine/README.md). The database side of this
 * module (RLS, the resolver, the approval workflow) already has real
 * integration tests in tests/db/ run against a genuine Postgres in CI --
 * this file covers the one thing that lives purely in application code.
 */

import { describe, expect, it } from "vitest";
import { CountryIdentitySchema, toCountryRow, HsCodeSchema, TaxSettingsSchema, FreeTradeAgreementSchema, ZoneSchema, PortAirportSchema, AuthoritySchema, StakeholderSchema, GovernancePayloadSchema, ProcurementPayloadSchema, DEFAULT_PROCUREMENT_PAYLOAD, type ProcurementPayloadInput, B2bPayloadSchema, DEFAULT_B2B_PAYLOAD, type B2bPayloadInput, ImportPayloadSchema, DEFAULT_IMPORT_PAYLOAD, type ImportPayloadInput, ExportPayloadSchema, DEFAULT_EXPORT_PAYLOAD, type ExportPayloadInput, InvestmentPayloadSchema, DEFAULT_INVESTMENT_PAYLOAD, type InvestmentPayloadInput, SustainabilityPayloadSchema, DEFAULT_SUSTAINABILITY_PAYLOAD, type SustainabilityPayloadInput, computeKpiAchievement, IcvPayloadSchema, DEFAULT_ICV_PAYLOAD, type IcvPayloadInput, ICV_SCORE_LABELS } from "@/lib/modules/config-engine/schemas";

describe("CountryIdentitySchema", () => {
  const validInput = {
    name: "Oman",
    masterCurrency: "omr", // lowercase on purpose -- schema should uppercase it
    ancillaryCurrency: null,
    countryCode: "OM",
    wbCode: null,
    officialLanguage: "Arabic",
    timeZone: "Asia/Muscat",
    dialCode: "+968",
    geozone: "Middle East",
    incomeGroup: "High income",
    systemOfTrade: "General trade",
    wtoMember: true,
    financialYearModel: "Calendar year",
    currentFinancialYear: "2026",
    workingWeek: "Sun-Thu",
  };

  it("accepts a complete, valid identity and normalizes currency to uppercase", () => {
    const result = CountryIdentitySchema.parse(validInput);
    expect(result.masterCurrency).toBe("OMR");
    expect(result.name).toBe("Oman");
  });

  it("rejects a missing country name", () => {
    const result = CountryIdentitySchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a master currency that isn't 3 letters", () => {
    const result = CountryIdentitySchema.safeParse({
      ...validInput,
      masterCurrency: "OM",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a dial code with non-digit characters", () => {
    const result = CountryIdentitySchema.safeParse({
      ...validInput,
      dialCode: "call-me",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a dial code with or without a leading +", () => {
    expect(
      CountryIdentitySchema.safeParse({ ...validInput, dialCode: "968" }).success,
    ).toBe(true);
    expect(
      CountryIdentitySchema.safeParse({ ...validInput, dialCode: "+968" }).success,
    ).toBe(true);
  });

  it("defaults wtoMember to false when omitted", () => {
    const { wtoMember, ...withoutWto } = validInput;
    void wtoMember;
    const result = CountryIdentitySchema.parse(withoutWto);
    expect(result.wtoMember).toBe(false);
  });

  it("allows optional fields to be null", () => {
    const result = CountryIdentitySchema.parse({
      name: "Oman",
      masterCurrency: "OMR",
      countryCode: null,
      wbCode: null,
      officialLanguage: null,
      ancillaryCurrency: null,
      timeZone: null,
      dialCode: null,
      geozone: null,
      incomeGroup: null,
      systemOfTrade: null,
      wtoMember: false,
      financialYearModel: null,
      currentFinancialYear: null,
      workingWeek: null,
    });
    expect(result.countryCode).toBeNull();
  });
});

describe("toCountryRow", () => {
  it("maps camelCase fields to the exact snake_case database columns", () => {
    const row = toCountryRow({
      name: "Oman",
      masterCurrency: "OMR",
      countryCode: "OM",
      wbCode: null,
      officialLanguage: "Arabic",
      ancillaryCurrency: null,
      timeZone: "Asia/Muscat",
      dialCode: "+968",
      geozone: "Middle East",
      incomeGroup: "High income",
      systemOfTrade: "General trade",
      wtoMember: true,
      financialYearModel: "Calendar year",
      currentFinancialYear: "2026",
      workingWeek: "Sun-Thu",
    });

    expect(row).toEqual({
      name: "Oman",
      master_currency: "OMR",
      country_code: "OM",
      wb_code: null,
      official_language: "Arabic",
      ancillary_currency: null,
      time_zone: "Asia/Muscat",
      dial_code: "+968",
      geozone: "Middle East",
      income_group: "High income",
      system_of_trade: "General trade",
      wto_member: true,
      financial_year_model: "Calendar year",
      current_financial_year: "2026",
      working_week: "Sun-Thu",
    });
  });
});

describe("HsCodeSchema", () => {
  it("accepts a valid HS code entry with no chapter link", () => {
    const result = HsCodeSchema.safeParse({
      code: "8501.10",
      description: "Electric motors",
      category: "Electronics & ICT",
      hsChapterId: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid HS code entry WITH a chapter link", () => {
    const result = HsCodeSchema.safeParse({
      code: "8501.10",
      description: "Electric motors",
      category: "Electronics & ICT",
      hsChapterId: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-UUID chapter link", () => {
    const result = HsCodeSchema.safeParse({
      code: "8501.10",
      description: "Electric motors",
      category: "Electronics & ICT",
      hsChapterId: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty code", () => {
    const result = HsCodeSchema.safeParse({
      code: "",
      description: "Electric motors",
      category: "Electronics & ICT",
      hsChapterId: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a category outside the fixed list", () => {
    const result = HsCodeSchema.safeParse({
      code: "8501.10",
      description: "Electric motors",
      category: "Not A Real Category",
      hsChapterId: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("TaxSettingsSchema", () => {
  it("accepts all-null (not configured yet) as valid", () => {
    const result = TaxSettingsSchema.safeParse({
      corporateTaxRate: null,
      vatGstName: null,
      vatGstRate: null,
      withholdingTaxRate: null,
      customsDutyGeneral: null,
      taxAuthority: null,
    });
    expect(result.success).toBe(true);
  });

  it("coerces a string rate into a number", () => {
    const result = TaxSettingsSchema.parse({
      corporateTaxRate: "15",
      vatGstName: "VAT",
      vatGstRate: 5,
      withholdingTaxRate: null,
      customsDutyGeneral: null,
      taxAuthority: null,
    });
    expect(result.corporateTaxRate).toBe(15);
  });

  it("rejects a rate above 100", () => {
    const result = TaxSettingsSchema.safeParse({
      corporateTaxRate: 150,
      vatGstName: null,
      vatGstRate: null,
      withholdingTaxRate: null,
      customsDutyGeneral: null,
      taxAuthority: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("FreeTradeAgreementSchema", () => {
  const valid = {
    agreementName: "GCC-India CEPA",
    type: "Comprehensive Economic Partnership Agreement" as const,
    status: "In Force" as const,
    partnerCountries: ["India"],
    preferentialTariffRate: 7.5,
    rulesOfOrigin: "Wholly obtained or substantially transformed",
    effectiveDate: "2026-01-01",
  };

  it("accepts a complete, valid agreement", () => {
    expect(FreeTradeAgreementSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an agreement with no partner countries", () => {
    const result = FreeTradeAgreementSchema.safeParse({
      ...valid,
      partnerCountries: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    const result = FreeTradeAgreementSchema.safeParse({
      ...valid,
      status: "Not A Real Status",
    });
    expect(result.success).toBe(false);
  });

  it("accepts the em-dash-free status value used in place of the mockup's original", () => {
    const result = FreeTradeAgreementSchema.safeParse({
      ...valid,
      status: "Signed, Not Yet Ratified",
    });
    expect(result.success).toBe(true);
  });

  it("allows type to be null (not yet classified)", () => {
    const result = FreeTradeAgreementSchema.safeParse({ ...valid, type: null });
    expect(result.success).toBe(true);
  });
});

describe("ZoneSchema", () => {
  it("accepts a valid zone", () => {
    const result = ZoneSchema.safeParse({
      name: "Salalah Free Zone",
      type: "Free Zone",
      location: "Salalah",
      sector: "Logistics",
      incentives: "100% foreign ownership",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid zone type", () => {
    const result = ZoneSchema.safeParse({
      name: "Test Zone",
      type: "Not A Real Type",
      location: null,
      sector: null,
      incentives: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("PortAirportSchema", () => {
  it("accepts a valid port entry", () => {
    const result = PortAirportSchema.safeParse({
      name: "Port Sultan Qaboos",
      type: "Sea Port",
      location: "Muscat",
      isCustomsPoint: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid port type", () => {
    const result = PortAirportSchema.safeParse({
      name: "Test Port",
      type: "Not A Real Type",
      location: null,
      isCustomsPoint: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("AuthoritySchema", () => {
  it("accepts a valid authority", () => {
    const result = AuthoritySchema.safeParse({
      name: "National Standards Authority",
      type: "Standards Authority",
      domain: "Both",
      headquarters: "Capital City",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid domain", () => {
    const result = AuthoritySchema.safeParse({
      name: "Test Authority",
      type: "Standards Authority",
      domain: "Not A Real Domain",
      headquarters: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("StakeholderSchema", () => {
  it("accepts a valid stakeholder with multiple sectors", () => {
    const result = StakeholderSchema.safeParse({
      name: "Ministry of Trade",
      sectors: ["Consumer Goods", "Industrial"],
      domain: "Procurement",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty sectors array", () => {
    const result = StakeholderSchema.safeParse({
      name: "Ministry of Trade",
      sectors: [],
      domain: "Procurement",
    });
    expect(result.success).toBe(true);
  });
});

describe("GovernancePayloadSchema", () => {
  it("accepts a realistic full payload", () => {
    const result = GovernancePayloadSchema.safeParse({
      escalation: [
        { level: 1, role: "Department Head" },
        { level: 2, role: "Director General" },
      ],
      dataGovernance: "Centralized",
      auditFrequency: "Quarterly",
      accessPolicy: "Role-based",
      infoClassification: "Public, Internal, Restricted",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty escalation list and all-null settings", () => {
    const result = GovernancePayloadSchema.safeParse({
      escalation: [],
      dataGovernance: null,
      auditFrequency: null,
      accessPolicy: null,
      infoClassification: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid audit frequency", () => {
    const result = GovernancePayloadSchema.safeParse({
      escalation: [],
      dataGovernance: null,
      auditFrequency: "Weekly",
      accessPolicy: null,
      infoClassification: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an escalation level with an empty role", () => {
    const result = GovernancePayloadSchema.safeParse({
      escalation: [{ level: 1, role: "" }],
      dataGovernance: null,
      auditFrequency: null,
      accessPolicy: null,
      infoClassification: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("ProcurementPayloadSchema", () => {
  const validPayload: ProcurementPayloadInput = {
    tenderTypes: {
      open: true,
      limited: true,
      restricted: false,
      singleSource: false,
      directAward: true,
      twoStage: false,
      framework: false,
      dialogue: false,
      emergency: false,
      reverseAuction: false,
      prequalified: false,
    },
    contractTypes: ["Fixed Price", "EPC"],
    thresholds: { directAward: 5000, limited: 50000, open: 50001 },
    evalWeights: { technical: 30, commercial: 30, icv: 15, esg: 15, compliance: 10 },
    mandatoryDocuments: ["Bid Bond"],
    prequalification: { required: true, minScore: 70 },
    obligationCategories: ["Delivery", "Quality"],
    kpi: [
      { area: "Quality", kpi: "Defect rate", micro: 10, small: 10, medium: 10, large: 10, mfn: 10, row: 10 },
    ],
  };

  it("accepts a complete, valid payload where weights total exactly 100", () => {
    expect(ProcurementPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects evaluation weights that don't total 100", () => {
    const result = ProcurementPayloadSchema.safeParse({
      ...validPayload,
      evalWeights: { technical: 30, commercial: 30, icv: 15, esg: 15, compliance: 5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid contract type", () => {
    const result = ProcurementPayloadSchema.safeParse({
      ...validPayload,
      contractTypes: ["Not A Real Contract Type"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid obligation category", () => {
    const result = ProcurementPayloadSchema.safeParse({
      ...validPayload,
      obligationCategories: ["Not A Real Category"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts an empty KPI list and empty chip arrays", () => {
    const result = ProcurementPayloadSchema.safeParse({
      ...validPayload,
      mandatoryDocuments: [],
      obligationCategories: [],
      contractTypes: [],
      kpi: [],
    });
    expect(result.success).toBe(true);
  });

  it("DEFAULT_PROCUREMENT_PAYLOAD itself is valid (weights sum to 0, which is not 100)", () => {
    // The all-zero default is intentionally NOT a passing evalWeights
    // total -- an admin must actually set real weights before saving.
    // This test documents that expectation rather than assuming it.
    const result = ProcurementPayloadSchema.safeParse(DEFAULT_PROCUREMENT_PAYLOAD);
    expect(result.success).toBe(false);
  });
});

describe("B2bPayloadSchema", () => {
  const validPayload: B2bPayloadInput = {
    enabledIdentities: ["Buyer", "Supplier"],
    categories: ["Products", "Services"],
    opportunityTypes: ["RFQ", "Tender"],
    requireVerification: true,
    minVerificationLevel: "Verified",
    matchWeights: {
      industry: 20,
      product: 20,
      location: 20,
      certification: 15,
      pastPerformance: 15,
      icv: 10,
    },
  };

  it("accepts a complete, valid payload where match weights total exactly 100", () => {
    expect(B2bPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects match weights that don't total 100", () => {
    const result = B2bPayloadSchema.safeParse({
      ...validPayload,
      matchWeights: { ...validPayload.matchWeights, icv: 5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid business identity", () => {
    const result = B2bPayloadSchema.safeParse({
      ...validPayload,
      enabledIdentities: ["Not A Real Identity"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid opportunity type", () => {
    const result = B2bPayloadSchema.safeParse({
      ...validPayload,
      opportunityTypes: ["Not A Real Type"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid verification level", () => {
    const result = B2bPayloadSchema.safeParse({
      ...validPayload,
      minVerificationLevel: "Not A Real Level",
    });
    expect(result.success).toBe(false);
  });

  it("DEFAULT_B2B_PAYLOAD deliberately fails validation (all-zero weights)", () => {
    const result = B2bPayloadSchema.safeParse(DEFAULT_B2B_PAYLOAD);
    expect(result.success).toBe(false);
  });
});

describe("ImportPayloadSchema", () => {
  const validPayload: ImportPayloadInput = {
    categories: ["Electronics", "Machinery"],
    restricted: ["Used tires"],
    dutyBands: { general: 5, foodstuffs: 0, industrialInputs: 2, luxury: 100 },
    licensingRequired: true,
    customsPoints: ["Port Sultan Qaboos"],
    hsCodes: ["8501.10"],
    incoterms: ["FOB", "CIF"],
    landedCostComponents: ["Product Cost", "Freight", "Customs Duty"],
    substitutionWatch: [
      { product: "Steel pipes", importValue: 100, localSupply: 10, potential: 40 },
    ],
  };

  it("accepts a complete, valid payload", () => {
    expect(ImportPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts the all-empty default payload", () => {
    expect(ImportPayloadSchema.safeParse(DEFAULT_IMPORT_PAYLOAD).success).toBe(true);
  });

  it("rejects an invalid incoterm", () => {
    const result = ImportPayloadSchema.safeParse({
      ...validPayload,
      incoterms: ["NOT_A_REAL_INCOTERM"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid landed cost component", () => {
    const result = ImportPayloadSchema.safeParse({
      ...validPayload,
      landedCostComponents: ["Not A Real Component"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a substitution watch item with localSupply over 100", () => {
    const result = ImportPayloadSchema.safeParse({
      ...validPayload,
      substitutionWatch: [{ product: "X", importValue: 10, localSupply: 150, potential: 40 }],
    });
    expect(result.success).toBe(false);
  });

  it("customsPoints and hsCodes accept arbitrary strings (matched by name/code, not enum)", () => {
    const result = ImportPayloadSchema.safeParse({
      ...validPayload,
      customsPoints: ["Any Port Name At All"],
      hsCodes: ["9999.99"],
    });
    expect(result.success).toBe(true);
  });
});

describe("ExportPayloadSchema", () => {
  const validPayload: ExportPayloadInput = {
    prioritySectors: ["Manufacturing"],
    targetCountries: [{ country: "India", budget: 500000, year: "2026", quarter: "Q2" }],
    corridors: [{ origin: "Oman", destination: "India", status: "Strategic", port: "Port Sultan Qaboos" }],
    hsCodes: ["8501.10"],
    incoterms: ["FOB"],
    tradeFinance: ["Letter of Credit"],
    incentives: ["Export subsidy"],
    readinessWeights: {
      productReadiness: 20,
      certifications: 15,
      quality: 15,
      pricing: 15,
      logistics: 15,
      financial: 10,
      marketFit: 10,
    },
  };

  it("accepts a complete, valid payload where readiness weights total exactly 100", () => {
    expect(ExportPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts the all-empty default payload structurally (weights will fail the total check)", () => {
    const result = ExportPayloadSchema.safeParse(DEFAULT_EXPORT_PAYLOAD);
    expect(result.success).toBe(false);
  });

  it("rejects readiness weights that don't total 100", () => {
    const result = ExportPayloadSchema.safeParse({
      ...validPayload,
      readinessWeights: { ...validPayload.readinessWeights, marketFit: 5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid corridor status", () => {
    const result = ExportPayloadSchema.safeParse({
      ...validPayload,
      corridors: [{ ...validPayload.corridors[0], status: "Not A Real Status" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid trade finance instrument", () => {
    const result = ExportPayloadSchema.safeParse({
      ...validPayload,
      tradeFinance: ["Not A Real Instrument"],
    });
    expect(result.success).toBe(false);
  });

  it("allows a corridor's port to be null (not yet assigned)", () => {
    const result = ExportPayloadSchema.safeParse({
      ...validPayload,
      corridors: [{ ...validPayload.corridors[0], port: null }],
    });
    expect(result.success).toBe(true);
  });
});

describe("InvestmentPayloadSchema", () => {
  const validPayload: InvestmentPayloadInput = {
    prioritySectors: ["Manufacturing"],
    incentives: ["Tax holiday"],
    sez: ["Salalah Free Zone"],
    ticketBands: [{ label: "Small", min: 1, max: 10 }],
    dueDiligenceRequired: ["Financial DD", "Legal DD"],
    icThreshold: 5,
    riskBands: { low: 20, moderate: 40, elevated: 60, high: 100 },
    investorMatchWeights: {
      sectorFit: 25,
      riskAppetite: 20,
      esgAlignment: 20,
      icvPotential: 20,
      returnProfile: 15,
    },
  };

  it("accepts a complete, valid payload with bands in order and weights totaling 100", () => {
    expect(InvestmentPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects risk bands that are out of ascending order", () => {
    const result = InvestmentPayloadSchema.safeParse({
      ...validPayload,
      riskBands: { low: 50, moderate: 40, elevated: 60, high: 100 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects risk bands with two equal thresholds (low == moderate)", () => {
    const result = InvestmentPayloadSchema.safeParse({
      ...validPayload,
      riskBands: { low: 40, moderate: 40, elevated: 60, high: 100 },
    });
    expect(result.success).toBe(false);
  });

  it("allows elevated to equal high (the mockup's own <= on the last band)", () => {
    const result = InvestmentPayloadSchema.safeParse({
      ...validPayload,
      riskBands: { low: 20, moderate: 40, elevated: 100, high: 100 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects investor match weights that don't total 100", () => {
    const result = InvestmentPayloadSchema.safeParse({
      ...validPayload,
      investorMatchWeights: { ...validPayload.investorMatchWeights, returnProfile: 5 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid due diligence type", () => {
    const result = InvestmentPayloadSchema.safeParse({
      ...validPayload,
      dueDiligenceRequired: ["Not A Real DD Type"],
    });
    expect(result.success).toBe(false);
  });

  it("DEFAULT_INVESTMENT_PAYLOAD deliberately fails validation (all-zero risk bands)", () => {
    const result = InvestmentPayloadSchema.safeParse(DEFAULT_INVESTMENT_PAYLOAD);
    expect(result.success).toBe(false);
  });
});

describe("computeKpiAchievement", () => {
  it("computes achievement correctly when target is above baseline (increasing metric)", () => {
    // baseline 20, target 100, actual 60 -> (60-20)/(100-20)*100 = 50
    expect(computeKpiAchievement({ baseline: 20, target: 100, actual: 60 })).toBe(50);
  });

  it("computes achievement correctly when target is below baseline (decreasing metric)", () => {
    // baseline 100, target 20, actual 60 -> (100-60)/(100-20)*100 = 50
    expect(computeKpiAchievement({ baseline: 100, target: 20, actual: 60 })).toBe(50);
  });

  it("clamps negative achievement to 0", () => {
    expect(computeKpiAchievement({ baseline: 20, target: 100, actual: -50 })).toBe(0);
  });

  it("returns 100 when target equals baseline and actual matches", () => {
    expect(computeKpiAchievement({ baseline: 50, target: 50, actual: 50 })).toBe(100);
  });

  it("returns 0 when target equals baseline and actual doesn't match", () => {
    expect(computeKpiAchievement({ baseline: 50, target: 50, actual: 40 })).toBe(0);
  });
});

describe("SustainabilityPayloadSchema", () => {
  const validPayload: SustainabilityPayloadInput = {
    enabled: true,
    authority: "National Sustainability Authority",
    reportingPeriod: "Annual",
    baselineYear: "2020",
    netZeroTarget: "2050",
    interimTarget: "2035",
    renewableTarget: "30% by 2030",
    scopesRequired: ["Scope 1", "Scope 2"],
    scope3Optional: true,
    emissionUnit: "tCO2e",
    emissionFactorSource: "IPCC",
    kpis: [
      { name: "Renewable share", unit: "%", baseline: 10, baselineYear: "2020", target: 30, targetYear: "2030", actual: 18 },
    ],
    frameworks: ["GRI", "TCFD"],
    greenProcurement: {
      esgThreshold: 60,
      minSupplierEsgScore: 50,
      requireGhgDisclosure: true,
      requireGreenCertification: false,
      sustainableMaterials: ["Recycled steel"],
    },
    circularEconomy: { enabled: true, wasteDiversionTarget: 40, categories: ["Construction waste"] },
    carbonMarket: { offsetsAllowed: true, creditsAllowed: false, maxOffsetPctOfTarget: 20, registries: ["Verra"] },
    verification: {
      required: true,
      assuranceLevel: "Limited Assurance",
      thresholdSpend: 5,
      evidenceRequired: ["Emissions report"],
    },
    greenInvestment: { enabled: true, minEsgImpactForIncentive: 50 },
  };

  it("accepts a complete, valid payload", () => {
    expect(SustainabilityPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("accepts the all-empty default payload (no weight-sum rule to fail here)", () => {
    expect(SustainabilityPayloadSchema.safeParse(DEFAULT_SUSTAINABILITY_PAYLOAD).success).toBe(true);
  });

  it("rejects an invalid GHG scope", () => {
    const result = SustainabilityPayloadSchema.safeParse({
      ...validPayload,
      scopesRequired: ["Scope 4"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid reporting framework", () => {
    const result = SustainabilityPayloadSchema.safeParse({
      ...validPayload,
      frameworks: ["Not A Real Framework"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid assurance level", () => {
    const result = SustainabilityPayloadSchema.safeParse({
      ...validPayload,
      verification: { ...validPayload.verification, assuranceLevel: "Full Assurance" },
    });
    expect(result.success).toBe(false);
  });

  it("allows nullable free-text fields to be null", () => {
    const result = SustainabilityPayloadSchema.safeParse({
      ...validPayload,
      authority: null,
      interimTarget: null,
      renewableTarget: null,
      emissionUnit: null,
      emissionFactorSource: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("IcvPayloadSchema", () => {
  const validPayload: IcvPayloadInput = {
    enabled: true,
    scoreBand: { bronze: 30, silver: 50, gold: 70, platinum: 100 },
    obligationAllocation: [
      { sector: "Construction", micro: 15, small: 12, medium: 10, lcc: 18, riyada: 15 },
    ],
    templates: {
      fixedAssets: ["Machinery"],
      csrHeads: ["Education"],
      inDemandProducts: ["Steel pipes"],
      inDemandServices: ["Logistics"],
      capabilityDev: ["ISO training"],
    },
    contributionScore: {
      goods: { msmeMicro: 10, msmeSmall: 8 },
      csr: { infrastructure: 5 },
    },
    spendTargets: {
      procGoodsTotal: 100,
      procGoodsNationalPct: 40,
      procGoodsIntlPct: 30,
      procGoodsMsmePct: 15,
      procGoodsLccPct: 10,
      procGoodsNatProdPct: 5,
      procServicesTotal: 50,
      procServicesNationalPct: 40,
      procServicesIntlPct: 30,
      procServicesMsmePct: 20,
      procServicesLccPct: 10,
      investNewTotal: 200,
      investMsmePct: 20,
      investLargePct: 60,
      investLccPct: 20,
      workforceSalaryTotal: 80,
      workforceNationalPct: 50,
      workforceNationalisationPct: 40,
      supplierDevTotal: 30,
      supplierDevMicroPct: 25,
      supplierDevSmallPct: 25,
      supplierDevMediumPct: 25,
      supplierDevLargePct: 25,
    },
  };

  it("accepts a complete, valid payload with score bands in ascending order", () => {
    expect(IcvPayloadSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects score bands out of ascending order", () => {
    const result = IcvPayloadSchema.safeParse({
      ...validPayload,
      scoreBand: { bronze: 50, silver: 30, gold: 70, platinum: 100 },
    });
    expect(result.success).toBe(false);
  });

  it("allows gold to equal platinum (the mockup's own <= on the last band)", () => {
    const result = IcvPayloadSchema.safeParse({
      ...validPayload,
      scoreBand: { bronze: 30, silver: 50, gold: 100, platinum: 100 },
    });
    expect(result.success).toBe(true);
  });

  it("DEFAULT_ICV_PAYLOAD deliberately fails validation (all-zero score bands)", () => {
    expect(IcvPayloadSchema.safeParse(DEFAULT_ICV_PAYLOAD).success).toBe(false);
  });

  it("contributionScore accepts an arbitrary dictionary shape, not a fixed key set", () => {
    const result = IcvPayloadSchema.safeParse({
      ...validPayload,
      contributionScore: { anyTab: { anyCategory: 42 } },
    });
    expect(result.success).toBe(true);
  });

  it("ICV_SCORE_LABELS has no em dashes in any label (converted to colons)", () => {
    const allLabels = Object.values(ICV_SCORE_LABELS).flatMap((tab) => Object.values(tab));
    expect(allLabels.some((l) => l.includes("\u2014"))).toBe(false);
  });
});
