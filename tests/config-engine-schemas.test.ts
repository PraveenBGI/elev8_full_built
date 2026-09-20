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
import { CountryIdentitySchema, toCountryRow, HsCodeSchema, TaxSettingsSchema, FreeTradeAgreementSchema } from "@/lib/modules/config-engine/schemas";

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
  it("accepts a valid HS code entry", () => {
    const result = HsCodeSchema.safeParse({
      code: "8501.10",
      description: "Electric motors",
      category: "Electronics & ICT",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty code", () => {
    const result = HsCodeSchema.safeParse({
      code: "",
      description: "Electric motors",
      category: "Electronics & ICT",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a category outside the fixed list", () => {
    const result = HsCodeSchema.safeParse({
      code: "8501.10",
      description: "Electric motors",
      category: "Not A Real Category",
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
