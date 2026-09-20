"use client";

/**
 * app/admin/config-engine/procurement/ProcurementForm.tsx
 *
 * All 8 sections save together in one Server Action call, unlike
 * Governance's separate per-table actions -- there's no cross-pillar
 * reference data here, it's one coherent payload, so one save button for
 * the whole pillar matches the data shape honestly rather than
 * simulating per-section saves that don't reflect how the data is
 * actually stored.
 */

import { useState, useTransition } from "react";
import {
  TENDER_TYPE_KEYS,
  TENDER_TYPE_LABELS,
  CONTRACT_TYPES,
  OBLIGATION_CATEGORIES,
  type ProcurementPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import { SettingsGroup } from "../SettingsGroup";
import { saveProcurementPayloadAction } from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

function Chip({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function ProcurementForm({ initial }: { initial: ProcurementPayloadInput }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveProcurementPayloadAction(form);
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

  const enabledTenderTypesCount = Object.values(form.tenderTypes).filter(Boolean).length;
  const evalWeightsTotal =
    form.evalWeights.technical +
    form.evalWeights.commercial +
    form.evalWeights.icv +
    form.evalWeights.esg +
    form.evalWeights.compliance;

  function addKpiRow() {
    setForm((f) => ({
      ...f,
      kpi: [
        ...f.kpi,
        { area: "Quality", kpi: "New KPI", micro: 10, small: 10, medium: 10, large: 10, mfn: 10, row: 10 },
      ],
    }));
  }

  function removeKpiRow(index: number) {
    setForm((f) => ({ ...f, kpi: f.kpi.filter((_, i) => i !== index) }));
  }

  function updateKpiRow(index: number, key: string, value: string) {
    setForm((f) => ({
      ...f,
      kpi: f.kpi.map((row, i) =>
        i === index
          ? { ...row, [key]: key === "area" || key === "kpi" ? value : Number(value) }
          : row,
      ),
    }));
  }

  return (
    <div className="max-w-[820px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Procurement
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        How public and private demand reaches the market: which tender
        types are legal instruments here, at what value they trigger
        which process, and how bids get scored. This becomes the shared
        evaluation engine every tender on the platform runs through.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
          style={{ borderColor: "var(--elev8-g100)" }}
        >
          <SettingsGroup
            title="Tender types enabled"
            summary={`${enabledTenderTypesCount} of ${TENDER_TYPE_KEYS.length} enabled`}
            isComplete={enabledTenderTypesCount > 0}
            defaultOpen
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Match this to national procurement law. Not every type needs
              enabling.
            </p>
            <div className="flex flex-wrap gap-2">
              {TENDER_TYPE_KEYS.map((key) => (
                <Chip
                  key={key}
                  label={TENDER_TYPE_LABELS[key]}
                  on={form.tenderTypes[key]}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      tenderTypes: { ...f.tenderTypes, [key]: !f.tenderTypes[key] },
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Contract types enabled"
            summary={form.contractTypes.length === 0 ? "None enabled" : form.contractTypes.join(", ")}
            isComplete={form.contractTypes.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              The contract instruments an award can convert into.
            </p>
            <div className="flex flex-wrap gap-2">
              {CONTRACT_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  on={form.contractTypes.includes(t)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      contractTypes: f.contractTypes.includes(t)
                        ? f.contractTypes.filter((c) => c !== t)
                        : [...f.contractTypes, t],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Procurement thresholds"
            summary={`Direct award up to ${form.thresholds.directAward}`}
            isComplete={form.thresholds.open > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Contract value bands that determine which tender type and
              approval level automatically applies.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Direct award, up to">
                <input
                  className={inputClass}
                  type="number"
                  value={form.thresholds.directAward}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      thresholds: { ...f.thresholds, directAward: Number(e.target.value) },
                    }))
                  }
                />
              </Field>
              <Field label="Limited tender, up to">
                <input
                  className={inputClass}
                  type="number"
                  value={form.thresholds.limited}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      thresholds: { ...f.thresholds, limited: Number(e.target.value) },
                    }))
                  }
                />
              </Field>
              <Field label="Open tender, above">
                <input
                  className={inputClass}
                  type="number"
                  value={form.thresholds.open}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      thresholds: { ...f.thresholds, open: Number(e.target.value) },
                    }))
                  }
                />
              </Field>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Bid evaluation weighting"
            summary={`Totals ${evalWeightsTotal}%`}
            isComplete={evalWeightsTotal === 100}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Every tender award is scored using this weighting unless
              overridden per-tender. Must total 100%.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["technical", "Technical score"],
                  ["commercial", "Commercial score"],
                  ["icv", "ICV / local content score"],
                  ["esg", "ESG / sustainability score"],
                  ["compliance", "Compliance score"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    className={inputClass}
                    type="number"
                    value={form.evalWeights[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        evalWeights: { ...f.evalWeights, [key]: Number(e.target.value) },
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
            {evalWeightsTotal !== 100 && (
              <p className="mt-2 text-[12px]" style={{ color: "var(--elev8-red)" }}>
                Currently totals {evalWeightsTotal}%, must equal 100%.
              </p>
            )}
            {fieldErrors.technical?.map((m) => (
              <p key={m} className="mt-1 text-[12px]" style={{ color: "var(--elev8-red)" }}>
                {m}
              </p>
            ))}
          </SettingsGroup>

          <SettingsGroup
            title="Mandatory bid documents"
            summary={form.mandatoryDocuments.length === 0 ? "None added" : form.mandatoryDocuments.join(", ")}
            isComplete={form.mandatoryDocuments.length > 0}
          >
            <MandatoryDocumentsEditor
              items={form.mandatoryDocuments}
              onChange={(items) => setForm((f) => ({ ...f, mandatoryDocuments: items }))}
            />
          </SettingsGroup>

          <SettingsGroup
            title="Supplier prequalification"
            summary={form.prequalification.required ? "Required before bidding" : "Not required"}
            isComplete={form.prequalification.required}
          >
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                <input
                  type="checkbox"
                  checked={form.prequalification.required}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      prequalification: { ...f.prequalification, required: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 accent-[var(--elev8-blue)]"
                />
                Prequalification required before bidding
              </label>
              <Field label="Minimum prequalification score">
                <input
                  className={inputClass}
                  type="number"
                  value={form.prequalification.minScore}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      prequalification: { ...f.prequalification, minScore: Number(e.target.value) },
                    }))
                  }
                />
              </Field>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Post-award obligation tracking"
            summary={
              form.obligationCategories.length === 0
                ? "None enabled"
                : form.obligationCategories.join(", ")
            }
            isComplete={form.obligationCategories.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Which obligation categories get tracked on every awarded
              contract.
            </p>
            <div className="flex flex-wrap gap-2">
              {OBLIGATION_CATEGORIES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  on={form.obligationCategories.includes(t)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      obligationCategories: f.obligationCategories.includes(t)
                        ? f.obligationCategories.filter((c) => c !== t)
                        : [...f.obligationCategories, t],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Supplier performance KPI weightage matrix"
            summary={form.kpi.length === 0 ? "No KPI rows" : `${form.kpi.length} KPI rows`}
            isComplete={form.kpi.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Weight per classification tier, used to score supplier
              performance appraisals feeding Bid Evaluation and ICV Bonus
              Categories.
            </p>
            {form.kpi.length > 0 && (
              <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr style={{ background: "var(--elev8-g50)" }}>
                      {["Area", "KPI", "Micro", "Small", "Medium", "Large", "Intl MFN", "Intl RoW", ""].map(
                        (h) => (
                          <th key={h} className="whitespace-nowrap px-2 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {form.kpi.map((row, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                        <td className="px-2 py-1.5">
                          <input
                            className={inputClass}
                            value={row.area}
                            onChange={(e) => updateKpiRow(i, "area", e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            className={inputClass}
                            value={row.kpi}
                            onChange={(e) => updateKpiRow(i, "kpi", e.target.value)}
                          />
                        </td>
                        {(["micro", "small", "medium", "large", "mfn", "row"] as const).map((k) => (
                          <td key={k} className="w-16 px-2 py-1.5">
                            <input
                              className={inputClass}
                              type="number"
                              value={row[k]}
                              onChange={(e) => updateKpiRow(i, k, e.target.value)}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => removeKpiRow(i)}
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
            <button
              type="button"
              onClick={addKpiRow}
              className="text-[13px] font-medium"
              style={{ color: "var(--elev8-blue)" }}
            >
              + Add KPI row
            </button>
          </SettingsGroup>
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
    </div>
  );
}

function MandatoryDocumentsEditor({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  }

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px]"
              style={{ background: "#E6F5EC", color: "var(--elev8-green-dk)" }}
            >
              {item}
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="opacity-70 hover:opacity-100"
                aria-label={`Remove ${item}`}
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
          placeholder="e.g. Bid Bond, Company Registration Certificate"
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
