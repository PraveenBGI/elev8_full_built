"use client";

/**
 * app/admin/config-engine/country/CountryIdentityForm.tsx
 *
 * Deliberately plain: this is Phase 0.5's first UI slice, proving the
 * form -> Server Action -> adapter -> RLS chain end to end, the same role
 * /api/health played for Phase 0. No design system decision has been made
 * yet -- don't read styling choices here as a visual direction for the
 * rest of the app.
 */

import { useState, useTransition } from "react";
import type { CountryIdentityRow } from "@/lib/modules/config-engine/adapter";
import type { CountryIdentityInput } from "@/lib/modules/config-engine/schemas";
import { saveCountryIdentityAction } from "./actions";

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

const FIELDS: Array<{
  key: keyof CountryIdentityInput;
  label: string;
  required?: boolean;
}> = [
  { key: "name", label: "Country name", required: true },
  { key: "masterCurrency", label: "Master currency (e.g. OMR)", required: true },
  { key: "ancillaryCurrency", label: "Ancillary currency" },
  { key: "countryCode", label: "Country code" },
  { key: "wbCode", label: "World Bank code" },
  { key: "officialLanguage", label: "Official language" },
  { key: "timeZone", label: "Time zone" },
  { key: "dialCode", label: "Dial code (e.g. +968)" },
  { key: "geozone", label: "Geozone" },
  { key: "incomeGroup", label: "Income group" },
  { key: "systemOfTrade", label: "System of trade" },
  { key: "financialYearModel", label: "Financial year model" },
  { key: "currentFinancialYear", label: "Current financial year" },
  { key: "workingWeek", label: "Working week" },
];

export function CountryIdentityForm({ country }: { country: CountryIdentityRow }) {
  const [form, setForm] = useState<CountryIdentityInput>(() =>
    rowToFormInput(country),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(key: keyof CountryIdentityInput, value: string) {
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
        setStatusMessage("Saved.");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {country.approval_status !== "draft" && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          This country&apos;s configuration is currently{" "}
          <strong>{country.approval_status}</strong>. Editing identity fields
          does not affect pillar approval status.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label, required }) => (
          <div key={key} className="flex flex-col gap-1">
            <label htmlFor={key} className="text-sm font-medium">
              {label}
              {required && <span className="text-red-600"> *</span>}
            </label>
            {key === "wtoMember" ? null : (
              <input
                id={key}
                type="text"
                value={(form[key] as string) ?? ""}
                onChange={(e) => handleChange(key, e.target.value)}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            )}
            {fieldErrors[key]?.map((msg) => (
              <p key={msg} className="text-xs text-red-600">
                {msg}
              </p>
            ))}
          </div>
        ))}

        <div className="flex items-center gap-2">
          <input
            id="wtoMember"
            type="checkbox"
            checked={form.wtoMember}
            onChange={(e) => setForm((f) => ({ ...f, wtoMember: e.target.checked }))}
            className="h-4 w-4"
          />
          <label htmlFor="wtoMember" className="text-sm font-medium">
            WTO member
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        {statusMessage && (
          <p
            className={
              status === "saved"
                ? "text-sm text-green-700 dark:text-green-400"
                : "text-sm text-red-600"
            }
          >
            {statusMessage}
          </p>
        )}
      </div>
    </form>
  );
}
