"use client";

/**
 * app/admin/config-engine/investment/InvestmentForm.tsx
 */

import { useState, useTransition } from "react";
import {
  DUE_DILIGENCE_TYPES,
  IC_WORKFLOW_STAGES,
  type InvestmentPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import type { PillarConditionRow, ZoneRow } from "@/lib/modules/config-engine/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import { PillarGovernancePanel } from "@/components/PillarGovernancePanel";
import { Tag } from "@/components/ui";
import { saveInvestmentPayloadAction } from "./actions";

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

export function InvestmentForm({
  initial,
  lockedFields,
  conditions,
  zones,
}: {
  initial: InvestmentPayloadInput;
  lockedFields: string[];
  conditions: PillarConditionRow[];
  zones: ZoneRow[];
}) {
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
      const result = await saveInvestmentPayloadAction(form);
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

  const rb = form.riskBands;
  const riskBandOk = rb.low < rb.moderate && rb.moderate < rb.elevated && rb.elevated <= rb.high;

  const matchTotal =
    form.investorMatchWeights.sectorFit +
    form.investorMatchWeights.riskAppetite +
    form.investorMatchWeights.esgAlignment +
    form.investorMatchWeights.icvPotential +
    form.investorMatchWeights.returnProfile;

  const noIncentiveBands = form.ticketBands.filter((t) => t.max <= form.icThreshold);

  return (
    <div className="max-w-[860px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Investment
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        Which sectors the country actively promotes to investors, what
        incentives exist, how due diligence and committee governance
        work, and how investor profiles get matched to opportunities.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
          style={{ borderColor: "var(--elev8-g100)" }}
        >
          <SettingsGroup
            title="Priority investment sectors"
            summary={form.prioritySectors.length === 0 ? "None added" : form.prioritySectors.join(", ")}
            isComplete={form.prioritySectors.length > 0}
            defaultOpen
          >
            <ChipListEditor
              items={form.prioritySectors}
              onChange={(prioritySectors) => setForm((f) => ({ ...f, prioritySectors }))}
              placeholder="Add a priority sector"
            />
          </SettingsGroup>

          <SettingsGroup
            title="Investment incentives and special economic zones"
            summary={`${form.incentives.length} incentives, ${form.sez.length} zones`}
            isComplete={form.incentives.length > 0 || form.sez.length > 0}
          >
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Incentives
            </label>
            <ChipListEditor
              items={form.incentives}
              onChange={(incentives) => setForm((f) => ({ ...f, incentives }))}
              placeholder="Add an incentive"
            />
            <div className="my-4 h-px" style={{ background: "var(--elev8-g100)" }} />
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Special economic zones / free zones
            </label>
            {zones.length === 0 ? (
              <p
                className="rounded-md px-3 py-2 text-[12.5px]"
                style={{ background: "#FFF7E6", color: "#8A6A1A" }}
              >
                No zones defined in Master Data yet. Add at least one
                there first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {zones.map((z) => (
                  <Chip
                    key={z.id}
                    label={`${z.name} (${z.type})`}
                    on={form.sez.includes(z.name)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        sez: f.sez.includes(z.name)
                          ? f.sez.filter((s) => s !== z.name)
                          : [...f.sez, z.name],
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </SettingsGroup>

          <SettingsGroup
            title="Investment ticket bands (US$ millions)"
            summary={`${form.ticketBands.length} bands`}
            isComplete={form.ticketBands.length > 0}
          >
            <div className="overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
              <table className="w-full text-start text-[12.5px]">
                <thead>
                  <tr style={{ background: "var(--elev8-g50)" }}>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Band</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Min ($M)</th>
                    <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Max ($M)</th>
                  </tr>
                </thead>
                <tbody>
                  {form.ticketBands.map((band, i) => (
                    <tr key={band.label} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                      <td className="px-3 py-2 font-medium">{band.label}</td>
                      <td className="px-3 py-2">
                        <input
                          className={inputClass}
                          type="number"
                          value={band.min}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              ticketBands: f.ticketBands.map((b, idx) =>
                                idx === i ? { ...b, min: Number(e.target.value) } : b,
                              ),
                            }))
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className={inputClass}
                          type="number"
                          value={band.max}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              ticketBands: f.ticketBands.map((b, idx) =>
                                idx === i ? { ...b, max: Number(e.target.value) } : b,
                              ),
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
            title="Due diligence requirements"
            summary={
              form.dueDiligenceRequired.length === 0
                ? "None required"
                : form.dueDiligenceRequired.join(", ")
            }
            isComplete={form.dueDiligenceRequired.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Every opportunity moving toward commitment must clear
              these due-diligence categories before it reaches the
              Investment Committee.
            </p>
            <div className="flex flex-wrap gap-2">
              {DUE_DILIGENCE_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  on={form.dueDiligenceRequired.includes(t)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      dueDiligenceRequired: f.dueDiligenceRequired.includes(t)
                        ? f.dueDiligenceRequired.filter((d) => d !== t)
                        : [...f.dueDiligenceRequired, t],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Investment committee governance"
            summary={`Review above $${form.icThreshold}M`}
            isComplete={form.icThreshold > 0}
          >
            <div className="max-w-[280px]">
              <label className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                Committee review required above ($M)
              </label>
              <input
                className={inputClass}
                type="number"
                value={form.icThreshold}
                onChange={(e) => setForm((f) => ({ ...f, icThreshold: Number(e.target.value) }))}
              />
            </div>
            <div className="my-4 h-px" style={{ background: "var(--elev8-g100)" }} />
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Approval workflow (reference)
            </label>
            <div className="flex flex-wrap gap-2">
              {IC_WORKFLOW_STAGES.map((s) => (
                <RefChip key={s} label={s} />
              ))}
            </div>
            {noIncentiveBands.length > 0 && (
              <p
                className="mt-3 rounded-md px-3 py-2 text-[12.5px]"
                style={{ background: "#FFF7E6", color: "#8A6A1A" }}
              >
                {noIncentiveBands.length} ticket band(s) fall entirely
                below the committee review threshold:{" "}
                {noIncentiveBands.map((t) => t.label).join(", ")}. These
                deals will never reach committee governance.
              </p>
            )}
          </SettingsGroup>

          <SettingsGroup
            title="Risk classification bands"
            summary={riskBandOk ? "In order" : "Out of order"}
            isComplete={riskBandOk}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Every opportunity&apos;s Trade/Investment Risk Score
              (0-100) falls into one of these bands.
            </p>
            {!riskBandOk && (
              <p className="mb-3 text-[12.5px]" style={{ color: "var(--elev8-red)" }}>
                Out of order: bands must satisfy low &lt; moderate &lt;
                elevated &le; high.
              </p>
            )}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Low, below
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.riskBands.low}
                  onChange={(e) => setForm((f) => ({ ...f, riskBands: { ...f.riskBands, low: Number(e.target.value) } }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Moderate, below
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.riskBands.moderate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, riskBands: { ...f.riskBands, moderate: Number(e.target.value) } }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  Elevated, below
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.riskBands.elevated}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, riskBands: { ...f.riskBands, elevated: Number(e.target.value) } }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                  High, up to
                </label>
                <input
                  className={inputClass}
                  type="number"
                  value={form.riskBands.high}
                  onChange={(e) => setForm((f) => ({ ...f, riskBands: { ...f.riskBands, high: Number(e.target.value) } }))}
                />
              </div>
            </div>
            {fieldErrors.low?.map((m) => (
              <p key={m} className="mt-2 text-[12px]" style={{ color: "var(--elev8-red)" }}>
                {m}
              </p>
            ))}
          </SettingsGroup>

          <SettingsGroup
            title="Investor <-> opportunity matching weighting"
            summary={`Totals ${matchTotal}%`}
            isComplete={matchTotal === 100}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Must total 100%.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["sectorFit", "Sector fit"],
                  ["riskAppetite", "Risk appetite fit"],
                  ["esgAlignment", "ESG alignment"],
                  ["icvPotential", "ICV / local content potential"],
                  ["returnProfile", "Return profile fit"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                    {label}
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    value={form.investorMatchWeights[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        investorMatchWeights: { ...f.investorMatchWeights, [key]: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            {matchTotal !== 100 && (
              <p className="mt-2 text-[12px]" style={{ color: "var(--elev8-red)" }}>
                Currently totals {matchTotal}%, must equal 100%.
              </p>
            )}
            {fieldErrors.sectorFit?.map((m) => (
              <p key={m} className="mt-1 text-[12px]" style={{ color: "var(--elev8-red)" }}>
                {m}
              </p>
            ))}
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

      <PillarGovernancePanel pillar="investment" lockedFields={lockedFields} conditions={conditions} />
    </div>
  );
}
