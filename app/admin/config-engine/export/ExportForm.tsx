"use client";

/**
 * app/admin/config-engine/export/ExportForm.tsx
 */

import { useState, useTransition } from "react";
import {
  CORRIDOR_STATUSES,
  QUARTERS,
  TRADE_FINANCE_INSTRUMENTS,
  IMPORT_INCOTERMS,
  type ExportPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import type {
  FreeTradeAgreementRow,
  HsCodePackRow,
  HsCodeRow,
  PillarConditionRow,
  PortAirportRow,
} from "@/lib/modules/config-engine/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import { PillarGovernancePanel } from "@/components/PillarGovernancePanel";
import { Tag, StatusBadge, Banner, PageBanner } from "@/components/ui";
import { ArrowUpFromLine } from "lucide-react";
import { saveExportPayloadAction } from "./actions";

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

export function ExportForm({
  initial,
  lockedFields,
  conditions,
  portsAirports,
  hsCodes,
  hsCodePacks,
  ftas,
}: {
  initial: ExportPayloadInput;
  lockedFields: string[];
  conditions: PillarConditionRow[];
  portsAirports: PortAirportRow[];
  hsCodes: HsCodeRow[];
  hsCodePacks: HsCodePackRow[];
  ftas: FreeTradeAgreementRow[];
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
      const result = await saveExportPayloadAction(form);
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

  function ftaCoverageFor(destination: string) {
    return ftas.find(
      (f) => f.status === "In Force" && f.partner_countries.includes(destination),
    );
  }

  function applyHsCodePack(codes: string[]) {
    setForm((f) => ({ ...f, hsCodes: Array.from(new Set([...f.hsCodes, ...codes])) }));
  }

  function addTargetMarket() {
    setForm((f) => ({
      ...f,
      targetCountries: [
        ...f.targetCountries,
        { country: "", budget: 0, year: String(new Date().getFullYear()), quarter: "Q1" as const },
      ],
    }));
  }

  function updateTargetMarket(index: number, key: string, value: string) {
    setForm((f) => ({
      ...f,
      targetCountries: f.targetCountries.map((t, i) =>
        i === index ? { ...t, [key]: key === "budget" ? Number(value) : value } : t,
      ),
    }));
  }

  function removeTargetMarket(index: number) {
    setForm((f) => ({ ...f, targetCountries: f.targetCountries.filter((_, i) => i !== index) }));
  }

  function addCorridor() {
    setForm((f) => ({
      ...f,
      corridors: [
        ...f.corridors,
        {
          origin: "",
          destination: f.targetCountries[0]?.country ?? "",
          status: "Emerging" as const,
          port: null,
        },
      ],
    }));
  }

  function updateCorridor(index: number, key: string, value: string) {
    setForm((f) => ({
      ...f,
      corridors: f.corridors.map((c, i) => (i === index ? { ...c, [key]: value || null } : c)),
    }));
  }

  function removeCorridor(index: number) {
    setForm((f) => ({ ...f, corridors: f.corridors.filter((_, i) => i !== index) }));
  }

  const readinessTotal =
    form.readinessWeights.productReadiness +
    form.readinessWeights.certifications +
    form.readinessWeights.quality +
    form.readinessWeights.pricing +
    form.readinessWeights.logistics +
    form.readinessWeights.financial +
    form.readinessWeights.marketFit;

  const uncoveredMarkets = form.targetCountries
    .map((t) => t.country)
    .filter((c) => c && !form.corridors.some((corridor) => corridor.destination === c));

  return (
    <div className="max-w-[900px]">
      <PageBanner
        icon={ArrowUpFromLine}
        title="Export"
        description="Which sectors to grow abroad, which markets to prioritize, which corridors carry that trade, and how ready an exporter needs to be before the platform actively recommends them into an opportunity."
      />

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
          style={{ borderColor: "var(--elev8-g100)" }}
        >
          <SettingsGroup
            title="Priority export sectors"
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
            title="Target export markets"
            summary={
              form.targetCountries.length === 0
                ? "None added"
                : `${form.targetCountries.length} markets`
            }
            isComplete={form.targetCountries.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Each target market carries its own promotion budget and
              planned timeline.
            </p>
            {form.targetCountries.length > 0 && (
              <div className="mb-3 space-y-2">
                {form.targetCountries.map((t, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end">
                    <input
                      className={inputClass}
                      placeholder="Country name"
                      value={t.country}
                      onChange={(e) => updateTargetMarket(i, "country", e.target.value)}
                    />
                    <input
                      className={inputClass}
                      type="number"
                      placeholder="Budget"
                      value={t.budget}
                      onChange={(e) => updateTargetMarket(i, "budget", e.target.value)}
                    />
                    <input
                      className={inputClass}
                      placeholder="Year"
                      value={t.year}
                      onChange={(e) => updateTargetMarket(i, "year", e.target.value)}
                    />
                    <select
                      className={inputClass}
                      value={t.quarter}
                      onChange={(e) => updateTargetMarket(i, "quarter", e.target.value)}
                    >
                      {QUARTERS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeTargetMarket(i)}
                      className="text-[12px] font-medium"
                      style={{ color: "var(--elev8-red)" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={addTargetMarket}
              className="text-[13px] font-medium"
              style={{ color: "var(--elev8-blue)" }}
            >
              + Add target market
            </button>
          </SettingsGroup>

          <SettingsGroup
            title="Trade corridors"
            summary={form.corridors.length === 0 ? "None added" : `${form.corridors.length} corridors`}
            isComplete={form.corridors.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Each corridor pairs this country with a destination market.
              FTA coverage is informational, read from Master Data, and
              never changes a duty band automatically.
            </p>
            {form.corridors.length > 0 && (
              <div className="mb-3 space-y-2">
                {form.corridors.map((c, i) => {
                  const fta = c.destination ? ftaCoverageFor(c.destination) : undefined;
                  return (
                    <div key={i} className="rounded-md border p-3" style={{ borderColor: "var(--elev8-g200)" }}>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.5fr_1fr_1.5fr_auto]">
                        <select
                          className={inputClass}
                          value={c.destination}
                          onChange={(e) => updateCorridor(i, "destination", e.target.value)}
                        >
                          <option value="">Select destination</option>
                          {form.targetCountries.map((t) => (
                            <option key={t.country} value={t.country}>
                              {t.country}
                            </option>
                          ))}
                        </select>
                        <select
                          className={inputClass}
                          value={c.status}
                          onChange={(e) => updateCorridor(i, "status", e.target.value)}
                        >
                          {CORRIDOR_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <select
                          className={inputClass}
                          value={c.port ?? ""}
                          onChange={(e) => updateCorridor(i, "port", e.target.value)}
                        >
                          <option value="">Select logistics gateway</option>
                          {portsAirports.map((p) => (
                            <option key={p.id} value={p.name}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCorridor(i)}
                          className="text-[12px] font-medium"
                          style={{ color: "var(--elev8-red)" }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2">
                        {fta ? (
                          <StatusBadge tone="success" label={`FTA: ${fta.agreement_name}`} />
                        ) : (
                          <span className="text-[11.5px]" style={{ color: "var(--elev8-g400)" }}>
                            No FTA coverage on file
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button
              type="button"
              onClick={addCorridor}
              className="text-[13px] font-medium"
              style={{ color: "var(--elev8-blue)" }}
            >
              + Add trade corridor
            </button>

            {uncoveredMarkets.length > 0 && (
              <Banner tone="warning">
                {uncoveredMarkets.length} target market(s) have no
                corridor configured yet: {uncoveredMarkets.join(", ")}.
                Buyer-matching intelligence won&apos;t cover these
                markets until a corridor is added.
              </Banner>
            )}
          </SettingsGroup>

          <SettingsGroup
            title="Priority HS codes"
            summary={form.hsCodes.length === 0 ? "None selected" : `${form.hsCodes.length} codes`}
            isComplete={form.hsCodes.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Selected from Master Data. Corridor opportunity scoring and
              buyer-matching key off HS code, not just sector.
            </p>
            {hsCodePacks.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {hsCodePacks.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => applyHsCodePack(pack.codes)}
                    className="rounded-md border px-3 py-1.5 text-[12px] font-medium"
                    style={{ borderColor: "var(--elev8-g200)", color: "var(--elev8-blue)" }}
                  >
                    Apply {pack.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {hsCodes.map((h) => (
                <Chip
                  key={h.id}
                  label={`${h.code} - ${h.category}`}
                  on={form.hsCodes.includes(h.code)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      hsCodes: f.hsCodes.includes(h.code)
                        ? f.hsCodes.filter((c) => c !== h.code)
                        : [...f.hsCodes, h.code],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Supported Incoterms"
            summary={form.incoterms.length === 0 ? "None enabled" : form.incoterms.join(", ")}
            isComplete={form.incoterms.length > 0}
          >
            <div className="flex flex-wrap gap-2">
              {IMPORT_INCOTERMS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  on={form.incoterms.includes(t)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      incoterms: f.incoterms.includes(t)
                        ? f.incoterms.filter((i) => i !== t)
                        : [...f.incoterms, t],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Export trade finance instruments"
            summary={form.tradeFinance.length === 0 ? "None enabled" : form.tradeFinance.join(", ")}
            isComplete={form.tradeFinance.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Which financing instruments an exporter can reference in a
              quotation or contract.
            </p>
            <div className="flex flex-wrap gap-2">
              {TRADE_FINANCE_INSTRUMENTS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  on={form.tradeFinance.includes(t)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      tradeFinance: f.tradeFinance.includes(t)
                        ? f.tradeFinance.filter((i) => i !== t)
                        : [...f.tradeFinance, t],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Export incentives"
            summary={form.incentives.length === 0 ? "None added" : form.incentives.join(", ")}
            isComplete={form.incentives.length > 0}
          >
            <ChipListEditor
              items={form.incentives}
              onChange={(incentives) => setForm((f) => ({ ...f, incentives }))}
              placeholder="Add an export incentive"
            />
          </SettingsGroup>

          <SettingsGroup
            title="Export readiness weighting"
            summary={`Totals ${readinessTotal}%`}
            isComplete={readinessTotal === 100}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Scores every organization&apos;s Export Readiness (0-100).
              Companies below the recommendation threshold see
              improvement guidance instead of live buyer matches. Must
              total 100%.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["productReadiness", "Product readiness"],
                  ["certifications", "Certifications"],
                  ["quality", "Quality standards"],
                  ["pricing", "Pricing competitiveness"],
                  ["logistics", "Logistics capability"],
                  ["financial", "Financial readiness"],
                  ["marketFit", "Target market fit"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
                    {label}
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    value={form.readinessWeights[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        readinessWeights: { ...f.readinessWeights, [key]: Number(e.target.value) },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            {readinessTotal !== 100 && (
              <p className="mt-2 text-[12px]" style={{ color: "var(--elev8-red)" }}>
                Currently totals {readinessTotal}%, must equal 100%.
              </p>
            )}
            {fieldErrors.productReadiness?.map((m) => (
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

      <PillarGovernancePanel pillar="export" lockedFields={lockedFields} conditions={conditions} />
    </div>
  );
}
