"use client";

/**
 * app/admin/config-engine/masterdata/MasterDataForm.tsx
 *
 * Two real sections (HS Code Coverage, Tax & VAT/GST System) out of the
 * mockup's 8. The other 6 (HS Code Packs, Economic & Industrial Zones,
 * Ports/Airports & Customs Points, Free Trade Agreements, Business
 * Registration Types, Units of Measurement) are listed honestly as
 * "coming next" -- same pattern as Identity's own partial build.
 *
 * Free Trade Agreements already has real schema (country_ftas, in the
 * foundation migration) but no UI yet -- it's in the "coming next" list
 * for that reason, not because the data model doesn't exist.
 */

import { useState, useTransition } from "react";
import {
  HS_CATEGORIES,
  FTA_TYPES,
  FTA_STATUSES,
  type HsCodeInput,
  type TaxSettingsInput,
  type FreeTradeAgreementInput,
} from "@/lib/modules/config-engine/schemas";
import type { FreeTradeAgreementRow, HsCodeRow } from "@/lib/modules/config-engine/adapter";
import { SettingsGroup } from "../SettingsGroup";
import {
  addFtaAction,
  addHsCodeAction,
  deleteFtaAction,
  deleteHsCodeAction,
  saveTaxSettingsAction,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

function Field({
  label,
  suffix,
  error,
  children,
}: {
  label: string;
  suffix?: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium text-[var(--elev8-g600)]">
        {label}
      </label>
      <div className="relative">
        {children}
        {suffix && (
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px]"
            style={{ color: "var(--elev8-g400)" }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error?.map((m) => (
        <p key={m} className="text-xs text-[var(--elev8-red)]">
          {m}
        </p>
      ))}
    </div>
  );
}

const UPCOMING_SECTIONS = [
  "HS Code Packs",
  "Economic & Industrial Zones",
  "Ports, Airports & Customs Points",
  "Business Registration Types",
  "Units of Measurement",
];

function HsCodeTable({ initialHsCodes }: { initialHsCodes: HsCodeRow[] }) {
  const [hsCodes, setHsCodes] = useState(initialHsCodes);
  const [draft, setDraft] = useState<HsCodeInput>({
    code: "",
    description: "",
    category: HS_CATEGORIES[0],
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await addHsCodeAction(draft);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      // Server Action doesn't return the new row's id, so refresh from
      // the source of truth rather than guess one client-side.
      setHsCodes((rows) => [
        ...rows,
        { id: `pending-${draft.code}`, ...draft },
      ]);
      setDraft({ code: "", description: "", category: HS_CATEGORIES[0] });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteHsCodeAction(id);
      if (result.ok) {
        setHsCodes((rows) => rows.filter((r) => r.id !== id));
      }
    });
  }

  return (
    <div>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Referenced by Import&apos;s HS Code Coverage and Export&apos;s
        Priority HS Codes.
      </p>

      {hsCodes.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Code</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Description</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Category</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {hsCodes.map((h) => (
                <tr key={h.id} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-3 py-2">{h.code}</td>
                  <td className="px-3 py-2">{h.description}</td>
                  <td className="px-3 py-2">{h.category}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(h.id)}
                      disabled={isPending}
                      className="text-[12px] font-medium"
                      style={{ color: "var(--elev8-red)" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_1.4fr_auto] sm:items-end">
        <Field label="Code" error={fieldErrors.code}>
          <input
            className={inputClass}
            placeholder="e.g. 8501.10"
            value={draft.code}
            onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
          />
        </Field>
        <Field label="Description" error={fieldErrors.description}>
          <input
            className={inputClass}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </Field>
        <Field label="Category">
          <select
            className={inputClass}
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => ({ ...d, category: e.target.value as HsCodeInput["category"] }))
            }
          >
            {HS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          Add
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--elev8-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function FtaTable({ initialFtas }: { initialFtas: FreeTradeAgreementRow[] }) {
  const [ftas, setFtas] = useState(initialFtas);
  const [draft, setDraft] = useState<FreeTradeAgreementInput>({
    agreementName: "",
    type: null,
    status: "Under Negotiation",
    partnerCountries: [],
    preferentialTariffRate: null,
    rulesOfOrigin: null,
    effectiveDate: null,
  });
  const [partnersText, setPartnersText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const partnerCountries = partnersText
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const toSave = { ...draft, partnerCountries };

    startTransition(async () => {
      const result = await addFtaAction(toSave);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setFtas((rows) => [
        ...rows,
        {
          id: `pending-${toSave.agreementName}`,
          agreement_name: toSave.agreementName,
          type: toSave.type,
          status: toSave.status,
          partner_countries: toSave.partnerCountries,
          preferential_tariff_rate: toSave.preferentialTariffRate,
          rules_of_origin: toSave.rulesOfOrigin,
          effective_date: toSave.effectiveDate,
        },
      ]);
      setDraft({
        agreementName: "",
        type: null,
        status: "Under Negotiation",
        partnerCountries: [],
        preferentialTariffRate: null,
        rulesOfOrigin: null,
        effectiveDate: null,
      });
      setPartnersText("");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteFtaAction(id);
      if (result.ok) {
        setFtas((rows) => rows.filter((r) => r.id !== id));
      }
    });
  }

  return (
    <div>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Full agreement records: partner countries, status, preferential
        rate, and rules of origin. Export&apos;s trade corridors check
        their destination against the agreements marked In Force here.
      </p>

      {ftas.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Agreement</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Status</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Partners</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Pref. rate</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ftas.map((f) => (
                <tr key={f.id} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-3 py-2">{f.agreement_name}</td>
                  <td className="px-3 py-2">{f.status}</td>
                  <td className="px-3 py-2">{f.partner_countries.join(", ")}</td>
                  <td className="px-3 py-2">
                    {f.preferential_tariff_rate != null ? `${f.preferential_tariff_rate}%` : "Not set"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(f.id)}
                      disabled={isPending}
                      className="text-[12px] font-medium"
                      style={{ color: "var(--elev8-red)" }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Agreement name" error={fieldErrors.agreementName}>
          <input
            className={inputClass}
            value={draft.agreementName}
            onChange={(e) => setDraft((d) => ({ ...d, agreementName: e.target.value }))}
          />
        </Field>
        <Field label="Partner countries" error={fieldErrors.partnerCountries}>
          <input
            className={inputClass}
            placeholder="Comma-separated, e.g. India, UAE"
            value={partnersText}
            onChange={(e) => setPartnersText(e.target.value)}
          />
        </Field>
        <Field label="Type">
          <select
            className={inputClass}
            value={draft.type ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                type: e.target.value ? (e.target.value as FreeTradeAgreementInput["type"]) : null,
              }))
            }
          >
            <option value="">Not set</option>
            {FTA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className={inputClass}
            value={draft.status}
            onChange={(e) =>
              setDraft((d) => ({ ...d, status: e.target.value as FreeTradeAgreementInput["status"] }))
            }
          >
            {FTA_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preferential tariff rate" suffix="%">
          <input
            className={inputClass}
            type="number"
            value={draft.preferentialTariffRate ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                preferentialTariffRate: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
          />
        </Field>
        <Field label="Effective date">
          <input
            className={inputClass}
            type="date"
            value={draft.effectiveDate ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, effectiveDate: e.target.value || null }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Rules of origin">
            <input
              className={inputClass}
              value={draft.rulesOfOrigin ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, rulesOfOrigin: e.target.value || null }))}
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--elev8-blue)" }}
          >
            Add agreement
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--elev8-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function TaxSettingsSection({ initial }: { initial: TaxSettingsInput }) {
  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setNumber(key: keyof TaxSettingsInput, value: string) {
    setForm((f) => ({ ...f, [key]: value === "" ? null : Number(value) }));
  }
  function setText(key: keyof TaxSettingsInput, value: string) {
    setForm((f) => ({ ...f, [key]: value === "" ? null : value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveTaxSettingsAction(form);
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
        The VAT/GST rate feeds landed-cost and contract-value calculations
        platform-wide. General customs duty is the default Import&apos;s
        duty bands align to.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Corporate tax rate" suffix="%" error={fieldErrors.corporateTaxRate}>
          <input
            className={inputClass}
            type="number"
            value={form.corporateTaxRate ?? ""}
            onChange={(e) => setNumber("corporateTaxRate", e.target.value)}
          />
        </Field>
        <Field label="VAT / GST name">
          <input
            className={inputClass}
            placeholder="e.g. VAT"
            value={form.vatGstName ?? ""}
            onChange={(e) => setText("vatGstName", e.target.value)}
          />
        </Field>
        <Field label="VAT / GST rate" suffix="%" error={fieldErrors.vatGstRate}>
          <input
            className={inputClass}
            type="number"
            value={form.vatGstRate ?? ""}
            onChange={(e) => setNumber("vatGstRate", e.target.value)}
          />
        </Field>
        <Field label="Withholding tax rate" suffix="%" error={fieldErrors.withholdingTaxRate}>
          <input
            className={inputClass}
            type="number"
            value={form.withholdingTaxRate ?? ""}
            onChange={(e) => setNumber("withholdingTaxRate", e.target.value)}
          />
        </Field>
        <Field label="General customs duty (reference)" suffix="%" error={fieldErrors.customsDutyGeneral}>
          <input
            className={inputClass}
            type="number"
            value={form.customsDutyGeneral ?? ""}
            onChange={(e) => setNumber("customsDutyGeneral", e.target.value)}
          />
        </Field>
        <Field label="Tax authority">
          <input
            className={inputClass}
            value={form.taxAuthority ?? ""}
            onChange={(e) => setText("taxAuthority", e.target.value)}
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

export function MasterDataForm({
  hsCodes,
  taxSettings,
  ftas,
}: {
  hsCodes: HsCodeRow[];
  taxSettings: TaxSettingsInput;
  ftas: FreeTradeAgreementRow[];
}) {
  const hsSummary =
    hsCodes.length === 0
      ? "No codes added"
      : `${hsCodes.length} code${hsCodes.length === 1 ? "" : "s"}`;

  const taxSummary =
    [taxSettings.vatGstName, taxSettings.taxAuthority].filter(Boolean).join(", ") ||
    "Not set";

  const ftaSummary =
    ftas.length === 0
      ? "No agreements added"
      : `${ftas.length} agreement${ftas.length === 1 ? "" : "s"}`;

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Country Master Data
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        HS codes, tax settings, and other reference data every pillar reads
        from.
      </p>

      <div
        className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <SettingsGroup
          title="HS Code Coverage"
          summary={hsSummary}
          isComplete={hsCodes.length > 0}
          defaultOpen
        >
          <HsCodeTable initialHsCodes={hsCodes} />
        </SettingsGroup>

        <SettingsGroup
          title="Tax & VAT/GST system"
          summary={taxSummary}
          isComplete={Boolean(taxSettings.vatGstName)}
        >
          <TaxSettingsSection initial={taxSettings} />
        </SettingsGroup>

        <SettingsGroup
          title="Free Trade Agreements"
          summary={ftaSummary}
          isComplete={ftas.length > 0}
        >
          <FtaTable initialFtas={ftas} />
        </SettingsGroup>
      </div>

      <div className="mt-10">
        <h2 className="text-[13px] font-semibold" style={{ color: "var(--elev8-g600)" }}>
          Coming next in Country Master Data
        </h2>
        <ul className="mt-2 space-y-1.5">
          {UPCOMING_SECTIONS.map((s) => (
            <li key={s} className="text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
