"use client";

/**
 * app/admin/config-engine/sustainability/SustainabilityForm.tsx
 */

import { useState, useTransition } from "react";
import {
  GHG_SCOPES,
  ESG_FRAMEWORKS,
  SUSTAINABILITY_VERIFICATION_STAGES,
  computeKpiAchievement,
  type SustainabilityPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import type { PillarConditionRow } from "@/lib/modules/config-engine/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import { PillarGovernancePanel } from "@/components/PillarGovernancePanel";
import { Tag } from "@/components/ui";
import { saveSustainabilityPayloadAction } from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

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

function RefChip({ label }: { label: string }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-[12px]"
      style={{ background: "var(--elev8-g50)", color: "var(--elev8-g500)", border: "1px solid var(--elev8-g200)" }}
    >
      {label}
    </span>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
      style={{ background: on ? "var(--elev8-green)" : "var(--elev8-g200)" }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
        style={{ transform: on ? "translateX(18px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function ChipListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
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
            <Tag key={`${item}-${i}`} label={item} onRemove={() => onChange(items.filter((_, idx) => idx !== i))} />
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder={placeholder}
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

export function SustainabilityForm({
  initial,
  lockedFields,
  conditions,
  procurementEsgWeight,
}: {
  initial: SustainabilityPayloadInput;
  lockedFields: string[];
  conditions: PillarConditionRow[];
  procurementEsgWeight: number | null;
}) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveSustainabilityPayloadAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  function addKpi() {
    setForm((f) => ({
      ...f,
      kpis: [
        ...f.kpis,
        { name: "New KPI", unit: "%", baseline: 0, baselineYear: String(new Date().getFullYear()), target: 100, targetYear: "", actual: 0 },
      ],
    }));
  }

  function updateKpi(index: number, key: string, value: string) {
    setForm((f) => ({
      ...f,
      kpis: f.kpis.map((k, i) =>
        i === index
          ? {
              ...k,
              [key]: ["baseline", "target", "actual"].includes(key) ? Number(value) : value,
            }
          : k,
      ),
    }));
  }

  function removeKpi(index: number) {
    setForm((f) => ({ ...f, kpis: f.kpis.filter((_, i) => i !== index) }));
  }

  return (
    <div className="max-w-[920px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Sustainability
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        The pillar that protects everything the other seven build. Set
        the national reporting framework once, and every enterprise&apos;s
        ESG score, every green tender requirement, and every
        green-investment flag reads from it.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
          style={{ borderColor: "var(--elev8-g100)" }}
        >
          <SettingsGroup
            title="National sustainability program and governance"
            summary={form.enabled ? "Active" : "Not active"}
            isComplete={Boolean(form.baselineYear && form.netZeroTarget)}
            defaultOpen
          >
            <div className="mb-4 flex items-center gap-3">
              <Toggle on={form.enabled} onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))} />
              <span className="text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                Sustainability program active
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Governing authority
                </label>
                <input
                  className={inputClass}
                  value={form.authority ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, authority: e.target.value || null }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Reporting period
                </label>
                <select
                  className={inputClass}
                  value={form.reportingPeriod}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reportingPeriod: e.target.value as "Annual" | "Quarterly" }))
                  }
                >
                  <option value="Annual">Annual</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
            </div>
            <p className="mt-2 text-[12px]" style={{ color: "var(--elev8-g400)" }}>
              Governing authority should match an entity configured in
              the Governance pillar, keeping sustainability accountable
              to a named national authority.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Baseline year
                </label>
                <input
                  className={inputClass}
                  value={form.baselineYear}
                  onChange={(e) => setForm((f) => ({ ...f, baselineYear: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  National net zero target year
                </label>
                <input
                  className={inputClass}
                  value={form.netZeroTarget}
                  onChange={(e) => setForm((f) => ({ ...f, netZeroTarget: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Interim target
                </label>
                <input
                  className={inputClass}
                  value={form.interimTarget ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, interimTarget: e.target.value || null }))}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-1.5 sm:max-w-[300px]">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                Renewable energy target
              </label>
              <input
                className={inputClass}
                value={form.renewableTarget ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, renewableTarget: e.target.value || null }))}
              />
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="GHG reporting scopes and measurement"
            summary={form.scopesRequired.length === 0 ? "None required" : form.scopesRequired.join(", ")}
            isComplete={form.scopesRequired.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Mandatory scopes are required from every enterprise
              disclosing emissions on the platform.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {GHG_SCOPES.map((s) => (
                <Chip
                  key={s}
                  label={s === "Scope 3" ? `${s} (Supply Chain)` : s}
                  on={form.scopesRequired.includes(s)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      scopesRequired: f.scopesRequired.includes(s)
                        ? f.scopesRequired.filter((x) => x !== s)
                        : [...f.scopesRequired, s],
                    }))
                  }
                />
              ))}
            </div>
            <div className="mb-4 flex items-center gap-3">
              <Toggle
                on={form.scope3Optional}
                onClick={() => setForm((f) => ({ ...f, scope3Optional: !f.scope3Optional }))}
              />
              <span className="text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                Allow Scope 3 as optional disclosure for large enterprises
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Emission measurement unit
                </label>
                <input
                  className={inputClass}
                  value={form.emissionUnit ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, emissionUnit: e.target.value || null }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Emission factor source
                </label>
                <input
                  className={inputClass}
                  value={form.emissionFactorSource ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, emissionFactorSource: e.target.value || null }))}
                />
              </div>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="National sustainability KPIs"
            summary={form.kpis.length === 0 ? "None added" : `${form.kpis.length} KPIs`}
            isComplete={form.kpis.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Every KPI rolls up from baseline to target with a live
              achievement percentage.
            </p>
            {form.kpis.length > 0 && (
              <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
                <table className="w-full text-start text-[12.5px]">
                  <thead>
                    <tr style={{ background: "var(--elev8-g50)" }}>
                      {["KPI", "Unit", "Baseline (Yr)", "Target (Yr)", "Actual", "Achievement", ""].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.kpis.map((k, i) => {
                      const achievement = computeKpiAchievement(k);
                      return (
                        <tr key={i} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                          <td className="px-2 py-1.5">
                            <input className={inputClass} value={k.name} onChange={(e) => updateKpi(i, "name", e.target.value)} />
                          </td>
                          <td className="w-16 px-2 py-1.5">
                            <input className={inputClass} value={k.unit} onChange={(e) => updateKpi(i, "unit", e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1">
                              <input className={inputClass} type="number" value={k.baseline} onChange={(e) => updateKpi(i, "baseline", e.target.value)} />
                              <input className={inputClass} value={k.baselineYear} onChange={(e) => updateKpi(i, "baselineYear", e.target.value)} />
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex gap-1">
                              <input className={inputClass} type="number" value={k.target} onChange={(e) => updateKpi(i, "target", e.target.value)} />
                              <input className={inputClass} value={k.targetYear} onChange={(e) => updateKpi(i, "targetYear", e.target.value)} />
                            </div>
                          </td>
                          <td className="w-20 px-2 py-1.5">
                            <input className={inputClass} type="number" value={k.actual} onChange={(e) => updateKpi(i, "actual", e.target.value)} />
                          </td>
                          <td className="px-2 py-1.5">
                            <span
                              className="rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                              style={{
                                background: achievement >= 80 ? "#E9F8EF" : achievement >= 50 ? "#EEF4FC" : "#FFF7E6",
                                color: achievement >= 80 ? "#00874A" : achievement >= 50 ? "#004AA5" : "#8A6A1A",
                              }}
                            >
                              {achievement}%
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <button type="button" onClick={() => removeKpi(i)} className="text-[12px] font-medium" style={{ color: "var(--elev8-red)" }}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" onClick={addKpi} className="text-[13px] font-medium" style={{ color: "var(--elev8-blue)" }}>
              + Add KPI
            </button>
          </SettingsGroup>

          <SettingsGroup
            title="Reporting frameworks"
            summary={form.frameworks.length === 0 ? "None enabled" : form.frameworks.join(", ")}
            isComplete={form.frameworks.length > 0}
          >
            <div className="flex flex-wrap gap-2">
              {ESG_FRAMEWORKS.map((fw) => (
                <Chip
                  key={fw}
                  label={fw}
                  on={form.frameworks.includes(fw)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      frameworks: f.frameworks.includes(fw)
                        ? f.frameworks.filter((x) => x !== fw)
                        : [...f.frameworks, fw],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Sustainable / green procurement"
            summary={`Min ESG score ${form.greenProcurement.esgThreshold}`}
            isComplete={form.greenProcurement.esgThreshold > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Minimum ESG score a bid must carry to count toward
              &quot;green procurement spend&quot; reporting.
              {procurementEsgWeight != null && (
                <>
                  {" "}
                  This is the same ESG score that currently feeds{" "}
                  <strong style={{ color: "var(--elev8-ink)" }}>{procurementEsgWeight}%</strong>{" "}
                  of Procurement&apos;s Bid Evaluation weighting.
                </>
              )}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Minimum ESG score (green spend)
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.greenProcurement.esgThreshold}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      greenProcurement: { ...f.greenProcurement, esgThreshold: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Minimum supplier ESG score
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.greenProcurement.minSupplierEsgScore}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      greenProcurement: { ...f.greenProcurement, minSupplierEsgScore: Number(e.target.value) },
                    }))
                  }
                />
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                <input
                  type="checkbox"
                  checked={form.greenProcurement.requireGhgDisclosure}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      greenProcurement: { ...f.greenProcurement, requireGhgDisclosure: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 accent-[var(--elev8-blue)]"
                />
                Require GHG disclosure from bidders
              </label>
              <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                <input
                  type="checkbox"
                  checked={form.greenProcurement.requireGreenCertification}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      greenProcurement: { ...f.greenProcurement, requireGreenCertification: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 accent-[var(--elev8-blue)]"
                />
                Require green product certification
              </label>
            </div>
            <div className="my-4 h-px" style={{ background: "var(--elev8-g100)" }} />
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Preferred sustainable materials
            </label>
            <ChipListEditor
              items={form.greenProcurement.sustainableMaterials}
              onChange={(sustainableMaterials) =>
                setForm((f) => ({ ...f, greenProcurement: { ...f.greenProcurement, sustainableMaterials } }))
              }
              placeholder="Add a sustainable material"
            />
          </SettingsGroup>

          <SettingsGroup
            title="Circular economy and waste management"
            summary={form.circularEconomy.enabled ? "Active" : "Not active"}
            isComplete={form.circularEconomy.enabled}
          >
            <div className="mb-4 flex items-center gap-3">
              <Toggle
                on={form.circularEconomy.enabled}
                onClick={() =>
                  setForm((f) => ({ ...f, circularEconomy: { ...f.circularEconomy, enabled: !f.circularEconomy.enabled } }))
                }
              />
              <span className="text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                Circular economy program active
              </span>
            </div>
            <div className="mb-4 flex flex-col gap-1.5 sm:max-w-[280px]">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                National waste diversion target (%)
              </label>
              <input
                className={inputClass}
                type="number"
                value={form.circularEconomy.wasteDiversionTarget}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    circularEconomy: { ...f.circularEconomy, wasteDiversionTarget: Number(e.target.value) },
                  }))
                }
              />
            </div>
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Circular economy categories
            </label>
            <ChipListEditor
              items={form.circularEconomy.categories}
              onChange={(categories) => setForm((f) => ({ ...f, circularEconomy: { ...f.circularEconomy, categories } }))}
              placeholder="Add a category"
            />
          </SettingsGroup>

          <SettingsGroup
            title="Carbon offsets and credits"
            summary={form.carbonMarket.offsetsAllowed || form.carbonMarket.creditsAllowed ? "Allowed" : "Not allowed"}
            isComplete={form.carbonMarket.offsetsAllowed || form.carbonMarket.creditsAllowed}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Offsets and credits supplement, not replace, real
              abatement. Most frameworks recommend capping offset
              coverage well below 50% of the reduction target.
            </p>
            <div className="mb-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                <input
                  type="checkbox"
                  checked={form.carbonMarket.offsetsAllowed}
                  onChange={(e) => setForm((f) => ({ ...f, carbonMarket: { ...f.carbonMarket, offsetsAllowed: e.target.checked } }))}
                  className="h-4 w-4 accent-[var(--elev8-blue)]"
                />
                Carbon offsets allowed
              </label>
              <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                <input
                  type="checkbox"
                  checked={form.carbonMarket.creditsAllowed}
                  onChange={(e) => setForm((f) => ({ ...f, carbonMarket: { ...f.carbonMarket, creditsAllowed: e.target.checked } }))}
                  className="h-4 w-4 accent-[var(--elev8-blue)]"
                />
                Carbon credits allowed
              </label>
            </div>
            <div className="mb-4 flex flex-col gap-1.5 sm:max-w-[280px]">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                Max offset coverage of target (%)
              </label>
              <input
                className={inputClass}
                type="number"
                value={form.carbonMarket.maxOffsetPctOfTarget}
                onChange={(e) =>
                  setForm((f) => ({ ...f, carbonMarket: { ...f.carbonMarket, maxOffsetPctOfTarget: Number(e.target.value) } }))
                }
              />
            </div>
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Recognized offset registries
            </label>
            <ChipListEditor
              items={form.carbonMarket.registries}
              onChange={(registries) => setForm((f) => ({ ...f, carbonMarket: { ...f.carbonMarket, registries } }))}
              placeholder="Add a registry"
            />
          </SettingsGroup>

          <SettingsGroup
            title="Verification and evidence requirements"
            summary={form.verification.required ? "Required" : "Not required"}
            isComplete={form.verification.required}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Evidence and independent verification are what separate a
              reported number from a trusted one.
            </p>
            <div className="mb-4 flex items-center gap-3">
              <Toggle
                on={form.verification.required}
                onClick={() => setForm((f) => ({ ...f, verification: { ...f.verification, required: !f.verification.required } }))}
              />
              <span className="text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                Third-party verification required
              </span>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Assurance level
                </label>
                <select
                  className={inputClass}
                  value={form.verification.assuranceLevel}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      verification: {
                        ...f.verification,
                        assuranceLevel: e.target.value as "Limited Assurance" | "Reasonable Assurance",
                      },
                    }))
                  }
                >
                  <option value="Limited Assurance">Limited Assurance</option>
                  <option value="Reasonable Assurance">Reasonable Assurance</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Required above spend (OMR Mn)
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.verification.thresholdSpend}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, verification: { ...f.verification, thresholdSpend: Number(e.target.value) } }))
                  }
                />
              </div>
            </div>
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Required evidence types
            </label>
            <ChipListEditor
              items={form.verification.evidenceRequired}
              onChange={(evidenceRequired) => setForm((f) => ({ ...f, verification: { ...f.verification, evidenceRequired } }))}
              placeholder="Add an evidence type"
            />
            <div className="my-4 h-px" style={{ background: "var(--elev8-g100)" }} />
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Verification workflow (reference)
            </label>
            <div className="flex flex-wrap gap-2">
              {SUSTAINABILITY_VERIFICATION_STAGES.map((s) => (
                <RefChip key={s} label={s} />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Green investment alignment"
            summary={form.greenInvestment.enabled ? "Active" : "Not active"}
            isComplete={form.greenInvestment.enabled}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Every Investment opportunity can carry a combined
              Strategic Investment Impact Score, Financial Return x ESG
              Impact x GHG Reduction x Local Content Impact, so investors
              and administrators see economic and environmental value
              together.
            </p>
            <div className="mb-4 flex items-center gap-3">
              <Toggle
                on={form.greenInvestment.enabled}
                onClick={() => setForm((f) => ({ ...f, greenInvestment: { ...f.greenInvestment, enabled: !f.greenInvestment.enabled } }))}
              />
              <span className="text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                Green investment alignment active
              </span>
            </div>
            <div className="flex flex-col gap-1.5 sm:max-w-[340px]">
              <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                Minimum ESG impact score for incentive eligibility
              </label>
              <input
                className={inputClass}
                type="number"
                value={form.greenInvestment.minEsgImpactForIncentive}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    greenInvestment: { ...f.greenInvestment, minEsgImpactForIncentive: Number(e.target.value) },
                  }))
                }
              />
            </div>
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

      <PillarGovernancePanel pillar="sustainability" lockedFields={lockedFields} conditions={conditions} />
    </div>
  );
}
