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
} from "@/lib/modules/company-config/schemas";
import type { CompanyRow } from "@/lib/modules/company-config/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import {
  getRealStateNamesForCountryAction,
  saveCompanyCommercialTermsAction,
  saveCompanyGeographyAction,
  saveCompanyGoalsAction,
  saveCompanyIdentityAction,
  saveCompanyMarketPriorityAction,
  saveCompanyPillarSelectionAction,
  saveCompanyRoleAction,
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

const UPCOMING_STEPS = ["Pillar Preferences (per active pillar)"];

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
