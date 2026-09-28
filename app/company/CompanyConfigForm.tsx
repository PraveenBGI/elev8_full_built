"use client";

/**
 * app/company/CompanyConfigForm.tsx
 *
 * Three sections built so far: Business Identity, Role, Trade Intent --
 * the first 3 of the mockup's 7 Enterprise Configuration steps.
 * Geography & Corridors, Target Market Priority, Business Objectives
 * (Goals), and Commercial Terms are not built yet -- listed honestly at
 * the bottom, same pattern as every other module's "coming next" list.
 */

import { useState, useTransition } from "react";
import {
  COMPANY_TYPES,
  COMPANY_SECTORS,
  COMPANY_SIZES,
  ANNUAL_REVENUE_BANDS,
  TRADE_EXPERIENCE_BANDS,
  PRIMARY_ROLES,
  ADDITIONAL_ROLES,
  SELL_INTENTS,
  BUY_INTENTS,
  type CompanyIdentityInput,
  type CompanyRoleInput,
  type CompanyTradeIntentInput,
  type CompanyGeographyInput,
  MARKET_TIERS,
  MARKET_TIER_LABELS,
  type CompanyMarketPriorityInput,
  GOALS,
  type CompanyGoalsInput,
  CURRENCIES,
  PAYMENT_TERMS,
  INCOTERM_LIST,
  CONTRACT_PREF_OPTIONS,
  DEAL_SIZES,
  DEFAULT_COMMERCIAL_TERMS,
  type CompanyCommercialTermsInput,
  PILLAR_META,
  type PillarIdLiteral,
  computePillarSignals,
  DEFAULT_PILLAR_SELECTION,
  type CompanyPillarSelectionInput,
  REQUIRED_CERTIFICATIONS,
  TRADE_REQUIREMENTS,
  DOC_CHECKLIST,
  DEFAULT_COMPLIANCE,
  SECTOR_CERT_SUGGEST,
  type CompanyComplianceInput,
  type CompanyDocChecklistInput,
  TIMELINE_HORIZONS,
  RFQ_OPPORTUNITY_TYPES,
  DEFAULT_RFQ_PREFS,
  type CompanyRfqPrefsInput,
  TENDER_TYPES,
  DEFAULT_TENDER_PREFS,
  type CompanyTenderPrefsInput,
  CONTRACT_TYPES,
  CONTRACT_DURATIONS,
  DEFAULT_CONTRACT_PREFS,
  type CompanyContractPrefsInput,
  BUDGET_BANDS,
  DEFAULT_B2B_PRODUCTS,
  type CompanyB2BProductsInput,
  BUYER_TYPES,
  COMPANY_SIZE_BANDS,
  TYPICAL_CONTRACT_VALUES,
  BUYER_SEGMENTS,
  DEFAULT_BUYER_TARGET,
  type CompanyBuyerTargetInput,
  type CompanyBuyerSegmentsInput,
  SUPPLIER_TYPES,
  ESG_RATING_REQUIREMENTS,
  SUPPLIER_FILTERS,
  DEFAULT_SUPPLIER_TARGET,
  type CompanySupplierTargetInput,
  type CompanySupplierFiltersInput,
  type CompanyImportProductsInput,
  type CompanyImportCorridorsInput,
  IMPORT_CORRIDOR_INCOTERMS,
  DEMAND_LEVELS,
  RISK_LEVELS,
  type CompanyImportLogisticsInput,
  DEFAULT_IMPORT_LOGISTICS,
  SHIP_MODES,
  SHIPMENT_VOLUMES,
  type ImportRequirementInput,
  DEFAULT_IMPORT_REQ,
  IMPORT_SUPPLIER_TYPES,
  IMPORT_REQ_INCOTERMS,
  type CompanyExportProductsInput,
  type CompanyExportCorridorsInput,
  type CompanyExportLogisticsInput,
  type CompanyExportPrefsInput,
} from "@/lib/modules/company-config/schemas";
import type { CompanyRow } from "@/lib/modules/company-config/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import {
  getRealStateNamesForCountryAction,
  listCompanyAuditLogAction,
  saveCompanyB2BProductsAction,
  saveCompanyBuyerTargetAction,
  saveCompanyCommercialTermsAction,
  saveCompanyComplianceAction,
  saveCompanyContractPrefsAction,
  saveCompanyDocChecklistAction,
  saveCompanyExportCorridorsAction,
  saveCompanyExportLogisticsAction,
  saveCompanyExportPrefsAction,
  saveCompanyExportProductsAction,
  saveCompanyGeographyAction,
  saveCompanyGoalsAction,
  saveCompanyIdentityAction,
  saveCompanyImportCorridorsAction,
  saveCompanyImportLogisticsAction,
  saveCompanyImportPrefsAction,
  saveCompanyImportProductsAction,
  saveCompanyMarketPriorityAction,
  saveCompanyPillarSelectionAction,
  saveCompanyRfqPrefsAction,
  saveCompanyRiskReviewedAction,
  saveCompanyRoleAction,
  saveCompanySupplierTargetAction,
  saveCompanyTenderPrefsAction,
  saveCompanyTradeIntentAction,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        {label}
        {optional && (
          <span className="font-normal" style={{ color: "var(--elev8-g400)" }}>
            {" "}
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-1 text-[12px] transition-colors"
      style={{
        background: on ? "#E6F5EC" : "var(--elev8-g100)",
        color: on ? "var(--elev8-green-dk)" : "var(--elev8-g600)",
      }}
    >
      {label}
    </button>
  );
}

function IdentitySection({
  company,
  countries,
}: {
  company: CompanyRow;
  countries: { id: string; name: string }[];
}) {
  const [form, setForm] = useState<CompanyIdentityInput>({
    name: company.name,
    countryId: company.country_id,
    type: company.type as CompanyIdentityInput["type"],
    sector: company.sector as CompanyIdentityInput["sector"],
    size: company.size as CompanyIdentityInput["size"],
    yearEstablished: company.year_established,
    annualRevenue: company.annual_revenue as CompanyIdentityInput["annualRevenue"],
    tradeYears: company.trade_years as CompanyIdentityInput["tradeYears"],
    countriesExportedTo: company.countries_exported_to,
    differentiator: company.differentiator,
    prefLevel: company.pref_level,
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveCompanyIdentityAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        This establishes your business context. elev8 uses this to
        localize governance, trade rules, and opportunity data from the
        very first screen.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name">
          <input
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {fieldErrors.name?.map((m) => (
            <p key={m} className="text-xs" style={{ color: "var(--elev8-red)" }}>
              {m}
            </p>
          ))}
        </Field>
        <Field label="Registration country">
          <select
            className={inputClass}
            value={form.countryId}
            onChange={(e) => setForm((f) => ({ ...f, countryId: e.target.value }))}
          >
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Company type">
          <select
            className={inputClass}
            value={form.type ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                type: e.target.value ? (e.target.value as CompanyIdentityInput["type"]) : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {COMPANY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Primary sector">
          <select
            className={inputClass}
            value={form.sector ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sector: e.target.value ? (e.target.value as CompanyIdentityInput["sector"]) : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {COMPANY_SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Company size">
          <select
            className={inputClass}
            value={form.size ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                size: e.target.value ? (e.target.value as CompanyIdentityInput["size"]) : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Year established">
          <input
            className={inputClass}
            type="number"
            value={form.yearEstablished ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                yearEstablished: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </Field>
        <Field label="Annual revenue">
          <select
            className={inputClass}
            value={form.annualRevenue ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                annualRevenue: e.target.value
                  ? (e.target.value as CompanyIdentityInput["annualRevenue"])
                  : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {ANNUAL_REVENUE_BANDS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Trade experience">
          <select
            className={inputClass}
            value={form.tradeYears ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                tradeYears: e.target.value
                  ? (e.target.value as CompanyIdentityInput["tradeYears"])
                  : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {TRADE_EXPERIENCE_BANDS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Countries exported to">
          <input
            className={inputClass}
            type="number"
            min={0}
            value={form.countriesExportedTo ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                countriesExportedTo: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="What makes your company different?" optional>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="e.g. Only CEPA-certified steel pipe manufacturer in Oman with API 5L certification"
            value={form.differentiator ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, differentiator: e.target.value || null }))}
          />
        </Field>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Preference level, who does this configuration apply to?
        </label>
        <div className="flex flex-wrap gap-2">
          <Chip
            label="Company-wide, applies to all my users"
            on={form.prefLevel === "company"}
            onClick={() => setForm((f) => ({ ...f, prefLevel: "company" }))}
          />
          <Chip
            label="Just for me, personal layer on top of company settings"
            on={form.prefLevel === "individual"}
            onClick={() => setForm((f) => ({ ...f, prefLevel: "individual" }))}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function RoleSection({ company }: { company: CompanyRow }) {
  const [form, setForm] = useState<CompanyRoleInput>({
    primaryRole: (company.primary_role as CompanyRoleInput["primaryRole"]) ?? PRIMARY_ROLES[0],
    secondaryRoles: company.secondary_roles as CompanyRoleInput["secondaryRoles"],
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveCompanyRoleAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  const secondaryOptions = [...PRIMARY_ROLES, ...ADDITIONAL_ROLES].filter(
    (r) => r !== form.primaryRole,
  );

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        One company can be several things at once, e.g. Seller + Exporter
        + Buyer. Choose the role that best describes your main activity
        first, then add any secondary roles.
      </p>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        Primary role
      </label>
      <div className="mb-5 flex flex-wrap gap-2">
        {PRIMARY_ROLES.map((r) => (
          <Chip
            key={r}
            label={r}
            on={form.primaryRole === r}
            onClick={() => setForm((f) => ({ ...f, primaryRole: r }))}
          />
        ))}
      </div>

      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        Secondary roles (optional)
      </label>
      <div className="flex flex-wrap gap-2">
        {secondaryOptions.map((r) => (
          <Chip
            key={r}
            label={r}
            on={form.secondaryRoles.includes(r)}
            onClick={() =>
              setForm((f) => ({
                ...f,
                secondaryRoles: f.secondaryRoles.includes(r)
                  ? f.secondaryRoles.filter((x) => x !== r)
                  : [...f.secondaryRoles, r],
              }))
            }
          />
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function TradeIntentSection({ company }: { company: CompanyRow }) {
  const [form, setForm] = useState<CompanyTradeIntentInput>({
    sellIntents: company.sell_intents as CompanyTradeIntentInput["sellIntents"],
    buyIntents: company.buy_intents as CompanyTradeIntentInput["buyIntents"],
    strategicIntent: company.strategic_intent,
    existingPartners: company.existing_partners,
    competitors: company.competitors,
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveCompanyTradeIntentAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Tell gatewAI what you want on the selling side and the buying
        side, one company can want both at once.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            I want to, sell / export
          </label>
          <div className="flex flex-wrap gap-2">
            {SELL_INTENTS.map((x) => (
              <Chip
                key={x}
                label={x}
                on={form.sellIntents.includes(x)}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    sellIntents: f.sellIntents.includes(x)
                      ? f.sellIntents.filter((i) => i !== x)
                      : [...f.sellIntents, x],
                  }))
                }
              />
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            I want to, buy / import
          </label>
          <div className="flex flex-wrap gap-2">
            {BUY_INTENTS.map((x) => (
              <Chip
                key={x}
                label={x}
                on={form.buyIntents.includes(x)}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    buyIntents: f.buyIntents.includes(x)
                      ? f.buyIntents.filter((i) => i !== x)
                      : [...f.buyIntents, x],
                  }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Field label="Strategic intent statement" optional>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="e.g. Grow export share of X into Y, while sourcing Z from..."
            value={form.strategicIntent ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, strategicIntent: e.target.value || null }))}
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Existing partners" optional>
          <input
            className={inputClass}
            placeholder="e.g. Oman Steel Co, TZ Water Authority"
            value={form.existingPartners ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, existingPartners: e.target.value || null }))}
          />
        </Field>
        <Field label="Main competitors" optional>
          <input
            className={inputClass}
            value={form.competitors ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, competitors: e.target.value || null }))}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function GeographySection({
  company,
  countries,
  initialHomeCountryStates,
}: {
  company: CompanyRow;
  countries: { id: string; name: string }[];
  initialHomeCountryStates: string[];
}) {
  const [form, setForm] = useState<CompanyGeographyInput>({
    homeCountryId: company.home_country_id ?? "",
    homeState: company.home_state,
    homeCity: company.home_city,
    corridorCountryIds: company.corridor_country_ids,
    corridorStates: company.corridor_states,
  });
  const [homeCountryStates, setHomeCountryStates] = useState(initialHomeCountryStates);
  const [corridorStatesByCountry, setCorridorStatesByCountry] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleHomeCountryChange(countryId: string) {
    setForm((f) => ({ ...f, homeCountryId: countryId, homeState: null }));
    const states = await getRealStateNamesForCountryAction(countryId);
    setHomeCountryStates(states);
  }

  async function toggleCorridorCountry(countryId: string) {
    const isSelected = form.corridorCountryIds.includes(countryId);
    if (isSelected) {
      setForm((f) => ({
        ...f,
        corridorCountryIds: f.corridorCountryIds.filter((c) => c !== countryId),
      }));
      return;
    }
    setForm((f) => ({ ...f, corridorCountryIds: [...f.corridorCountryIds, countryId] }));
    if (!(countryId in corridorStatesByCountry)) {
      const states = await getRealStateNamesForCountryAction(countryId);
      setCorridorStatesByCountry((prev) => ({ ...prev, [countryId]: states }));
    }
  }

  function toggleCorridorState(countryId: string, stateName: string) {
    setForm((f) => {
      const current = f.corridorStates[countryId] ?? [];
      const next = current.includes(stateName)
        ? current.filter((s) => s !== stateName)
        : [...current, stateName];
      return { ...f, corridorStates: { ...f.corridorStates, [countryId]: next } };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveCompanyGeographyAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  const corridorCountries = countries.filter((c) => c.id !== form.homeCountryId);

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Home country, then state cluster, then every international
        corridor you follow, each with its own state clusters. You can
        follow more than one corridor at once.
      </p>

      <Field label="Home country">
        <select
          className={inputClass}
          value={form.homeCountryId}
          onChange={(e) => handleHomeCountryChange(e.target.value)}
        >
          <option value="">Choose...</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      {form.homeCountryId && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="State / governorate">
            {homeCountryStates.length > 0 ? (
              <select
                className={inputClass}
                value={form.homeState ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, homeState: e.target.value || null }))}
              >
                <option value="">Choose a state...</option>
                {homeCountryStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className={inputClass}
                placeholder="e.g. Region name"
                value={form.homeState ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, homeState: e.target.value || null }))}
              />
            )}
          </Field>
          <Field label="City">
            <input
              className={inputClass}
              value={form.homeCity ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, homeCity: e.target.value || null }))}
            />
          </Field>
        </div>
      )}

      <div className="mt-6">
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          International corridors you follow
        </label>
        <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
          Selecting a country unlocks its own state cluster picker below.
        </p>
        <div className="flex flex-wrap gap-2">
          {corridorCountries.map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              on={form.corridorCountryIds.includes(c.id)}
              onClick={() => toggleCorridorCountry(c.id)}
            />
          ))}
        </div>
      </div>

      {form.corridorCountryIds.map((countryId) => {
        const country = countries.find((c) => c.id === countryId);
        const availableStates = corridorStatesByCountry[countryId] ?? [];
        const selected = form.corridorStates[countryId] ?? [];
        return (
          <div
            key={countryId}
            className="mt-4 rounded-md border p-3"
            style={{ borderColor: "var(--elev8-g200)", background: "var(--elev8-g50)" }}
          >
            <div className="mb-2 text-[13px] font-medium" style={{ color: "var(--elev8-ink)" }}>
              {country?.name ?? countryId} - state clusters
            </div>
            {availableStates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableStates.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    on={selected.includes(s)}
                    onClick={() => toggleCorridorState(countryId, s)}
                  />
                ))}
              </div>
            ) : (
              <CorridorFreeTextStates
                selected={selected}
                onChange={(next) =>
                  setForm((f) => ({ ...f, corridorStates: { ...f.corridorStates, [countryId]: next } }))
                }
              />
            )}
          </div>
        );
      })}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function CorridorFreeTextStates({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const value = draft.trim();
    if (!value) return;
    onChange([...selected, value]);
    setDraft("");
  }

  return (
    <div>
      <p className="mb-2 text-[12px]" style={{ color: "var(--elev8-g400)" }}>
        No governorate data for this country, add states manually.
      </p>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px]"
              style={{ background: "#E6F5EC", color: "var(--elev8-green-dk)" }}
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(selected.filter((_, idx) => idx !== i))}
                className="opacity-70 hover:opacity-100"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="e.g. Region name"
          value={draft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--elev8-blue)" }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function MarketPrioritySection({
  company,
  countries,
}: {
  company: CompanyRow;
  countries: { id: string; name: string }[];
}) {
  const countryList = [company.home_country_id, ...company.corridor_country_ids].filter(
    (id): id is string => Boolean(id),
  );

  const [form, setForm] = useState<CompanyMarketPriorityInput>({
    marketPriority: company.market_priority as CompanyMarketPriorityInput["marketPriority"],
    statePriority: company.state_priority as CompanyMarketPriorityInput["statePriority"],
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveCompanyMarketPriorityAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  if (countryList.length === 0) {
    return (
      <p className="text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        No corridor countries yet. Go back to Geography &amp; Corridors
        and follow at least one country first.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        A combined view across your home market and every corridor you
        follow, this drives the country-match weighting in gatewAI&apos;s
        scoring. States you selected on Geography &amp; Corridors get
        their own priority ranking below.
      </p>

      <div className="mb-5 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr style={{ background: "var(--elev8-g50)" }}>
              <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Country</th>
              <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Role</th>
              <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {countryList.map((countryId) => {
              const country = countries.find((c) => c.id === countryId);
              const role = countryId === company.home_country_id ? "Home Market" : "Corridor";
              const current = form.marketPriority[countryId] ?? "medium";
              return (
                <tr key={countryId} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-3 py-2 font-medium">{country?.name ?? countryId}</td>
                  <td className="px-3 py-2">{role}</td>
                  <td className="px-3 py-2">
                    <select
                      className={inputClass}
                      value={current}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          marketPriority: {
                            ...f.marketPriority,
                            [countryId]: e.target.value as CompanyMarketPriorityInput["marketPriority"][string],
                          },
                        }))
                      }
                    >
                      {MARKET_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {MARKET_TIER_LABELS[tier]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {countryList
        .filter((countryId) => (company.corridor_states[countryId] ?? []).length > 0)
        .map((countryId) => {
          const country = countries.find((c) => c.id === countryId);
          const states = company.corridor_states[countryId] ?? [];
          return (
            <div
              key={countryId}
              className="mb-4 overflow-hidden rounded-md border"
              style={{ borderColor: "var(--elev8-g200)" }}
            >
              <div className="px-3 py-2 text-[13px] font-medium" style={{ color: "var(--elev8-ink)" }}>
                {country?.name ?? countryId}, state priority
              </div>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>State / Governorate</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((stateName) => {
                    const current = form.statePriority[countryId]?.[stateName] ?? "medium";
                    return (
                      <tr key={stateName} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                        <td className="px-3 py-2">{stateName}</td>
                        <td className="px-3 py-2">
                          <select
                            className={inputClass}
                            value={current}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                statePriority: {
                                  ...f.statePriority,
                                  [countryId]: {
                                    ...f.statePriority[countryId],
                                    [stateName]: e.target.value as CompanyMarketPriorityInput["marketPriority"][string],
                                  },
                                },
                              }))
                            }
                          >
                            {MARKET_TIERS.map((tier) => (
                              <option key={tier} value={tier}>
                                {MARKET_TIER_LABELS[tier]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function GoalsSection({ company }: { company: CompanyRow }) {
  const [form, setForm] = useState<CompanyGoalsInput>({
    goals: company.goals as CompanyGoalsInput["goals"],
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveCompanyGoalsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Choose your top 3 priorities. gatewAI weighs matching, alerts,
        and recommendations toward these objectives above everything
        else.
      </p>
      <div className="flex flex-wrap gap-2">
        {GOALS.map((g) => (
          <Chip
            key={g}
            label={g}
            on={form.goals.includes(g)}
            onClick={() =>
              setForm((f) => ({
                ...f,
                goals: f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g],
              }))
            }
          />
        ))}
      </div>
      <p className="mt-3 text-[12px]" style={{ color: "var(--elev8-g400)" }}>
        {form.goals.length} of 3 selected
      </p>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || form.goals.length === 0}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function CommercialTermsSection({ company }: { company: CompanyRow }) {
  const [form, setForm] = useState<CompanyCommercialTermsInput>({
    ...DEFAULT_COMMERCIAL_TERMS,
    ...(company.commercial_terms as Partial<CompanyCommercialTermsInput>),
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveCompanyCommercialTermsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Currency, payment terms, Incoterms, and deal size preferences.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Primary currency">
          <select
            className={inputClass}
            value={form.currency ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                currency: e.target.value ? (e.target.value as CompanyCommercialTermsInput["currency"]) : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment term">
          <select
            className={inputClass}
            value={form.payment ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                payment: e.target.value ? (e.target.value as CompanyCommercialTermsInput["payment"]) : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {PAYMENT_TERMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Other accepted currencies
        </label>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <Chip
              key={c}
              label={c}
              on={form.acceptedCurrencies.includes(c)}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  acceptedCurrencies: f.acceptedCurrencies.includes(c)
                    ? f.acceptedCurrencies.filter((x) => x !== c)
                    : [...f.acceptedCurrencies, c],
                }))
              }
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Deal size (band)
        </label>
        <div className="flex flex-wrap gap-2">
          {DEAL_SIZES.map(([val, label]) => (
            <Chip
              key={val}
              label={label}
              on={form.dealSize === val}
              onClick={() => setForm((f) => ({ ...f, dealSize: val }))}
            />
          ))}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Deal size, min" optional>
          <input
            className={inputClass}
            placeholder="e.g. USD 100,000"
            value={form.dealMin ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, dealMin: e.target.value || null }))}
          />
        </Field>
        <Field label="Deal size, max" optional>
          <input
            className={inputClass}
            placeholder="e.g. USD 2,000,000"
            value={form.dealMax ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, dealMax: e.target.value || null }))}
          />
        </Field>
      </div>

      <div className="mb-5">
        <Field label="Preferred contract structure">
          <select
            className={inputClass}
            value={form.contractPref ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                contractPref: e.target.value
                  ? (e.target.value as CompanyCommercialTermsInput["contractPref"])
                  : null,
              }))
            }
          >
            <option value="">Choose...</option>
            {CONTRACT_PREF_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Preferred Incoterms
        </label>
        <div className="flex flex-wrap gap-2">
          {INCOTERM_LIST.map((t) => (
            <Chip
              key={t}
              label={t}
              on={form.incotermsPreferred.includes(t)}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  incotermsPreferred: f.incotermsPreferred.includes(t)
                    ? f.incotermsPreferred.filter((x) => x !== t)
                    : [...f.incotermsPreferred, t],
                }))
              }
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Also accepted
        </label>
        <div className="flex flex-wrap gap-2">
          {INCOTERM_LIST.map((t) => (
            <Chip
              key={t}
              label={t}
              on={form.incotermsAccepted.includes(t)}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  incotermsAccepted: f.incotermsAccepted.includes(t)
                    ? f.incotermsAccepted.filter((x) => x !== t)
                    : [...f.incotermsAccepted, t],
                }))
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function PillarSelectionSection({ company }: { company: CompanyRow }) {
  const allRoles = [company.primary_role, ...company.secondary_roles].filter(
    (r): r is string => Boolean(r),
  );
  const signals = computePillarSignals(allRoles, company.goals);

  const stored = company.pillar_selection as Partial<CompanyPillarSelectionInput>;
  const [form, setForm] = useState<CompanyPillarSelectionInput>(() => {
    const initial: CompanyPillarSelectionInput = { ...DEFAULT_PILLAR_SELECTION, ...stored };
    // Auto-apply the AI recommendation only once, the first time this
    // section is opened -- matches the mockup's own _pillarsAutoApplied
    // guard exactly. autoApplied only becomes true in the database once
    // the user explicitly saves, so opening this before their first
    // save safely re-applies (nothing manual to lose yet); after a real
    // save, the stored autoApplied: true skips this branch entirely and
    // never overwrites their manual on/off choices. Computed as the
    // initial state itself, not via an effect, since this is derived
    // initial state rather than a sync with an external system.
    if (initial.autoApplied) return initial;

    const pillars = [...initial.pillars];
    const pillarSource = { ...initial.pillarSource };
    for (const key of Object.keys(signals)) {
      const pillarId = key as PillarIdLiteral;
      if (!pillars.includes(pillarId)) {
        pillars.push(pillarId);
        pillarSource[pillarId] = "ai";
      }
    }
    return { ...initial, pillars, pillarSource, autoApplied: true };
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function togglePillar(pillarId: PillarIdLiteral) {
    setForm((f) => {
      const isOn = f.pillars.includes(pillarId);
      return {
        ...f,
        pillars: isOn ? f.pillars.filter((p) => p !== pillarId) : [...f.pillars, pillarId],
        pillarSource: isOn
          ? f.pillarSource
          : { ...f.pillarSource, [pillarId]: "manual" },
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveCompanyPillarSelectionAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        gatewAI pre-selected pillars based on your role
        {allRoles.length > 1 ? "s" : ""} and objectives. Toggle any
        pillar on or off, your choices always win.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PILLAR_META.map((p) => {
          const isOn = form.pillars.includes(p.id);
          const source = form.pillarSource[p.id];
          const sig = signals[p.id] ?? 0;
          const confidence = sig >= 2 ? "High confidence" : sig === 1 ? "Medium confidence" : null;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePillar(p.id)}
              className="flex flex-col items-start gap-1.5 rounded-lg border p-4 text-left transition-colors"
              style={
                isOn
                  ? { borderColor: "var(--elev8-blue)", background: "#EEF4FC" }
                  : { borderColor: "var(--elev8-g200)", background: "white" }
              }
            >
              {source === "ai" && isOn && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                  style={{ background: "#E9F8EF", color: "#00874A" }}
                >
                  AI Suggested{confidence ? ` - ${confidence}` : ""}
                </span>
              )}
              {source === "manual" && isOn && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-medium"
                  style={{ background: "#EEF4FC", color: "var(--elev8-blue)" }}
                >
                  Your Pick
                </span>
              )}
              <span className="text-[13.5px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
                {p.label}
              </span>
              <span className="text-[12px]" style={{ color: "var(--elev8-g500)" }}>
                {p.desc}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || form.pillars.length === 0}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className="text-sm"
            style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function ComplianceSection({ company }: { company: CompanyRow }) {
  const stored = company.compliance as Partial<CompanyComplianceInput>;
  const [form, setForm] = useState<CompanyComplianceInput>({ ...DEFAULT_COMPLIANCE, ...stored });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Frozen once at mount rather than called during render (Date.now()
  // is impure and React's own rules flag calling it in the render
  // body) -- an expiry badge doesn't need live, per-render precision.
  const [now] = useState(() => Date.now());

  const suggestions = (company.sector ? SECTOR_CERT_SUGGEST[company.sector] : undefined)?.filter(
    (c) => !form.certsHeld.includes(c),
  );

  function toggle(
    field: "requiredCerts" | "tradeRequirements" | "certsHeld",
    value: (typeof REQUIRED_CERTIFICATIONS)[number] | (typeof TRADE_REQUIREMENTS)[number],
  ) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value as never)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyComplianceAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            Required certifications
          </label>
          <p className="mb-2 text-[11.5px]" style={{ color: "var(--elev8-g400)" }}>
            What you expect from partners
          </p>
          <div className="flex flex-wrap gap-2">
            {REQUIRED_CERTIFICATIONS.map((c) => (
              <Chip key={c} label={c} on={form.requiredCerts.includes(c)} onClick={() => toggle("requiredCerts", c)} />
            ))}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            Trade &amp; regulatory requirements
          </label>
          <div className="flex flex-wrap gap-2">
            {TRADE_REQUIREMENTS.map((t) => (
              <Chip key={t} label={t} on={form.tradeRequirements.includes(t)} onClick={() => toggle("tradeRequirements", t)} />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-1 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          My certifications
        </label>
        <p className="mb-2 text-[11.5px]" style={{ color: "var(--elev8-g400)" }}>
          Powers your credibility score and tender eligibility. Add expiry dates so gatewAI can alert you before they lapse.
        </p>
        {suggestions && suggestions.length > 0 && (
          <div
            className="mb-3 flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
            style={{ background: "#E9F8EF", borderColor: "#CDEFDA" }}
          >
            <span className="text-[12px] font-semibold" style={{ color: "#00874A" }}>
              Common for {company.sector}:
            </span>
            {suggestions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggle("certsHeld", c)}
                className="rounded-md border px-2.5 py-1 text-[11px] font-medium"
                style={{ borderColor: "#CDEFDA", color: "#00874A", background: "white" }}
              >
                + {c}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {REQUIRED_CERTIFICATIONS.map((c) => (
            <Chip key={c} label={c} on={form.certsHeld.includes(c)} onClick={() => toggle("certsHeld", c)} />
          ))}
        </div>
        {form.certsHeld.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "var(--elev8-g100)" }}>
            {form.certsHeld.map((c) => {
              const exp = form.certExpiry[c] ?? "";
              const days = exp ? Math.round((new Date(exp).getTime() - now) / 86400000) : null;
              const badge =
                days === null
                  ? null
                  : days < 30
                    ? { label: "Expiring soon", bg: "#FDECEC", fg: "var(--elev8-red)" }
                    : days < 90
                      ? { label: "Monitor", bg: "#FFF7E6", fg: "#8A6A1A" }
                      : { label: "Valid", bg: "#E9F8EF", fg: "#00874A" };
              return (
                <div key={c} className="flex items-center gap-3">
                  <span className="min-w-[180px] text-[13px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
                    {c}
                  </span>
                  <input
                    type="date"
                    className={inputClass}
                    style={{ maxWidth: 170 }}
                    value={exp}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, certExpiry: { ...f.certExpiry, [c]: e.target.value } }))
                    }
                  />
                  {badge && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11.5px] font-medium"
                      style={{ background: badge.bg, color: badge.fg }}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function RiskIntelligenceSection({ company }: { company: CompanyRow }) {
  const [reviewed, setReviewed] = useState(company.risk_reviewed);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  function handleReview() {
    startTransition(async () => {
      const result = await saveCompanyRiskReviewedAction(true);
      if (result.ok) {
        setReviewed(true);
        setStatus("saved");
      } else {
        setStatus("error");
      }
    });
  }

  return (
    <div>
      <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Never read demand or margin without risk context. Every corridor
        carries a country, currency, payment and logistics risk rating.
      </p>
      <div
        className="mb-4 rounded-md border px-4 py-6 text-center text-[13px]"
        style={{ borderColor: "var(--elev8-g200)", color: "var(--elev8-g400)" }}
      >
        Add trade corridors (Import/Export Pillar) to see risk ratings
        here. This table has nothing to show yet.
      </div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          ["High Demand / Low Risk", "Prioritise"],
          ["High Demand / High Risk", "Manage closely"],
          ["Low Demand / Low Risk", "Stable / maintain"],
          ["Low Demand / High Risk", "Review or exit"],
        ].map(([label, sub]) => (
          <div key={label} className="rounded-md border px-3 py-2.5" style={{ borderColor: "var(--elev8-g100)" }}>
            <p className="text-[13px] font-medium" style={{ color: "var(--elev8-ink)" }}>
              {label}
            </p>
            <p className="text-[12px]" style={{ color: "var(--elev8-g500)" }}>
              {sub}
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={handleReview}
        disabled={isPending || reviewed}
        className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: reviewed ? "var(--elev8-green)" : "var(--elev8-blue)" }}
      >
        {reviewed ? "Reviewed" : isPending ? "Saving..." : "Mark as reviewed"}
      </button>
      {status === "error" && (
        <p className="mt-2 text-sm" style={{ color: "var(--elev8-red)" }}>
          Save failed.
        </p>
      )}
    </div>
  );
}

function DocumentRoomSection({ company }: { company: CompanyRow }) {
  const [form, setForm] = useState<CompanyDocChecklistInput>({ docChecklist: company.doc_checklist as CompanyDocChecklistInput["docChecklist"] });
  const [auditLog, setAuditLog] = useState<Awaited<ReturnType<typeof listCompanyAuditLogAction>> | null>(null);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadAuditLog() {
    startTransition(async () => {
      const log = await listCompanyAuditLogAction();
      setAuditLog(log);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyDocChecklistAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
        loadAuditLog();
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Status of the trade documents behind your active corridors and
        contracts, plus a timestamped record of every change you save.
      </p>

      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        Required documents by trade type
      </label>
      <div className="mb-5 flex flex-wrap gap-2">
        {DOC_CHECKLIST.map((d) => (
          <Chip
            key={d}
            label={d}
            on={form.docChecklist.includes(d)}
            onClick={() =>
              setForm((f) => ({
                ...f,
                docChecklist: f.docChecklist.includes(d)
                  ? f.docChecklist.filter((x) => x !== d)
                  : [...f.docChecklist, d],
              }))
            }
          />
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Configuration audit trail
        </label>
        <button type="button" onClick={loadAuditLog} className="text-[12px] font-medium" style={{ color: "var(--elev8-blue)" }}>
          {auditLog ? "Refresh" : "Show"}
        </button>
      </div>
      {auditLog && (
        <div className="mb-5 space-y-1.5 rounded-md border p-3" style={{ borderColor: "var(--elev8-g100)" }}>
          {auditLog.length === 0 ? (
            <p className="text-[12.5px] italic" style={{ color: "var(--elev8-g400)" }}>
              No changes recorded yet.
            </p>
          ) : (
            auditLog.map((entry) => (
              <div key={entry.id} className="flex gap-3 text-[12px]">
                <span style={{ color: "var(--elev8-g400)" }}>{new Date(entry.created_at).toLocaleString()}</span>
                <span className="font-medium" style={{ color: "var(--elev8-ink)" }}>{entry.section}</span>
                <span style={{ color: "var(--elev8-g500)" }}>{entry.detail}</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function RfqPrefsSection({ company }: { company: CompanyRow }) {
  const stored = company.procurement_rfq_prefs as Partial<CompanyRfqPrefsInput>;
  const [form, setForm] = useState<CompanyRfqPrefsInput>({ ...DEFAULT_RFQ_PREFS, ...stored });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyRfqPrefsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Every RFQ you respond to or publish follows the same path, from
        requirement to contract. Configure your preferences to control
        what reaches the top of your feed.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Categories">
          <input
            className={inputClass}
            placeholder="e.g. Renewable Energy, Electrical"
            value={form.categories ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, categories: e.target.value || null }))}
          />
        </Field>
        <Field label="Countries">
          <input
            className={inputClass}
            placeholder="e.g. Oman, Saudi Arabia"
            value={form.countries ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, countries: e.target.value || null }))}
          />
        </Field>
        <Field label="RFQ size (budget)">
          <input
            className={inputClass}
            placeholder="e.g. USD 50K-2M"
            value={form.size ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, size: e.target.value || null }))}
          />
        </Field>
        <Field label="Opportunity type">
          <select
            className={inputClass}
            value={form.oppType ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, oppType: (e.target.value || null) as CompanyRfqPrefsInput["oppType"] }))
            }
          >
            <option value="">Choose...</option>
            {RFQ_OPPORTUNITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Target response timeline">
          <select
            className={inputClass}
            value={form.timeline ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, timeline: (e.target.value || null) as CompanyRfqPrefsInput["timeline"] }))
            }
          >
            <option value="">Choose...</option>
            {TIMELINE_HORIZONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function TenderPrefsSection({ company }: { company: CompanyRow }) {
  const stored = company.procurement_tender_prefs as Partial<CompanyTenderPrefsInput>;
  const [form, setForm] = useState<CompanyTenderPrefsInput>({ ...DEFAULT_TENDER_PREFS, ...stored });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyTenderPrefsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Tender types, sectors and value ranges relevant to you.
      </p>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        Tender types
      </label>
      <div className="mb-4 flex flex-wrap gap-2">
        {TENDER_TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            on={form.types.includes(t)}
            onClick={() =>
              setForm((f) => ({
                ...f,
                types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
              }))
            }
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Tender sector">
          <input
            className={inputClass}
            placeholder="e.g. Energy"
            value={form.sector ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value || null }))}
          />
        </Field>
        <Field label="Countries">
          <input
            className={inputClass}
            placeholder="e.g. Oman, Saudi Arabia"
            value={form.countries ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, countries: e.target.value || null }))}
          />
        </Field>
        <Field label="Tender value (budget)">
          <input
            className={inputClass}
            placeholder="e.g. USD 250K-10M"
            value={form.value ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value || null }))}
          />
        </Field>
        <Field label="Product categories">
          <input
            className={inputClass}
            placeholder="e.g. Solar, Electrical, EPC"
            value={form.categories ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, categories: e.target.value || null }))}
          />
        </Field>
        <Field label="Target submission timeline">
          <select
            className={inputClass}
            value={form.timeline ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, timeline: (e.target.value || null) as CompanyTenderPrefsInput["timeline"] }))
            }
          >
            <option value="">Choose...</option>
            {TIMELINE_HORIZONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function ContractPrefsSection({ company }: { company: CompanyRow }) {
  const stored = company.procurement_contract_prefs as Partial<CompanyContractPrefsInput>;
  const [form, setForm] = useState<CompanyContractPrefsInput>({ ...DEFAULT_CONTRACT_PREFS, ...stored });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyContractPrefsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Contract types and value ranges you want to pursue.
      </p>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        Contract types
      </label>
      <div className="mb-4 flex flex-wrap gap-2">
        {CONTRACT_TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            on={form.types.includes(t)}
            onClick={() =>
              setForm((f) => ({
                ...f,
                types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
              }))
            }
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Interested contract value (budget)">
          <input
            className={inputClass}
            placeholder="e.g. USD 100K-5M"
            value={form.value ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value || null }))}
          />
        </Field>
        <Field label="Duration">
          <select
            className={inputClass}
            value={form.duration ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, duration: (e.target.value || null) as CompanyContractPrefsInput["duration"] }))
            }
          >
            <option value="">Choose...</option>
            {CONTRACT_DURATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Preferred industries">
          <input
            className={inputClass}
            placeholder="e.g. Energy, Manufacturing"
            value={form.industries ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, industries: e.target.value || null }))}
          />
        </Field>
        <Field label="Target award timeline">
          <select
            className={inputClass}
            value={form.timeline ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, timeline: (e.target.value || null) as CompanyContractPrefsInput["timeline"] }))
            }
          >
            <option value="">Choose...</option>
            {TIMELINE_HORIZONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function B2BProductsSection({ company }: { company: CompanyRow }) {
  const stored = company.b2b_products as Partial<CompanyB2BProductsInput>;
  const [form, setForm] = useState<CompanyB2BProductsInput>({ ...DEFAULT_B2B_PRODUCTS, ...stored });
  const [sellDraft, setSellDraft] = useState({ cat: "", name: "", hs: "", country: "", moq: "", cert: "", budget: "", timeline: "" });
  const [sourceDraft, setSourceDraft] = useState({ cat: "", name: "", hs: "", price: "", lead: "", src: "", budget: "", timeline: "" });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addSell() {
    if (!sellDraft.name.trim()) return;
    setForm((f) => ({
      ...f,
      sell: [
        ...f.sell,
        {
          ...sellDraft,
          budget: (sellDraft.budget || null) as CompanyB2BProductsInput["sell"][number]["budget"],
          timeline: (sellDraft.timeline || null) as CompanyB2BProductsInput["sell"][number]["timeline"],
        },
      ],
    }));
    setSellDraft({ cat: "", name: "", hs: "", country: "", moq: "", cert: "", budget: "", timeline: "" });
  }

  function addSource() {
    if (!sourceDraft.name.trim()) return;
    setForm((f) => ({
      ...f,
      source: [
        ...f.source,
        {
          ...sourceDraft,
          budget: (sourceDraft.budget || null) as CompanyB2BProductsInput["source"][number]["budget"],
          timeline: (sourceDraft.timeline || null) as CompanyB2BProductsInput["source"][number]["timeline"],
        },
      ],
    }));
    setSourceDraft({ cat: "", name: "", hs: "", price: "", lead: "", src: "", budget: "", timeline: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyB2BProductsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Add what you sell and what you source for B2B trade. HS codes
        enable precision matching. Budget and target timeline per item
        tell gatewAI how aggressively to surface opportunities for it.
      </p>

      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        Products &amp; services I supply
      </label>
      {form.sell.length > 0 && (
        <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                {["Category", "Product", "HS", "Country", "MOQ", "Certs", "Budget", "Timeline", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium" style={{ color: "var(--elev8-g600)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.sell.map((p, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-2 py-1.5">{p.cat}</td>
                  <td className="px-2 py-1.5 font-semibold">{p.name}</td>
                  <td className="px-2 py-1.5 font-mono">{p.hs}</td>
                  <td className="px-2 py-1.5">{p.country}</td>
                  <td className="px-2 py-1.5">{p.moq}</td>
                  <td className="px-2 py-1.5">{p.cert}</td>
                  <td className="px-2 py-1.5">{p.budget ?? "-"}</td>
                  <td className="px-2 py-1.5">{p.timeline ?? "-"}</td>
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, sell: f.sell.filter((_, idx) => idx !== i) }))} style={{ color: "var(--elev8-red)" }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Category" value={sellDraft.cat} onChange={(e) => setSellDraft((d) => ({ ...d, cat: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 140 }} placeholder="Product" value={sellDraft.name} onChange={(e) => setSellDraft((d) => ({ ...d, name: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 90 }} placeholder="HS Code" value={sellDraft.hs} onChange={(e) => setSellDraft((d) => ({ ...d, hs: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 100 }} placeholder="Country" value={sellDraft.country} onChange={(e) => setSellDraft((d) => ({ ...d, country: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 80 }} placeholder="MOQ" value={sellDraft.moq} onChange={(e) => setSellDraft((d) => ({ ...d, moq: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Certs" value={sellDraft.cert} onChange={(e) => setSellDraft((d) => ({ ...d, cert: e.target.value }))} />
        <select className={inputClass} style={{ maxWidth: 120 }} value={sellDraft.budget} onChange={(e) => setSellDraft((d) => ({ ...d, budget: e.target.value }))}>
          <option value="">Budget...</option>
          {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className={inputClass} style={{ maxWidth: 160 }} value={sellDraft.timeline} onChange={(e) => setSellDraft((d) => ({ ...d, timeline: e.target.value }))}>
          <option value="">Timeline...</option>
          {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={addSell} className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>+ Add</button>
      </div>

      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        Products I want to buy
      </label>
      {form.source.length > 0 && (
        <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                {["Category", "Product", "HS", "Price", "Lead time", "Source", "Budget", "Timeline", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium" style={{ color: "var(--elev8-g600)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {form.source.map((p, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-2 py-1.5">{p.cat}</td>
                  <td className="px-2 py-1.5 font-semibold">{p.name}</td>
                  <td className="px-2 py-1.5 font-mono">{p.hs}</td>
                  <td className="px-2 py-1.5">{p.price}</td>
                  <td className="px-2 py-1.5">{p.lead}</td>
                  <td className="px-2 py-1.5">{p.src}</td>
                  <td className="px-2 py-1.5">{p.budget ?? "-"}</td>
                  <td className="px-2 py-1.5">{p.timeline ?? "-"}</td>
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => setForm((f) => ({ ...f, source: f.source.filter((_, idx) => idx !== i) }))} style={{ color: "var(--elev8-red)" }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-2">
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Category" value={sourceDraft.cat} onChange={(e) => setSourceDraft((d) => ({ ...d, cat: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 140 }} placeholder="Product" value={sourceDraft.name} onChange={(e) => setSourceDraft((d) => ({ ...d, name: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 90 }} placeholder="HS Code" value={sourceDraft.hs} onChange={(e) => setSourceDraft((d) => ({ ...d, hs: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 100 }} placeholder="Target Price" value={sourceDraft.price} onChange={(e) => setSourceDraft((d) => ({ ...d, price: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 90 }} placeholder="Lead Time" value={sourceDraft.lead} onChange={(e) => setSourceDraft((d) => ({ ...d, lead: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Source" value={sourceDraft.src} onChange={(e) => setSourceDraft((d) => ({ ...d, src: e.target.value }))} />
        <select className={inputClass} style={{ maxWidth: 120 }} value={sourceDraft.budget} onChange={(e) => setSourceDraft((d) => ({ ...d, budget: e.target.value }))}>
          <option value="">Budget...</option>
          {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className={inputClass} style={{ maxWidth: 160 }} value={sourceDraft.timeline} onChange={(e) => setSourceDraft((d) => ({ ...d, timeline: e.target.value }))}>
          <option value="">Timeline...</option>
          {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={addSource} className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>+ Add</button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function TargetBuyersSection({ company }: { company: CompanyRow }) {
  const storedTarget = company.buyer_target as Partial<CompanyBuyerTargetInput>;
  const [target, setTarget] = useState<CompanyBuyerTargetInput>({ ...DEFAULT_BUYER_TARGET, ...storedTarget });
  const [segments, setSegments] = useState<string[]>(company.buyer_segments);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyBuyerTargetAction(target, {
        buyerSegments: segments as CompanyBuyerSegmentsInput["buyerSegments"],
      });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Build your ideal customer profile, gatewAI uses this to power
        Buyer Discovery and match RFQs to the right accounts.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Buyer country">
          <input className={inputClass} placeholder="e.g. Saudi Arabia" value={target.country ?? ""} onChange={(e) => setTarget((t) => ({ ...t, country: e.target.value || null }))} />
        </Field>
        <Field label="Buyer type">
          <select className={inputClass} value={target.type ?? ""} onChange={(e) => setTarget((t) => ({ ...t, type: (e.target.value || null) as CompanyBuyerTargetInput["type"] }))}>
            <option value="">Choose...</option>
            {BUYER_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Industry / procurement interest">
          <input className={inputClass} placeholder="e.g. Energy, Oil & Gas" value={target.industry ?? ""} onChange={(e) => setTarget((t) => ({ ...t, industry: e.target.value || null }))} />
        </Field>
        <Field label="Company size">
          <select className={inputClass} value={target.size ?? ""} onChange={(e) => setTarget((t) => ({ ...t, size: (e.target.value || null) as CompanyBuyerTargetInput["size"] }))}>
            <option value="">Choose...</option>
            {COMPANY_SIZE_BANDS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Typical contract value">
          <select className={inputClass} value={target.contractValue ?? ""} onChange={(e) => setTarget((t) => ({ ...t, contractValue: (e.target.value || null) as CompanyBuyerTargetInput["contractValue"] }))}>
            <option value="">Choose...</option>
            {TYPICAL_CONTRACT_VALUES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Buyer acquisition budget">
          <select className={inputClass} value={target.budget ?? ""} onChange={(e) => setTarget((t) => ({ ...t, budget: (e.target.value || null) as CompanyBuyerTargetInput["budget"] }))}>
            <option value="">Choose...</option>
            {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Target timeline to first deal">
          <select className={inputClass} value={target.timeline ?? ""} onChange={(e) => setTarget((t) => ({ ...t, timeline: (e.target.value || null) as CompanyBuyerTargetInput["timeline"] }))}>
            <option value="">Choose...</option>
            {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Buyer segments
        </label>
        <div className="flex flex-wrap gap-2">
          {BUYER_SEGMENTS.map((s) => (
            <Chip key={s} label={s} on={segments.includes(s)} onClick={() => setSegments((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function TargetSuppliersSection({ company }: { company: CompanyRow }) {
  const storedTarget = company.supplier_target as Partial<CompanySupplierTargetInput>;
  const [target, setTarget] = useState<CompanySupplierTargetInput>({ ...DEFAULT_SUPPLIER_TARGET, ...storedTarget });
  const [filters, setFilters] = useState<string[]>(company.supplier_filters);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanySupplierTargetAction(target, {
        supplierFilters: filters as CompanySupplierFiltersInput["supplierFilters"],
      });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Configure supplier qualification criteria, gatewAI uses this to
        power Supplier Discovery and pre-qualify RFQ responses.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Supplier type">
          <select className={inputClass} value={target.type ?? ""} onChange={(e) => setTarget((t) => ({ ...t, type: (e.target.value || null) as CompanySupplierTargetInput["type"] }))}>
            <option value="">Choose...</option>
            {SUPPLIER_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Preferred countries">
          <input className={inputClass} placeholder="e.g. China, India, Germany" value={target.countries ?? ""} onChange={(e) => setTarget((t) => ({ ...t, countries: e.target.value || null }))} />
        </Field>
        <Field label="Required certifications">
          <input className={inputClass} placeholder="e.g. ISO 9001, ISO 14001, IEC" value={target.certs ?? ""} onChange={(e) => setTarget((t) => ({ ...t, certs: e.target.value || null }))} />
        </Field>
        <Field label="ESG rating requirement">
          <select className={inputClass} value={target.esg ?? ""} onChange={(e) => setTarget((t) => ({ ...t, esg: (e.target.value || null) as CompanySupplierTargetInput["esg"] }))}>
            <option value="">Choose...</option>
            {ESG_RATING_REQUIREMENTS.map((e2) => <option key={e2} value={e2}>{e2}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-3">
        <Field label="Capability requirements">
          <textarea
            className={inputClass}
            style={{ minHeight: 70 }}
            placeholder="Minimum production capacity, delivery capability, export experience..."
            value={target.capability ?? ""}
            onChange={(e) => setTarget((t) => ({ ...t, capability: e.target.value || null }))}
          />
        </Field>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Supplier onboarding budget">
          <select className={inputClass} value={target.budget ?? ""} onChange={(e) => setTarget((t) => ({ ...t, budget: (e.target.value || null) as CompanySupplierTargetInput["budget"] }))}>
            <option value="">Choose...</option>
            {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Target qualification timeline">
          <select className={inputClass} value={target.timeline ?? ""} onChange={(e) => setTarget((t) => ({ ...t, timeline: (e.target.value || null) as CompanySupplierTargetInput["timeline"] }))}>
            <option value="">Choose...</option>
            {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
          Supplier qualification filters
        </label>
        <div className="flex flex-wrap gap-2">
          {SUPPLIER_FILTERS.map((f) => (
            <Chip key={f} label={f} on={filters.includes(f)} onClick={() => setFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function ImportProductsSection({ company }: { company: CompanyRow }) {
  const [items, setItems] = useState(company.import_products as CompanyImportProductsInput["importProducts"]);
  const [draft, setDraft] = useState({ cat: "", name: "", hs: "", price: "", lead: "", src: "", budget: "", timeline: "" });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addItem() {
    if (!draft.name.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        ...draft,
        budget: (draft.budget || null) as CompanyImportProductsInput["importProducts"][number]["budget"],
        timeline: (draft.timeline || null) as CompanyImportProductsInput["importProducts"][number]["timeline"],
      },
    ]);
    setDraft({ cat: "", name: "", hs: "", price: "", lead: "", src: "", budget: "", timeline: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyImportProductsAction({ importProducts: items });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Add what you want to source or import. HS codes enable precision
        matching with suppliers.
      </p>
      {items.length > 0 && (
        <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                {["Category", "Product", "HS", "Price", "Lead time", "Source", "Budget", "Timeline", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium" style={{ color: "var(--elev8-g600)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-2 py-1.5">{p.cat}</td>
                  <td className="px-2 py-1.5 font-semibold">{p.name}</td>
                  <td className="px-2 py-1.5 font-mono">{p.hs}</td>
                  <td className="px-2 py-1.5">{p.price}</td>
                  <td className="px-2 py-1.5">{p.lead}</td>
                  <td className="px-2 py-1.5">{p.src}</td>
                  <td className="px-2 py-1.5">{p.budget ?? "-"}</td>
                  <td className="px-2 py-1.5">{p.timeline ?? "-"}</td>
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} style={{ color: "var(--elev8-red)" }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Category" value={draft.cat} onChange={(e) => setDraft((d) => ({ ...d, cat: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 140 }} placeholder="Product" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 90 }} placeholder="HS Code" value={draft.hs} onChange={(e) => setDraft((d) => ({ ...d, hs: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 100 }} placeholder="Target Price" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 90 }} placeholder="Lead Time" value={draft.lead} onChange={(e) => setDraft((d) => ({ ...d, lead: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Source" value={draft.src} onChange={(e) => setDraft((d) => ({ ...d, src: e.target.value }))} />
        <select className={inputClass} style={{ maxWidth: 120 }} value={draft.budget} onChange={(e) => setDraft((d) => ({ ...d, budget: e.target.value }))}>
          <option value="">Budget...</option>
          {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className={inputClass} style={{ maxWidth: 160 }} value={draft.timeline} onChange={(e) => setDraft((d) => ({ ...d, timeline: e.target.value }))}>
          <option value="">Timeline...</option>
          {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={addItem} className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>+ Add</button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function ImportCorridorsSection({ company }: { company: CompanyRow }) {
  const [corridors, setCorridors] = useState(company.import_corridors as CompanyImportCorridorsInput["importCorridors"]);
  const [draft, setDraft] = useState({
    o: "", d: "", incoterm: "FOB", port: "", products: "", duty: "", freight: "", transit: "",
    demand: "Medium", risk: "Medium", budget: "", timeline: "",
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addCorridor() {
    if (!draft.o.trim() || !draft.d.trim()) return;
    setCorridors((prev) => [
      ...prev,
      {
        o: draft.o,
        d: draft.d,
        incoterm: draft.incoterm as CompanyImportCorridorsInput["importCorridors"][number]["incoterm"],
        products: draft.products || "-",
        port: draft.port || `${draft.o} to ${draft.d}`,
        duty: Number(draft.duty) || 0,
        freight: Number(draft.freight) || 0,
        transit: Number(draft.transit) || 0,
        demand: draft.demand as CompanyImportCorridorsInput["importCorridors"][number]["demand"],
        risk: draft.risk as CompanyImportCorridorsInput["importCorridors"][number]["risk"],
        budget: (draft.budget || null) as CompanyImportCorridorsInput["importCorridors"][number]["budget"],
        timeline: (draft.timeline || null) as CompanyImportCorridorsInput["importCorridors"][number]["timeline"],
      },
    ]);
    setDraft({ o: "", d: "", incoterm: "FOB", port: "", products: "", duty: "", freight: "", transit: "", demand: "Medium", risk: "Medium", budget: "", timeline: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyImportCorridorsAction({ importCorridors: corridors });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Define origin to destination import routes with products, ports,
        Incoterms, duty, freight, transit time, demand, risk, budget and
        target timeline, the strongest signal for logistics-aware
        matching.
      </p>
      {corridors.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {corridors.map((c, i) => (
            <div key={i} className="rounded-md border p-3" style={{ borderColor: "var(--elev8-g200)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{ color: "var(--elev8-ink)" }}>{c.o} to {c.d}</span>
                <button type="button" onClick={() => setCorridors((prev) => prev.filter((_, idx) => idx !== i))} style={{ color: "var(--elev8-red)" }}>x</button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full px-2 py-0.5" style={{ background: "var(--elev8-g100)" }}>{c.incoterm}</span>
                {c.duty > 0 && <span className="rounded-full px-2 py-0.5" style={{ background: "var(--elev8-g100)" }}>{c.duty}% duty</span>}
                {c.transit > 0 && <span className="rounded-full px-2 py-0.5" style={{ background: "var(--elev8-g100)" }}>{c.transit}d transit</span>}
                <span
                  className="rounded-full px-2 py-0.5 font-medium"
                  style={c.risk === "High" ? { background: "#FDECEC", color: "var(--elev8-red)" } : c.risk === "Low" ? { background: "#E9F8EF", color: "#00874A" } : { background: "#FFF7E6", color: "#8A6A1A" }}
                >
                  {c.risk} Risk
                </span>
              </div>
              <p className="mt-1.5 text-[12px]" style={{ color: "var(--elev8-g500)" }}>{c.products}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mb-5 rounded-md border p-3" style={{ borderColor: "var(--elev8-g200)", background: "var(--elev8-g50)" }}>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className={inputClass} placeholder="Origin, e.g. India" value={draft.o} onChange={(e) => setDraft((d) => ({ ...d, o: e.target.value }))} />
          <input className={inputClass} placeholder="Destination, e.g. Oman" value={draft.d} onChange={(e) => setDraft((d) => ({ ...d, d: e.target.value }))} />
        </div>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select className={inputClass} value={draft.incoterm} onChange={(e) => setDraft((d) => ({ ...d, incoterm: e.target.value }))}>
            {IMPORT_CORRIDOR_INCOTERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className={inputClass} placeholder="Port route, e.g. Mumbai to Sohar" value={draft.port} onChange={(e) => setDraft((d) => ({ ...d, port: e.target.value }))} />
        </div>
        <input className={inputClass} style={{ marginBottom: 8 }} placeholder="Products, e.g. Solar Modules, Inverters" value={draft.products} onChange={(e) => setDraft((d) => ({ ...d, products: e.target.value }))} />
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className={inputClass} type="number" placeholder="Customs duty %" value={draft.duty} onChange={(e) => setDraft((d) => ({ ...d, duty: e.target.value }))} />
          <input className={inputClass} type="number" placeholder="Freight cost (USD)" value={draft.freight} onChange={(e) => setDraft((d) => ({ ...d, freight: e.target.value }))} />
        </div>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className={inputClass} type="number" placeholder="Transit time (days)" value={draft.transit} onChange={(e) => setDraft((d) => ({ ...d, transit: e.target.value }))} />
          <select className={inputClass} value={draft.demand} onChange={(e) => setDraft((d) => ({ ...d, demand: e.target.value }))}>
            {DEMAND_LEVELS.map((l) => <option key={l} value={l}>{l} demand</option>)}
          </select>
        </div>
        <select className={inputClass} style={{ marginBottom: 8 }} value={draft.risk} onChange={(e) => setDraft((d) => ({ ...d, risk: e.target.value }))}>
          {RISK_LEVELS.map((l) => <option key={l} value={l}>{l} risk</option>)}
        </select>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select className={inputClass} value={draft.budget} onChange={(e) => setDraft((d) => ({ ...d, budget: e.target.value }))}>
            <option value="">Budget allocated...</option>
            {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={inputClass} value={draft.timeline} onChange={(e) => setDraft((d) => ({ ...d, timeline: e.target.value }))}>
            <option value="">Target timeline...</option>
            {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button type="button" onClick={addCorridor} className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>+ Add corridor</button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function ImportLogisticsSection({ company }: { company: CompanyRow }) {
  const stored = company.import_logistics as Partial<CompanyImportLogisticsInput>;
  const [form, setForm] = useState<CompanyImportLogisticsInput>({ ...DEFAULT_IMPORT_LOGISTICS, ...stored });
  const [portDraft, setPortDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addPort() {
    if (!portDraft.trim() || form.ports.includes(portDraft)) return;
    setForm((f) => ({ ...f, ports: [...f.ports, portDraft] }));
    setPortDraft("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyImportLogisticsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Ports, shipping mode, delivery regions and logistics partners
        for your import routes, used for logistics-aware opportunity
        matching.
      </p>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>Preferred load ports</label>
      {form.ports.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {form.ports.map((p) => (
            <span key={p} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px]" style={{ background: "#E6F5EC", color: "var(--elev8-green-dk)" }}>
              {p}
              <button type="button" onClick={() => setForm((f) => ({ ...f, ports: f.ports.filter((x) => x !== p) }))} className="opacity-70 hover:opacity-100">x</button>
            </span>
          ))}
        </div>
      )}
      <div className="mb-4 flex gap-2">
        <input className={inputClass} placeholder="e.g. Mumbai" value={portDraft} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPort(); } }} onChange={(e) => setPortDraft(e.target.value)} />
        <button type="button" onClick={addPort} className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>Add</button>
      </div>

      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>Shipping mode</label>
      <div className="mb-5 flex flex-wrap gap-2">
        {SHIP_MODES.map((m) => (
          <Chip key={m} label={m} on={form.shipModes.includes(m)} onClick={() => setForm((f) => ({ ...f, shipModes: f.shipModes.includes(m) ? f.shipModes.filter((x) => x !== m) : [...f.shipModes, m] }))} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Preferred delivery regions">
          <input className={inputClass} placeholder="e.g. GCC, East Africa" value={form.regions ?? ""} onChange={(e) => setForm((f) => ({ ...f, regions: e.target.value || null }))} />
        </Field>
        <Field label="Preferred logistics partners">
          <input className={inputClass} placeholder="e.g. DHL, Maersk, Agility" value={form.partners ?? ""} onChange={(e) => setForm((f) => ({ ...f, partners: e.target.value || null }))} />
        </Field>
        <Field label="Typical shipment volume">
          <select className={inputClass} value={form.volume ?? ""} onChange={(e) => setForm((f) => ({ ...f, volume: (e.target.value || null) as CompanyImportLogisticsInput["volume"] }))}>
            <option value="">Choose...</option>
            {SHIPMENT_VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function ImportPrefsSection({ company }: { company: CompanyRow }) {
  const [countries, setCountries] = useState<string[]>(company.import_countries);
  const [countryDraft, setCountryDraft] = useState("");
  const storedReq = company.import_req as Partial<ImportRequirementInput>;
  const [req, setReq] = useState<ImportRequirementInput>({ ...DEFAULT_IMPORT_REQ, ...storedReq });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addCountry() {
    if (!countryDraft.trim() || countries.includes(countryDraft)) return;
    setCountries((prev) => [...prev, countryDraft]);
    setCountryDraft("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyImportPrefsAction({ importCountries: countries, importReq: req });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Preferred sourcing markets and the requirement detail gatewAI
        uses to match suppliers.
      </p>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>Preferred sourcing countries</label>
      {countries.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {countries.map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px]" style={{ background: "#E6F5EC", color: "var(--elev8-green-dk)" }}>
              {c}
              <button type="button" onClick={() => setCountries((prev) => prev.filter((x) => x !== c))} className="opacity-70 hover:opacity-100">x</button>
            </span>
          ))}
        </div>
      )}
      <div className="mb-5 flex gap-2">
        <input className={inputClass} placeholder="e.g. Turkey" value={countryDraft} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCountry(); } }} onChange={(e) => setCountryDraft(e.target.value)} />
        <button type="button" onClick={addCountry} className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>Add</button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Preferred supplier type">
          <select className={inputClass} value={req.supplierType ?? ""} onChange={(e) => setReq((r) => ({ ...r, supplierType: (e.target.value || null) as ImportRequirementInput["supplierType"] }))}>
            <option value="">Choose...</option>
            {IMPORT_SUPPLIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="MOQ">
          <input className={inputClass} placeholder="e.g. 500 units" value={req.moq ?? ""} onChange={(e) => setReq((r) => ({ ...r, moq: e.target.value || null }))} />
        </Field>
        <Field label="Target price">
          <input className={inputClass} placeholder="e.g. USD 210 / unit" value={req.price ?? ""} onChange={(e) => setReq((r) => ({ ...r, price: e.target.value || null }))} />
        </Field>
        <Field label="Lead time">
          <input className={inputClass} placeholder="e.g. 45-60 days" value={req.lead ?? ""} onChange={(e) => setReq((r) => ({ ...r, lead: e.target.value || null }))} />
        </Field>
        <Field label="Required certifications">
          <input className={inputClass} placeholder="e.g. IEC 62109, CE" value={req.certs ?? ""} onChange={(e) => setReq((r) => ({ ...r, certs: e.target.value || null }))} />
        </Field>
        <Field label="Incoterm">
          <select className={inputClass} value={req.incoterm ?? ""} onChange={(e) => setReq((r) => ({ ...r, incoterm: (e.target.value || null) as ImportRequirementInput["incoterm"] }))}>
            <option value="">Choose...</option>
            {IMPORT_REQ_INCOTERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Sourcing budget">
          <select className={inputClass} value={req.budget ?? ""} onChange={(e) => setReq((r) => ({ ...r, budget: (e.target.value || null) as ImportRequirementInput["budget"] }))}>
            <option value="">Choose...</option>
            {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Target sourcing timeline">
          <select className={inputClass} value={req.timeline ?? ""} onChange={(e) => setReq((r) => ({ ...r, timeline: (e.target.value || null) as ImportRequirementInput["timeline"] }))}>
            <option value="">Choose...</option>
            {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}

function ExportProductsSection({ company }: { company: CompanyRow }) {
  const [items, setItems] = useState(company.export_products as CompanyExportProductsInput["exportProducts"]);
  const [draft, setDraft] = useState({ cat: "", name: "", hs: "", country: "", moq: "", cert: "", budget: "", timeline: "" });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addItem() {
    if (!draft.name.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        ...draft,
        budget: (draft.budget || null) as CompanyExportProductsInput["exportProducts"][number]["budget"],
        timeline: (draft.timeline || null) as CompanyExportProductsInput["exportProducts"][number]["timeline"],
      },
    ]);
    setDraft({ cat: "", name: "", hs: "", country: "", moq: "", cert: "", budget: "", timeline: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyExportProductsAction({ exportProducts: items });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Add what you sell or export. HS codes enable precision matching
        with buyers.
      </p>
      {items.length > 0 && (
        <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                {["Category", "Product", "HS", "Country", "MOQ", "Certs", "Budget", "Timeline", ""].map((h) => (
                  <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium" style={{ color: "var(--elev8-g600)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-2 py-1.5">{p.cat}</td>
                  <td className="px-2 py-1.5 font-semibold">{p.name}</td>
                  <td className="px-2 py-1.5 font-mono">{p.hs}</td>
                  <td className="px-2 py-1.5">{p.country}</td>
                  <td className="px-2 py-1.5">{p.moq}</td>
                  <td className="px-2 py-1.5">{p.cert}</td>
                  <td className="px-2 py-1.5">{p.budget ?? "-"}</td>
                  <td className="px-2 py-1.5">{p.timeline ?? "-"}</td>
                  <td className="px-2 py-1.5">
                    <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} style={{ color: "var(--elev8-red)" }}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Category" value={draft.cat} onChange={(e) => setDraft((d) => ({ ...d, cat: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 140 }} placeholder="Product" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 90 }} placeholder="HS Code" value={draft.hs} onChange={(e) => setDraft((d) => ({ ...d, hs: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 100 }} placeholder="Country" value={draft.country} onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 80 }} placeholder="MOQ" value={draft.moq} onChange={(e) => setDraft((d) => ({ ...d, moq: e.target.value }))} />
        <input className={inputClass} style={{ maxWidth: 110 }} placeholder="Certs" value={draft.cert} onChange={(e) => setDraft((d) => ({ ...d, cert: e.target.value }))} />
        <select className={inputClass} style={{ maxWidth: 120 }} value={draft.budget} onChange={(e) => setDraft((d) => ({ ...d, budget: e.target.value }))}>
          <option value="">Budget...</option>
          {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className={inputClass} style={{ maxWidth: 160 }} value={draft.timeline} onChange={(e) => setDraft((d) => ({ ...d, timeline: e.target.value }))}>
          <option value="">Timeline...</option>
          {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" onClick={addItem} className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>+ Add</button>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--elev8-blue)" }}>
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>{statusMessage}</p>
        )}
      </div>
    </form>
  );
}

function ExportCorridorsSection({ company }: { company: CompanyRow }) {
  const [corridors, setCorridors] = useState(company.export_corridors as CompanyExportCorridorsInput["exportCorridors"]);
  const [draft, setDraft] = useState({
    o: "", d: "", incoterm: "FOB", port: "", products: "", duty: "", freight: "", transit: "",
    demand: "Medium", risk: "Medium", budget: "", timeline: "",
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addCorridor() {
    if (!draft.o.trim() || !draft.d.trim()) return;
    setCorridors((prev) => [
      ...prev,
      {
        o: draft.o,
        d: draft.d,
        incoterm: draft.incoterm as CompanyExportCorridorsInput["exportCorridors"][number]["incoterm"],
        products: draft.products || "-",
        port: draft.port || `${draft.o} to ${draft.d}`,
        duty: Number(draft.duty) || 0,
        freight: Number(draft.freight) || 0,
        transit: Number(draft.transit) || 0,
        demand: draft.demand as CompanyExportCorridorsInput["exportCorridors"][number]["demand"],
        risk: draft.risk as CompanyExportCorridorsInput["exportCorridors"][number]["risk"],
        budget: (draft.budget || null) as CompanyExportCorridorsInput["exportCorridors"][number]["budget"],
        timeline: (draft.timeline || null) as CompanyExportCorridorsInput["exportCorridors"][number]["timeline"],
      },
    ]);
    setDraft({ o: "", d: "", incoterm: "FOB", port: "", products: "", duty: "", freight: "", transit: "", demand: "Medium", risk: "Medium", budget: "", timeline: "" });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyExportCorridorsAction({ exportCorridors: corridors });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Define origin to destination export routes with products, ports,
        Incoterms, duty, freight, transit time, demand, risk, budget and
        target timeline, the strongest signal for logistics-aware
        matching.
      </p>
      {corridors.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {corridors.map((c, i) => (
            <div key={i} className="rounded-md border p-3" style={{ borderColor: "var(--elev8-g200)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold" style={{ color: "var(--elev8-ink)" }}>{c.o} to {c.d}</span>
                <button type="button" onClick={() => setCorridors((prev) => prev.filter((_, idx) => idx !== i))} style={{ color: "var(--elev8-red)" }}>x</button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full px-2 py-0.5" style={{ background: "var(--elev8-g100)" }}>{c.incoterm}</span>
                {c.duty > 0 && <span className="rounded-full px-2 py-0.5" style={{ background: "var(--elev8-g100)" }}>{c.duty}% duty</span>}
                {c.transit > 0 && <span className="rounded-full px-2 py-0.5" style={{ background: "var(--elev8-g100)" }}>{c.transit}d transit</span>}
                <span
                  className="rounded-full px-2 py-0.5 font-medium"
                  style={c.risk === "High" ? { background: "#FDECEC", color: "var(--elev8-red)" } : c.risk === "Low" ? { background: "#E9F8EF", color: "#00874A" } : { background: "#FFF7E6", color: "#8A6A1A" }}
                >
                  {c.risk} Risk
                </span>
              </div>
              <p className="mt-1.5 text-[12px]" style={{ color: "var(--elev8-g500)" }}>{c.products}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mb-5 rounded-md border p-3" style={{ borderColor: "var(--elev8-g200)", background: "var(--elev8-g50)" }}>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className={inputClass} placeholder="Origin, e.g. Oman" value={draft.o} onChange={(e) => setDraft((d) => ({ ...d, o: e.target.value }))} />
          <input className={inputClass} placeholder="Destination, e.g. Kenya" value={draft.d} onChange={(e) => setDraft((d) => ({ ...d, d: e.target.value }))} />
        </div>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select className={inputClass} value={draft.incoterm} onChange={(e) => setDraft((d) => ({ ...d, incoterm: e.target.value }))}>
            {IMPORT_CORRIDOR_INCOTERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className={inputClass} placeholder="Port route, e.g. Sohar to Mombasa" value={draft.port} onChange={(e) => setDraft((d) => ({ ...d, port: e.target.value }))} />
        </div>
        <input className={inputClass} style={{ marginBottom: 8 }} placeholder="Products, e.g. Solar Modules, Inverters" value={draft.products} onChange={(e) => setDraft((d) => ({ ...d, products: e.target.value }))} />
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className={inputClass} type="number" placeholder="Customs duty %" value={draft.duty} onChange={(e) => setDraft((d) => ({ ...d, duty: e.target.value }))} />
          <input className={inputClass} type="number" placeholder="Freight cost (USD)" value={draft.freight} onChange={(e) => setDraft((d) => ({ ...d, freight: e.target.value }))} />
        </div>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input className={inputClass} type="number" placeholder="Transit time (days)" value={draft.transit} onChange={(e) => setDraft((d) => ({ ...d, transit: e.target.value }))} />
          <select className={inputClass} value={draft.demand} onChange={(e) => setDraft((d) => ({ ...d, demand: e.target.value }))}>
            {DEMAND_LEVELS.map((l) => <option key={l} value={l}>{l} demand</option>)}
          </select>
        </div>
        <select className={inputClass} style={{ marginBottom: 8 }} value={draft.risk} onChange={(e) => setDraft((d) => ({ ...d, risk: e.target.value }))}>
          {RISK_LEVELS.map((l) => <option key={l} value={l}>{l} risk</option>)}
        </select>
        <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select className={inputClass} value={draft.budget} onChange={(e) => setDraft((d) => ({ ...d, budget: e.target.value }))}>
            <option value="">Budget allocated...</option>
            {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className={inputClass} value={draft.timeline} onChange={(e) => setDraft((d) => ({ ...d, timeline: e.target.value }))}>
            <option value="">Target timeline...</option>
            {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button type="button" onClick={addCorridor} className="rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>+ Add corridor</button>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--elev8-blue)" }}>
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>{statusMessage}</p>
        )}
      </div>
    </form>
  );
}

function ExportLogisticsSection({ company }: { company: CompanyRow }) {
  const stored = company.export_logistics as Partial<CompanyExportLogisticsInput>;
  const [form, setForm] = useState<CompanyExportLogisticsInput>({ ...DEFAULT_IMPORT_LOGISTICS, ...stored });
  const [portDraft, setPortDraft] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addPort() {
    if (!portDraft.trim() || form.ports.includes(portDraft)) return;
    setForm((f) => ({ ...f, ports: [...f.ports, portDraft] }));
    setPortDraft("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyExportLogisticsAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Ports, shipping mode, delivery regions and logistics partners
        for your export routes, used for logistics-aware opportunity
        matching.
      </p>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>Preferred load ports</label>
      {form.ports.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {form.ports.map((p) => (
            <span key={p} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px]" style={{ background: "#E6F5EC", color: "var(--elev8-green-dk)" }}>
              {p}
              <button type="button" onClick={() => setForm((f) => ({ ...f, ports: f.ports.filter((x) => x !== p) }))} className="opacity-70 hover:opacity-100">x</button>
            </span>
          ))}
        </div>
      )}
      <div className="mb-4 flex gap-2">
        <input className={inputClass} placeholder="e.g. Sohar" value={portDraft} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPort(); } }} onChange={(e) => setPortDraft(e.target.value)} />
        <button type="button" onClick={addPort} className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>Add</button>
      </div>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>Shipping mode</label>
      <div className="mb-5 flex flex-wrap gap-2">
        {SHIP_MODES.map((m) => (
          <Chip key={m} label={m} on={form.shipModes.includes(m)} onClick={() => setForm((f) => ({ ...f, shipModes: f.shipModes.includes(m) ? f.shipModes.filter((x) => x !== m) : [...f.shipModes, m] }))} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Preferred delivery regions">
          <input className={inputClass} placeholder="e.g. GCC, East Africa" value={form.regions ?? ""} onChange={(e) => setForm((f) => ({ ...f, regions: e.target.value || null }))} />
        </Field>
        <Field label="Preferred logistics partners">
          <input className={inputClass} placeholder="e.g. DHL, Maersk, Agility" value={form.partners ?? ""} onChange={(e) => setForm((f) => ({ ...f, partners: e.target.value || null }))} />
        </Field>
        <Field label="Typical shipment volume">
          <select className={inputClass} value={form.volume ?? ""} onChange={(e) => setForm((f) => ({ ...f, volume: (e.target.value || null) as CompanyExportLogisticsInput["volume"] }))}>
            <option value="">Choose...</option>
            {SHIPMENT_VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--elev8-blue)" }}>
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>{statusMessage}</p>
        )}
      </div>
    </form>
  );
}

function ExportPrefsSection({ company }: { company: CompanyRow }) {
  const [countries, setCountries] = useState<string[]>(company.export_countries);
  const [countryDraft, setCountryDraft] = useState("");
  const [tier, setTier] = useState<Record<string, string>>(company.export_tier);
  const [budget, setBudget] = useState<Record<string, string>>(company.export_budget);
  const [timeline, setTimeline] = useState<Record<string, string>>(company.export_timeline);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addCountry() {
    if (!countryDraft.trim() || countries.includes(countryDraft)) return;
    setCountries((prev) => [...prev, countryDraft]);
    setCountryDraft("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await saveCompanyExportPrefsAction({
        exportCountries: countries,
        exportTier: tier as CompanyExportPrefsInput["exportTier"],
        exportBudget: budget as CompanyExportPrefsInput["exportBudget"],
        exportTimeline: timeline as CompanyExportPrefsInput["exportTimeline"],
      });
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Preferred export countries, priority tier, and the budget and
        target timeline you want to push into each.
      </p>
      <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>Preferred export countries</label>
      {countries.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {countries.map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px]" style={{ background: "#E6F5EC", color: "var(--elev8-green-dk)" }}>
              {c}
              <button type="button" onClick={() => setCountries((prev) => prev.filter((x) => x !== c))} className="opacity-70 hover:opacity-100">x</button>
            </span>
          ))}
        </div>
      )}
      <div className="mb-5 flex gap-2">
        <input className={inputClass} placeholder="e.g. Kenya" value={countryDraft} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCountry(); } }} onChange={(e) => setCountryDraft(e.target.value)} />
        <button type="button" onClick={addCountry} className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: "var(--elev8-blue)" }}>Add</button>
      </div>

      {countries.length > 0 && (
        <div className="overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Country</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Priority tier</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Budget</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Target timeline</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((c) => (
                <tr key={c} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-3 py-2 font-semibold">{c}</td>
                  <td className="px-3 py-2">
                    <select className={inputClass} value={tier[c] ?? "medium"} onChange={(e) => setTier((t) => ({ ...t, [c]: e.target.value }))}>
                      {MARKET_TIERS.map((mt) => <option key={mt} value={mt}>{MARKET_TIER_LABELS[mt]}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputClass} value={budget[c] ?? ""} onChange={(e) => setBudget((b) => ({ ...b, [c]: e.target.value }))}>
                      <option value="">-</option>
                      {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select className={inputClass} value={timeline[c] ?? ""} onChange={(e) => setTimeline((t) => ({ ...t, [c]: e.target.value }))}>
                      <option value="">-</option>
                      {TIMELINE_HORIZONS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={isPending} className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" style={{ background: "var(--elev8-blue)" }}>
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p className="text-sm" style={{ color: status === "saved" ? "var(--elev8-green-dk)" : "var(--elev8-red)" }}>{statusMessage}</p>
        )}
      </div>
    </form>
  );
}

const UPCOMING_STEPS = ["Investment Pillar", "Sustainability Pillar", "ICV Pillar"];

export function CompanyConfigForm({
  company,
  countries,
  homeCountryStates,
}: {
  company: CompanyRow;
  countries: { id: string; name: string }[];
  homeCountryStates: string[];
}) {
  const enterpriseStepsDone = [
    Boolean(company.type && company.sector),
    Boolean(company.primary_role),
    company.sell_intents.length > 0 || company.buy_intents.length > 0,
    Boolean(company.home_country_id),
    Object.keys(company.market_priority).length > 0,
    company.goals.length > 0,
    Boolean((company.commercial_terms as { currency?: string })?.currency),
  ].filter(Boolean).length;
  const enterprisePercent = Math.round((enterpriseStepsDone / 7) * 100);

  return (
    <div className="max-w-[820px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        {company.name}
      </h1>
      <p className="mt-1.5 mb-5 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        Enterprise Configuration. What you set here shapes which
        opportunities, alerts, and recommendations gatewAI surfaces for
        your company.
      </p>

      <div
        className="mb-7 flex items-center gap-5 rounded-xl border bg-white p-4 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg viewBox="0 0 74 74" width="64" height="64">
            <circle cx="37" cy="37" r="33" fill="none" stroke="var(--elev8-g100)" strokeWidth="6" />
            <circle
              cx="37"
              cy="37"
              r="33"
              fill="none"
              stroke="var(--elev8-blue)"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 33}
              strokeDashoffset={2 * Math.PI * 33 - (enterprisePercent / 100) * 2 * Math.PI * 33}
              strokeLinecap="round"
              transform="rotate(-90 37 37)"
            />
          </svg>
          <span
            className="absolute text-[13px] font-semibold"
            style={{ color: "var(--elev8-ink)" }}
          >
            {enterprisePercent}%
          </span>
        </div>
        <div>
          <p className="text-[13.5px] font-medium" style={{ color: "var(--elev8-ink)" }}>
            {enterpriseStepsDone} of 7 Enterprise Configuration steps complete
          </p>
          <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--elev8-g500)" }}>
            {company.primary_role ? `${company.primary_role} - ` : ""}
            {company.goals.length} objective{company.goals.length === 1 ? "" : "s"} set,{" "}
            {company.corridor_country_ids.length} corridor{company.corridor_country_ids.length === 1 ? "" : "s"} followed
          </p>
        </div>
      </div>

      <div
        className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <SettingsGroup
          title="Business identity"
          summary={[company.type, company.sector].filter(Boolean).join(", ") || "Not set"}
          isComplete={Boolean(company.type && company.sector)}
          defaultOpen
        >
          <IdentitySection company={company} countries={countries} />
        </SettingsGroup>

        <SettingsGroup
          title="Role"
          summary={company.primary_role ?? "Not set"}
          isComplete={Boolean(company.primary_role)}
        >
          <RoleSection company={company} />
        </SettingsGroup>

        <SettingsGroup
          title="Trade intent"
          summary={
            [...company.sell_intents, ...company.buy_intents].length === 0
              ? "Not set"
              : `${company.sell_intents.length} sell, ${company.buy_intents.length} buy`
          }
          isComplete={company.sell_intents.length > 0 || company.buy_intents.length > 0}
        >
          <TradeIntentSection company={company} />
        </SettingsGroup>

        <SettingsGroup
          title="Geography and corridors"
          summary={
            company.home_country_id
              ? `${countries.find((c) => c.id === company.home_country_id)?.name ?? "Set"}, ${company.corridor_country_ids.length} corridors`
              : "Not set"
          }
          isComplete={Boolean(company.home_country_id)}
        >
          <GeographySection
            company={company}
            countries={countries}
            initialHomeCountryStates={homeCountryStates}
          />
        </SettingsGroup>

        <SettingsGroup
          title="Target market priority"
          summary={
            Object.keys(company.market_priority).length === 0
              ? "Not set"
              : `${Object.keys(company.market_priority).length} markets ranked`
          }
          isComplete={Object.keys(company.market_priority).length > 0}
        >
          <MarketPrioritySection company={company} countries={countries} />
        </SettingsGroup>

        <SettingsGroup
          title="Business objectives"
          summary={company.goals.length === 0 ? "Not set" : company.goals.join(", ")}
          isComplete={company.goals.length > 0}
        >
          <GoalsSection company={company} />
        </SettingsGroup>

        <SettingsGroup
          title="Commercial terms"
          summary={
            (company.commercial_terms as { currency?: string })?.currency
              ? `${(company.commercial_terms as { currency?: string }).currency}`
              : "Not set"
          }
          isComplete={Boolean((company.commercial_terms as { currency?: string })?.currency)}
        >
          <CommercialTermsSection company={company} />
        </SettingsGroup>

        <SettingsGroup
          title="Pillar selection"
          summary={
            (company.pillar_selection as { pillars?: string[] })?.pillars?.length
              ? `${(company.pillar_selection as { pillars?: string[] }).pillars!.length} of 8 active`
              : "Not set"
          }
          isComplete={Boolean(
            (company.pillar_selection as { pillars?: string[] })?.pillars?.length,
          )}
        >
          <PillarSelectionSection company={company} />
        </SettingsGroup>

        {(company.pillar_selection as { pillars?: string[] })?.pillars?.includes("governance") && (
          <>
            <SettingsGroup
              title="Governance: Compliance & Certs"
              summary={
                (company.compliance as { requiredCerts?: string[] })?.requiredCerts?.length
                  ? `${(company.compliance as { requiredCerts?: string[] }).requiredCerts!.length} required`
                  : "Not set"
              }
              isComplete={Boolean(
                (company.compliance as { requiredCerts?: string[] })?.requiredCerts?.length,
              )}
            >
              <ComplianceSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Governance: Risk Intelligence"
              summary={company.risk_reviewed ? "Reviewed" : "Not reviewed"}
              isComplete={company.risk_reviewed}
            >
              <RiskIntelligenceSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Governance: Document Room & Audit"
              summary={company.doc_checklist.length > 0 ? `${company.doc_checklist.length} document types` : "Not set"}
              isComplete={company.doc_checklist.length > 0}
            >
              <DocumentRoomSection company={company} />
            </SettingsGroup>
          </>
        )}

        {(company.pillar_selection as { pillars?: string[] })?.pillars?.includes("procurement") && (
          <>
            <SettingsGroup
              title="Procurement: RFQ Preferences"
              summary={
                (company.procurement_rfq_prefs as { categories?: string })?.categories ?? "Not set"
              }
              isComplete={Boolean(
                (company.procurement_rfq_prefs as { categories?: string })?.categories,
              )}
            >
              <RfqPrefsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Procurement: Tender Preferences"
              summary={
                (company.procurement_tender_prefs as { types?: string[] })?.types?.length
                  ? `${(company.procurement_tender_prefs as { types?: string[] }).types!.length} types`
                  : "Not set"
              }
              isComplete={Boolean(
                (company.procurement_tender_prefs as { types?: string[] })?.types?.length,
              )}
            >
              <TenderPrefsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Procurement: Contract Interests"
              summary={
                (company.procurement_contract_prefs as { types?: string[] })?.types?.length
                  ? `${(company.procurement_contract_prefs as { types?: string[] }).types!.length} types`
                  : "Not set"
              }
              isComplete={Boolean(
                (company.procurement_contract_prefs as { types?: string[] })?.types?.length,
              )}
            >
              <ContractPrefsSection company={company} />
            </SettingsGroup>
          </>
        )}

        {(company.pillar_selection as { pillars?: string[] })?.pillars?.includes("b2b") && (
          <>
            <SettingsGroup
              title="B2B: Products & Services"
              summary={
                (company.b2b_products as { sell?: unknown[]; source?: unknown[] })?.sell?.length ||
                (company.b2b_products as { sell?: unknown[]; source?: unknown[] })?.source?.length
                  ? `${(company.b2b_products as { sell?: unknown[] }).sell?.length ?? 0} sell, ${(company.b2b_products as { source?: unknown[] }).source?.length ?? 0} source`
                  : "Not set"
              }
              isComplete={Boolean(
                (company.b2b_products as { sell?: unknown[]; source?: unknown[] })?.sell?.length ||
                  (company.b2b_products as { sell?: unknown[]; source?: unknown[] })?.source?.length,
              )}
            >
              <B2BProductsSection company={company} />
            </SettingsGroup>

            {company.sell_intents.length > 0 && (
              <SettingsGroup
                title="B2B: Target Buyers"
                summary={company.buyer_segments.length > 0 ? `${company.buyer_segments.length} segments` : "Not set"}
                isComplete={company.buyer_segments.length > 0}
              >
                <TargetBuyersSection company={company} />
              </SettingsGroup>
            )}

            {company.buy_intents.length > 0 && (
              <SettingsGroup
                title="B2B: Target Suppliers"
                summary={company.supplier_filters.length > 0 ? `${company.supplier_filters.length} filters` : "Not set"}
                isComplete={company.supplier_filters.length > 0}
              >
                <TargetSuppliersSection company={company} />
              </SettingsGroup>
            )}
          </>
        )}

        {(company.pillar_selection as { pillars?: string[] })?.pillars?.includes("import") && (
          <>
            <SettingsGroup
              title="Import: Products & Services"
              summary={company.import_products.length > 0 ? `${company.import_products.length} sourcing needs` : "Not set"}
              isComplete={company.import_products.length > 0}
            >
              <ImportProductsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Import: Trade Corridors"
              summary={company.import_corridors.length > 0 ? `${company.import_corridors.length} corridors` : "Not set"}
              isComplete={company.import_corridors.length > 0}
            >
              <ImportCorridorsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Import: Logistics Preferences"
              summary={
                (company.import_logistics as { ports?: string[] })?.ports?.length
                  ? `${(company.import_logistics as { ports?: string[] }).ports!.length} ports`
                  : "Not set"
              }
              isComplete={Boolean((company.import_logistics as { ports?: string[] })?.ports?.length)}
            >
              <ImportLogisticsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Import: Sourcing Preferences"
              summary={company.import_countries.length > 0 ? `${company.import_countries.length} countries` : "Not set"}
              isComplete={company.import_countries.length > 0}
            >
              <ImportPrefsSection company={company} />
            </SettingsGroup>
          </>
        )}

        {(company.pillar_selection as { pillars?: string[] })?.pillars?.includes("export") && (
          <>
            <SettingsGroup
              title="Export: Products & Services"
              summary={company.export_products.length > 0 ? `${company.export_products.length} products` : "Not set"}
              isComplete={company.export_products.length > 0}
            >
              <ExportProductsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Export: Trade Corridors"
              summary={company.export_corridors.length > 0 ? `${company.export_corridors.length} corridors` : "Not set"}
              isComplete={company.export_corridors.length > 0}
            >
              <ExportCorridorsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Export: Logistics Preferences"
              summary={
                (company.export_logistics as { ports?: string[] })?.ports?.length
                  ? `${(company.export_logistics as { ports?: string[] }).ports!.length} ports`
                  : "Not set"
              }
              isComplete={Boolean((company.export_logistics as { ports?: string[] })?.ports?.length)}
            >
              <ExportLogisticsSection company={company} />
            </SettingsGroup>

            <SettingsGroup
              title="Export: Market Preferences"
              summary={company.export_countries.length > 0 ? `${company.export_countries.length} markets` : "Not set"}
              isComplete={company.export_countries.length > 0}
            >
              <ExportPrefsSection company={company} />
            </SettingsGroup>
          </>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-[13px] font-semibold" style={{ color: "var(--elev8-g600)" }}>
          Coming next in Enterprise Configuration
        </h2>
        <ul className="mt-2 space-y-1.5">
          {UPCOMING_STEPS.map((s) => (
            <li key={s} className="text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
