"use client";

/**
 * app/admin/config-engine/icv/IcvForm.tsx
 */

import { useState, useTransition } from "react";
import {
  ICV_SCORE_TABS,
  ICV_SCORE_LABELS,
  type IcvPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import type { PillarConditionRow } from "@/lib/modules/config-engine/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import { PillarGovernancePanel } from "@/components/PillarGovernancePanel";
import { saveIcvPayloadAction } from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

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

function PercentValueRow({
  label,
  total,
  pct,
  onPctChange,
  currency,
}: {
  label: string;
  total: number;
  pct: number;
  onPctChange: (v: number) => void;
  currency: string;
}) {
  const value = Math.round((total * pct) / 100);
  return (
    <tr className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
      <td className="px-3 py-2 text-[12.5px]">{label}</td>
      <td className="px-3 py-2">
        <input
          className={inputClass}
          type="number"
          value={pct}
          onChange={(e) => onPctChange(Number(e.target.value))}
        />
      </td>
      <td className="px-3 py-2 font-mono text-[12.5px]" style={{ color: "var(--elev8-g500)" }}>
        {value} {currency}
      </td>
    </tr>
  );
}

export function IcvForm({
  initial,
  lockedFields,
  conditions,
}: {
  initial: IcvPayloadInput;
  lockedFields: string[];
  conditions: PillarConditionRow[];
}) {
  const [form, setForm] = useState(initial);
  const [scoreTab, setScoreTab] = useState<string>(ICV_SCORE_TABS[0][0]);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveIcvPayloadAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  const band = form.scoreBand;
  const bandOk = band.bronze < band.silver && band.silver < band.gold && band.gold <= band.platinum;

  function addObligationRow() {
    setForm((f) => ({
      ...f,
      obligationAllocation: [
        ...f.obligationAllocation,
        { sector: "New Sector", micro: 15, small: 12, medium: 10, lcc: 18, riyada: 15 },
      ],
    }));
  }

  function updateObligationRow(index: number, key: string, value: string) {
    setForm((f) => ({
      ...f,
      obligationAllocation: f.obligationAllocation.map((o, i) =>
        i === index ? { ...o, [key]: key === "sector" ? value : Number(value) } : o,
      ),
    }));
  }

  function removeObligationRow(index: number) {
    setForm((f) => ({ ...f, obligationAllocation: f.obligationAllocation.filter((_, i) => i !== index) }));
  }

  // No currency source built for ICV yet -- Company Corporate
  // Classification (S.corporateClass.currency in the mockup) doesn't
  // exist in this schema. Falls back to a plain unit label.
  const currency = "Mn";

  return (
    <div className="max-w-[920px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        ICV / Local Content
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        Governance sets the rules, Procurement creates demand, Import
        reveals dependency, Export grows markets, Investment builds
        capacity. ICV is what turns all of that into domestic value that
        compounds. Every percentage below is an independently
        configurable award weight, not a single 100% split.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
          style={{ borderColor: "var(--elev8-g100)" }}
        >
          <SettingsGroup
            title="ICV control configuration"
            summary={bandOk ? "In order" : "Out of order"}
            isComplete={form.enabled && bandOk}
            defaultOpen
          >
            <div className="mb-5 flex items-center gap-3">
              <Toggle on={form.enabled} onClick={() => setForm((f) => ({ ...f, enabled: !f.enabled }))} />
              <span className="text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                Master enablement of ICV system
              </span>
            </div>
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              ICV performance score band
            </label>
            {!bandOk && (
              <p className="mb-2 text-[12.5px]" style={{ color: "var(--elev8-red)" }}>
                Out of order: bands must satisfy bronze &lt; silver &lt;
                gold &le; platinum.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              {(["bronze", "silver", "gold", "platinum"] as const).map((tier) => (
                <div key={tier} className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium capitalize" style={{ color: "var(--elev8-g600)" }}>
                    {tier}
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    value={form.scoreBand[tier]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, scoreBand: { ...f.scoreBand, [tier]: Number(e.target.value) } }))
                    }
                  />
                </div>
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Obligation enforcement allocation (sector-wise)"
            summary={`${form.obligationAllocation.length} sectors`}
            isComplete={form.obligationAllocation.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Percentage of total contract spend each sector must
              obligate to national classification and special
              categories.
            </p>
            {form.obligationAllocation.length > 0 && (
              <div className="mb-3 overflow-x-auto rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr style={{ background: "var(--elev8-g50)" }}>
                      {["Sector", "Micro %", "Small %", "Medium %", "LCC %", "Riyada %", ""].map((h) => (
                        <th key={h} className="whitespace-nowrap px-2 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.obligationAllocation.map((o, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                        <td className="px-2 py-1.5"><input className={inputClass} value={o.sector} onChange={(e) => updateObligationRow(i, "sector", e.target.value)} /></td>
                        <td className="px-2 py-1.5"><input className={inputClass} type="number" value={o.micro} onChange={(e) => updateObligationRow(i, "micro", e.target.value)} /></td>
                        <td className="px-2 py-1.5"><input className={inputClass} type="number" value={o.small} onChange={(e) => updateObligationRow(i, "small", e.target.value)} /></td>
                        <td className="px-2 py-1.5"><input className={inputClass} type="number" value={o.medium} onChange={(e) => updateObligationRow(i, "medium", e.target.value)} /></td>
                        <td className="px-2 py-1.5"><input className={inputClass} type="number" value={o.lcc} onChange={(e) => updateObligationRow(i, "lcc", e.target.value)} /></td>
                        <td className="px-2 py-1.5"><input className={inputClass} type="number" value={o.riyada} onChange={(e) => updateObligationRow(i, "riyada", e.target.value)} /></td>
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => removeObligationRow(i)} className="text-[12px] font-medium" style={{ color: "var(--elev8-red)" }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button type="button" onClick={addObligationRow} className="text-[13px] font-medium" style={{ color: "var(--elev8-blue)" }}>
              + Add sector
            </button>
          </SettingsGroup>

          <SettingsGroup
            title="ICV templates builder"
            summary="5 template categories"
            isComplete={Object.values(form.templates).some((v) => v.length > 0)}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              These template categories feed the Contribution Score and
              Spend-Target sections directly.
            </p>
            {(
              [
                ["fixedAssets", "Investment in fixed assets categories"],
                ["csrHeads", "ICV CSR spend heads"],
                ["inDemandProducts", "In-demand products"],
                ["inDemandServices", "In-demand services"],
                ["capabilityDev", "Supplier capability development categories"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="mb-4">
                <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  {label} ({form.templates[key].length})
                </label>
                <ChipListEditor
                  items={form.templates[key]}
                  onChange={(items) => setForm((f) => ({ ...f, templates: { ...f.templates, [key]: items } }))}
                  placeholder="Add category"
                />
              </div>
            ))}
          </SettingsGroup>

          <SettingsGroup
            title="ICV contribution score, award metrics configuration"
            summary={`${ICV_SCORE_TABS.find(([k]) => k === scoreTab)?.[1]} tab`}
            isComplete
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Percentage of award allocation of spend based on Supplier /
              Enterprise Contribution Score. Configure each pillar of
              spend independently.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {ICV_SCORE_TABS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setScoreTab(key)}
                  className="rounded-full px-3 py-1 text-[12px] font-medium transition-colors"
                  style={
                    scoreTab === key
                      ? { background: "var(--elev8-blue)", color: "white" }
                      : { background: "var(--elev8-g100)", color: "var(--elev8-g600)" }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Category</th>
                    <th className="w-32 px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Contribution %</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ICV_SCORE_LABELS[scoreTab]).map(([key, label]) => (
                    <tr key={key} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                      <td className="px-3 py-2">{label}</td>
                      <td className="px-3 py-2">
                        <input
                          className={inputClass}
                          type="number"
                          value={form.contributionScore[scoreTab]?.[key] ?? 0}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              contributionScore: {
                                ...f.contributionScore,
                                [scoreTab]: {
                                  ...f.contributionScore[scoreTab],
                                  [key]: Number(e.target.value),
                                },
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="ICV spend, targets configuration"
            summary={`Goods total ${form.spendTargets.procGoodsTotal}`}
            isComplete={form.spendTargets.procGoodsTotal > 0}
          >
            <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Financial-year and sector-wise spend targets. Set a total,
              then allocate it by percentage; value computes
              automatically.
            </p>

            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Procurement, goods
            </label>
            <div className="mb-2 max-w-[280px]">
              <input
                className={inputClass}
                type="number"
                placeholder="Total goods spend"
                value={form.spendTargets.procGoodsTotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procGoodsTotal: Number(e.target.value) } }))
                }
              />
            </div>
            <div className="mb-5 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Category</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Percentage</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <PercentValueRow label="National" total={form.spendTargets.procGoodsTotal} pct={form.spendTargets.procGoodsNationalPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procGoodsNationalPct: v } }))} />
                  <PercentValueRow label="International" total={form.spendTargets.procGoodsTotal} pct={form.spendTargets.procGoodsIntlPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procGoodsIntlPct: v } }))} />
                  <PercentValueRow label="MSME obligation spend" total={form.spendTargets.procGoodsTotal} pct={form.spendTargets.procGoodsMsmePct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procGoodsMsmePct: v } }))} />
                  <PercentValueRow label="LCC spend" total={form.spendTargets.procGoodsTotal} pct={form.spendTargets.procGoodsLccPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procGoodsLccPct: v } }))} />
                  <PercentValueRow label="National product spend" total={form.spendTargets.procGoodsTotal} pct={form.spendTargets.procGoodsNatProdPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procGoodsNatProdPct: v } }))} />
                </tbody>
              </table>
            </div>

            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Procurement, services
            </label>
            <div className="mb-2 max-w-[280px]">
              <input
                className={inputClass}
                type="number"
                placeholder="Total services spend"
                value={form.spendTargets.procServicesTotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procServicesTotal: Number(e.target.value) } }))
                }
              />
            </div>
            <div className="mb-5 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Category</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Percentage</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <PercentValueRow label="National" total={form.spendTargets.procServicesTotal} pct={form.spendTargets.procServicesNationalPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procServicesNationalPct: v } }))} />
                  <PercentValueRow label="International" total={form.spendTargets.procServicesTotal} pct={form.spendTargets.procServicesIntlPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procServicesIntlPct: v } }))} />
                  <PercentValueRow label="MSME obligation spend" total={form.spendTargets.procServicesTotal} pct={form.spendTargets.procServicesMsmePct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procServicesMsmePct: v } }))} />
                  <PercentValueRow label="LCC spend" total={form.spendTargets.procServicesTotal} pct={form.spendTargets.procServicesLccPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, procServicesLccPct: v } }))} />
                </tbody>
              </table>
            </div>

            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Investment, new investments
            </label>
            <div className="mb-2 max-w-[280px]">
              <input
                className={inputClass}
                type="number"
                placeholder="Total new investment spend"
                value={form.spendTargets.investNewTotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, investNewTotal: Number(e.target.value) } }))
                }
              />
            </div>
            <div className="mb-5 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Category</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Percentage</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <PercentValueRow label="MSME" total={form.spendTargets.investNewTotal} pct={form.spendTargets.investMsmePct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, investMsmePct: v } }))} />
                  <PercentValueRow label="Large" total={form.spendTargets.investNewTotal} pct={form.spendTargets.investLargePct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, investLargePct: v } }))} />
                  <PercentValueRow label="LCC spend" total={form.spendTargets.investNewTotal} pct={form.spendTargets.investLccPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, investLccPct: v } }))} />
                </tbody>
              </table>
            </div>

            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Workforce, salaries
            </label>
            <div className="mb-2 max-w-[280px]">
              <input
                className={inputClass}
                type="number"
                placeholder="Target salaries spend"
                value={form.spendTargets.workforceSalaryTotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, workforceSalaryTotal: Number(e.target.value) } }))
                }
              />
            </div>
            <div className="mb-5 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Category</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Percentage</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <PercentValueRow label="National" total={form.spendTargets.workforceSalaryTotal} pct={form.spendTargets.workforceNationalPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, workforceNationalPct: v } }))} />
                  <PercentValueRow label="Nationalisation of workforce count" total={form.spendTargets.workforceSalaryTotal} pct={form.spendTargets.workforceNationalisationPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, workforceNationalisationPct: v } }))} />
                </tbody>
              </table>
            </div>

            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Supplier development
            </label>
            <div className="mb-2 max-w-[280px]">
              <input
                className={inputClass}
                type="number"
                placeholder="Target spend"
                value={form.spendTargets.supplierDevTotal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, supplierDevTotal: Number(e.target.value) } }))
                }
              />
            </div>
            <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Classification</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Percentage</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  <PercentValueRow label="Micro" total={form.spendTargets.supplierDevTotal} pct={form.spendTargets.supplierDevMicroPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, supplierDevMicroPct: v } }))} />
                  <PercentValueRow label="Small" total={form.spendTargets.supplierDevTotal} pct={form.spendTargets.supplierDevSmallPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, supplierDevSmallPct: v } }))} />
                  <PercentValueRow label="Medium" total={form.spendTargets.supplierDevTotal} pct={form.spendTargets.supplierDevMediumPct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, supplierDevMediumPct: v } }))} />
                  <PercentValueRow label="Large" total={form.spendTargets.supplierDevTotal} pct={form.spendTargets.supplierDevLargePct} currency={currency} onPctChange={(v) => setForm((f) => ({ ...f, spendTargets: { ...f.spendTargets, supplierDevLargePct: v } }))} />
                </tbody>
              </table>
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

      <PillarGovernancePanel pillar="icv" lockedFields={lockedFields} conditions={conditions} />
    </div>
  );
}
