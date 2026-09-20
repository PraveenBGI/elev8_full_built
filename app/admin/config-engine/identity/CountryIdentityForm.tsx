"use client";

/**
 * app/admin/config-engine/identity/CountryIdentityForm.tsx
 *
 * The "Country Metrics" section card here matches
 * elev8-country-admin-config_3.html's renderIdentity() exactly: the
 * gradient blue header (.bsec-hd), the white body (.bsec-bd), 3-column
 * field rows (.fr3), and the field label/input pattern (.fl/.fi), with a
 * red required-star for mandatory fields.
 *
 * The mockup's Identity stage actually has 7 sections: Country Metrics,
 * Sector Metrics, Business Governance, Corporate Classification & MSME
 * Bands, Strategic Control Metrics, National Partner, and Support
 * Partners. Only Country Metrics has a real schema/adapter/tests behind
 * it so far (see lib/modules/config-engine/schemas.ts) -- the other six
 * are shown as honest "not built yet" section cards in the same visual
 * style, not silently omitted and not faked with non-functional inputs.
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

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mb-[18px] overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--elev8-g100)", boxShadow: "var(--elev8-shadow-sm)" }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-[13px] text-[13.5px] font-bold text-white"
        style={{
          background: "linear-gradient(135deg, var(--elev8-blue), var(--elev8-blue-dk))",
        }}
      >
        <span aria-hidden>{icon}</span>
        {title}
      </div>
      <div className="bg-white p-5">{children}</div>
    </div>
  );
}

function NotBuiltSection({ icon, title }: { icon: string; title: string }) {
  return (
    <SectionCard icon={icon} title={title}>
      <p className="text-sm" style={{ color: "var(--elev8-g500)" }}>
        Not built yet.
      </p>
    </SectionCard>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex flex-col gap-1.5">
      <label
        className="text-[11.5px] font-bold tracking-wide"
        style={{ color: "var(--elev8-g600)" }}
      >
        {label}
        {required && <span style={{ color: "var(--elev8-red)" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: "1.5px solid var(--elev8-g200)",
  borderRadius: "var(--elev8-radius-md)",
  padding: "9px 12px",
  fontSize: "13px",
  color: "var(--elev8-navy)",
  width: "100%",
};

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
        setStatusMessage("Saved.");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold" style={{ color: "var(--elev8-navy)" }}>
        Country Identity — Master Data
      </h1>
      <p className="mb-5 max-w-[640px] text-sm" style={{ color: "var(--elev8-g500)" }}>
        The foundation every other pillar reads from. Get this right first —
        Procurement, Import, Export, Investment and ICV all inherit these
        definitions.
      </p>

      {country.approval_status !== "draft" && (
        <p
          className="mb-4 rounded-md px-3 py-2 text-sm"
          style={{ background: "#FFF6E5", color: "var(--elev8-orange)" }}
        >
          This country&apos;s configuration is currently{" "}
          <strong>{country.approval_status}</strong>.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <SectionCard icon="🌐" title="Country Metrics">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Field label="Country Name" required>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              {fieldErrors.name?.map((m) => (
                <p key={m} className="text-xs" style={{ color: "var(--elev8-red)" }}>
                  {m}
                </p>
              ))}
            </Field>
            <Field label="Country Code / WB Code">
              <input
                style={inputStyle}
                value={form.countryCode ?? ""}
                onChange={(e) => set("countryCode", e.target.value)}
              />
            </Field>
            <Field label="Official Language">
              <input
                style={inputStyle}
                value={form.officialLanguage ?? ""}
                onChange={(e) => set("officialLanguage", e.target.value)}
              />
            </Field>

            <Field label="Master Currency" required>
              <input
                style={inputStyle}
                value={form.masterCurrency}
                onChange={(e) => set("masterCurrency", e.target.value)}
              />
              {fieldErrors.masterCurrency?.map((m) => (
                <p key={m} className="text-xs" style={{ color: "var(--elev8-red)" }}>
                  {m}
                </p>
              ))}
            </Field>
            <Field label="Ancillary Currency">
              <input
                style={inputStyle}
                value={form.ancillaryCurrency ?? ""}
                onChange={(e) => set("ancillaryCurrency", e.target.value)}
              />
            </Field>
            <Field label="Time Zone">
              <input
                style={inputStyle}
                value={form.timeZone ?? ""}
                onChange={(e) => set("timeZone", e.target.value)}
              />
            </Field>

            <Field label="Dial-in Code">
              <input
                style={inputStyle}
                value={form.dialCode ?? ""}
                onChange={(e) => set("dialCode", e.target.value)}
              />
              {fieldErrors.dialCode?.map((m) => (
                <p key={m} className="text-xs" style={{ color: "var(--elev8-red)" }}>
                  {m}
                </p>
              ))}
            </Field>
            <Field label="Geozone / Region">
              <input
                style={inputStyle}
                value={form.geozone ?? ""}
                onChange={(e) => set("geozone", e.target.value)}
              />
            </Field>
            <Field label="Income Group">
              <input
                style={inputStyle}
                value={form.incomeGroup ?? ""}
                onChange={(e) => set("incomeGroup", e.target.value)}
              />
            </Field>

            <Field label="System of Trade">
              <input
                style={inputStyle}
                value={form.systemOfTrade ?? ""}
                onChange={(e) => set("systemOfTrade", e.target.value)}
              />
            </Field>
            <Field label="Financial Year Model">
              <input
                style={inputStyle}
                value={form.financialYearModel ?? ""}
                onChange={(e) => set("financialYearModel", e.target.value)}
              />
            </Field>
            <Field label="Current Financial Year">
              <input
                style={inputStyle}
                value={form.currentFinancialYear ?? ""}
                onChange={(e) => set("currentFinancialYear", e.target.value)}
              />
            </Field>

            <Field label="Working Week">
              <input
                style={inputStyle}
                value={form.workingWeek ?? ""}
                onChange={(e) => set("workingWeek", e.target.value)}
              />
            </Field>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="wtoMember"
                type="checkbox"
                checked={form.wtoMember}
                onChange={(e) => setForm((f) => ({ ...f, wtoMember: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="wtoMember" className="text-[13px] font-medium">
                WTO member
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "var(--elev8-blue)" }}
            >
              {isPending ? "Saving…" : "Save"}
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
        </SectionCard>

        <NotBuiltSection icon="🏭" title="Sector Metrics" />
        <NotBuiltSection icon="🏛️" title="Business Governance" />
        <NotBuiltSection icon="🎖️" title="Corporate Classification & MSME Bands" />
        <NotBuiltSection icon="🛡️" title="Strategic Control Metrics" />
        <NotBuiltSection icon="🤝" title="National Partner" />
        <NotBuiltSection icon="🧩" title="Support Partners" />
      </form>
    </div>
  );
}
