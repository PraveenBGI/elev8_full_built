"use client";

/**
 * app/admin/config-engine/identity/CountryIdentityForm.tsx
 *
 * Second revision after direct feedback. First version showed all 14
 * fields at once (overwhelming); the "Show more fields" toggle fixed
 * density but not the actual problem -- one long form is still one long
 * form once expanded, and it didn't look considered.
 *
 * This version groups fields into three named sections (SettingsGroup),
 * each collapsed by default with a one-line summary of its current
 * values, a green check when its content is meaningfully filled in. The
 * page reads as a short list you scan, not a form you fill. This pattern
 * is the template for every future pillar's own sub-sections, not a
 * one-off for Identity.
 */

import { useState, useTransition } from "react";
import type { CountryIdentityRow } from "@/lib/modules/config-engine/adapter";
import type { CountryIdentityInput } from "@/lib/modules/config-engine/schemas";
import { saveCountryIdentityAction } from "./actions";
import { SettingsGroup } from "../SettingsGroup";

function rowToFormInput(row: CountryIdentityRow): CountryIdentityInput {
  return {
    name: row.name,
    countryCode: row.country_code,
    wbCode: row.wb_code,
    officialLanguage: row.official_language,
    masterCurrency: row.master_currency,
    ancillaryCurrency: row.ancillary_currency,
    timeZone: row.time_zone,
    dialCode: row.dial_code,
    geozone: row.geozone,
    incomeGroup: row.income_group,
    systemOfTrade: row.system_of_trade,
    wtoMember: row.wto_member,
    financialYearModel: row.financial_year_model,
    currentFinancialYear: row.current_financial_year,
    workingWeek: row.working_week,
  };
}

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium text-[var(--elev8-g600)]">
        {label}
        {required && <span className="text-[var(--elev8-red)]"> *</span>}
      </label>
      {children}
      {error?.map((m) => (
        <p key={m} className="text-xs text-[var(--elev8-red)]">
          {m}
        </p>
      ))}
    </div>
  );
}

const UPCOMING_SECTIONS = [
  "Sector Metrics",
  "Business Governance",
  "Corporate Classification & MSME Bands",
  "Strategic Control Metrics",
  "National Partner",
  "Support Partners",
];

export function CountryIdentityForm({ country }: { country: CountryIdentityRow }) {
  const [form, setForm] = useState<CountryIdentityInput>(() =>
    rowToFormInput(country),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof CountryIdentityInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value === "" ? null : value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveCountryIdentityAction(form);
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

  const basicsSummary = [form.name, form.masterCurrency].filter(Boolean).join(" · ") || "Not set";
  const basicsComplete = Boolean(form.name && form.masterCurrency);

  const currencyRegionSummary =
    [form.ancillaryCurrency, form.timeZone, form.dialCode, form.geozone]
      .filter(Boolean)
      .join(" · ") || "Not set";
  const currencyRegionComplete = Boolean(
    form.ancillaryCurrency || form.timeZone || form.dialCode || form.geozone,
  );

  const classificationSummary =
    [form.incomeGroup, form.systemOfTrade, form.wtoMember ? "WTO member" : null]
      .filter(Boolean)
      .join(" · ") || "Not set";
  const classificationComplete = Boolean(
    form.incomeGroup || form.systemOfTrade || form.financialYearModel,
  );

  return (
    <div className="max-w-[640px]">
      <h1 className="text-[22px] font-semibold text-[var(--elev8-ink)]">
        Country Identity
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed text-[var(--elev8-g500)]">
        The foundation every other pillar reads from: currency, tax year, and
        classification. Everything else in this platform inherits from what
        you set here.
      </p>

      {country.approval_status !== "draft" && (
        <p className="mb-5 rounded-md bg-[#FFF6E5] px-3 py-2 text-sm text-[var(--elev8-orange)]">
          This country&apos;s configuration is currently{" "}
          <strong>{country.approval_status}</strong>.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-[var(--elev8-g100)] bg-white px-5 shadow-[var(--elev8-shadow-sm)]">
          <SettingsGroup
            title="Basics"
            summary={basicsSummary}
            isComplete={basicsComplete}
            defaultOpen
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Country name" required error={fieldErrors.name}>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field
                label="Master currency"
                required
                error={fieldErrors.masterCurrency}
              >
                <input
                  className={inputClass}
                  placeholder="e.g. OMR"
                  value={form.masterCurrency}
                  onChange={(e) => set("masterCurrency", e.target.value)}
                />
              </Field>
              <Field label="Country code">
                <input
                  className={inputClass}
                  value={form.countryCode ?? ""}
                  onChange={(e) => set("countryCode", e.target.value)}
                />
              </Field>
              <Field label="World Bank code">
                <input
                  className={inputClass}
                  value={form.wbCode ?? ""}
                  onChange={(e) => set("wbCode", e.target.value)}
                />
              </Field>
              <Field label="Official language">
                <input
                  className={inputClass}
                  value={form.officialLanguage ?? ""}
                  onChange={(e) => set("officialLanguage", e.target.value)}
                />
              </Field>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Currency & region"
            summary={currencyRegionSummary}
            isComplete={currencyRegionComplete}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Ancillary currency">
                <input
                  className={inputClass}
                  value={form.ancillaryCurrency ?? ""}
                  onChange={(e) => set("ancillaryCurrency", e.target.value)}
                />
              </Field>
              <Field label="Time zone">
                <input
                  className={inputClass}
                  value={form.timeZone ?? ""}
                  onChange={(e) => set("timeZone", e.target.value)}
                />
              </Field>
              <Field label="Dial code" error={fieldErrors.dialCode}>
                <input
                  className={inputClass}
                  placeholder="e.g. +968"
                  value={form.dialCode ?? ""}
                  onChange={(e) => set("dialCode", e.target.value)}
                />
              </Field>
              <Field label="Geozone">
                <input
                  className={inputClass}
                  value={form.geozone ?? ""}
                  onChange={(e) => set("geozone", e.target.value)}
                />
              </Field>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Classification"
            summary={classificationSummary}
            isComplete={classificationComplete}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Income group">
                <input
                  className={inputClass}
                  value={form.incomeGroup ?? ""}
                  onChange={(e) => set("incomeGroup", e.target.value)}
                />
              </Field>
              <Field label="System of trade">
                <input
                  className={inputClass}
                  value={form.systemOfTrade ?? ""}
                  onChange={(e) => set("systemOfTrade", e.target.value)}
                />
              </Field>
              <Field label="Financial year model">
                <input
                  className={inputClass}
                  value={form.financialYearModel ?? ""}
                  onChange={(e) => set("financialYearModel", e.target.value)}
                />
              </Field>
              <Field label="Current financial year">
                <input
                  className={inputClass}
                  value={form.currentFinancialYear ?? ""}
                  onChange={(e) => set("currentFinancialYear", e.target.value)}
                />
              </Field>
              <Field label="Working week">
                <input
                  className={inputClass}
                  value={form.workingWeek ?? ""}
                  onChange={(e) => set("workingWeek", e.target.value)}
                />
              </Field>
              <label className="flex items-center gap-2 pt-6 text-[13px] text-[var(--elev8-ink)]">
                <input
                  type="checkbox"
                  checked={form.wtoMember}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, wtoMember: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[var(--elev8-blue)]"
                />
                WTO member
              </label>
            </div>
          </SettingsGroup>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[var(--elev8-blue)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {statusMessage && (
            <p
              className={`text-sm ${status === "saved" ? "text-[var(--elev8-green-dk)]" : "text-[var(--elev8-red)]"}`}
            >
              {statusMessage}
            </p>
          )}
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-[13px] font-semibold text-[var(--elev8-g600)]">
          Coming next in Country Identity
        </h2>
        <ul className="mt-2 space-y-1.5">
          {UPCOMING_SECTIONS.map((s) => (
            <li key={s} className="text-[13px] text-[var(--elev8-g500)]">
              · {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
