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
} from "@/lib/modules/company-config/schemas";
import type { CompanyRow } from "@/lib/modules/company-config/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import {
  getRealStateNamesForCountryAction,
  saveCompanyGeographyAction,
  saveCompanyIdentityAction,
  saveCompanyMarketPriorityAction,
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

const UPCOMING_STEPS = [
  "Business Objectives (Goals)",
  "Commercial Terms",
  "Pillar Selection & Pillar Preferences",
];

export function CompanyConfigForm({
  company,
  countries,
  homeCountryStates,
}: {
  company: CompanyRow;
  countries: { id: string; name: string }[];
  homeCountryStates: string[];
}) {
  return (
    <div className="max-w-[820px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        {company.name}
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        Enterprise Configuration. What you set here shapes which
        opportunities, alerts, and recommendations gatewAI surfaces for
        your company.
      </p>

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
