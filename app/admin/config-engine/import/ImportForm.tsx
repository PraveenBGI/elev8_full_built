"use client";

/**
 * app/admin/config-engine/import/ImportForm.tsx
 */

import { useState, useTransition } from "react";
import {
  IMPORT_INCOTERMS,
  LANDED_COST_COMPONENTS,
  type ImportPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import type {
  HsCodePackRow,
  HsCodeRow,
  PillarConditionRow,
  PortAirportRow,
} from "@/lib/modules/config-engine/adapter";
import { SettingsGroup } from "@/components/SettingsGroup";
import { PillarGovernancePanel } from "@/components/PillarGovernancePanel";
import { Tag } from "@/components/ui";
import { saveImportPayloadAction } from "./actions";

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ChipListEditor({
  items,
  onChange,
  placeholder,
  danger,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  danger?: boolean;
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
            <Tag
              key={`${item}-${i}`}
              label={item}
              tone={danger ? "danger" : "success"}
              onRemove={() => onChange(items.filter((_, idx) => idx !== i))}
            />
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

export function ImportForm({
  initial,
  lockedFields,
  conditions,
  portsAirports,
  hsCodes,
  hsCodePacks,
}: {
  initial: ImportPayloadInput;
  lockedFields: string[];
  conditions: PillarConditionRow[];
  portsAirports: PortAirportRow[];
  hsCodes: HsCodeRow[];
  hsCodePacks: HsCodePackRow[];
}) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveImportPayloadAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  function applyHsCodePack(codes: string[]) {
    setForm((f) => ({
      ...f,
      hsCodes: Array.from(new Set([...f.hsCodes, ...codes])),
    }));
  }

  function addSubstitution() {
    setForm((f) => ({
      ...f,
      substitutionWatch: [
        ...f.substitutionWatch,
        { product: "New Watch Item", importValue: 100, localSupply: 10, potential: 30 },
      ],
    }));
  }

  function updateSubstitution(index: number, key: string, value: string) {
    setForm((f) => ({
      ...f,
      substitutionWatch: f.substitutionWatch.map((item, i) =>
        i === index
          ? { ...item, [key]: key === "product" ? value : Number(value) }
          : item,
      ),
    }));
  }

  function removeSubstitution(index: number) {
    setForm((f) => ({
      ...f,
      substitutionWatch: f.substitutionWatch.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="max-w-[860px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Import
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        Every import is either a permanent cost or a temporary one.
        Configure what can be imported and at what duty, then use the
        substitution watchlist to flag where high import dependency is
        really a hidden domestic manufacturing opportunity.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
          style={{ borderColor: "var(--elev8-g100)" }}
        >
          <SettingsGroup
            title="Import categories"
            summary={form.categories.length === 0 ? "None added" : `${form.categories.length} categories`}
            isComplete={form.categories.length > 0}
            defaultOpen
          >
            <ChipListEditor
              items={form.categories}
              onChange={(categories) => setForm((f) => ({ ...f, categories }))}
              placeholder="Add an import category"
            />
            <div className="my-4 h-px" style={{ background: "var(--elev8-g100)" }} />
            <label className="mb-2 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              Restricted / prohibited products
            </label>
            <ChipListEditor
              items={form.restricted}
              onChange={(restricted) => setForm((f) => ({ ...f, restricted }))}
              placeholder="Add a restricted product"
              danger
            />
          </SettingsGroup>

          <SettingsGroup
            title="Duty bands"
            summary={`General ${form.dutyBands.general}%`}
            isComplete={form.dutyBands.general > 0}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="General duty (%)">
                <input
                  className={inputClass}
                  type="number"
                  value={form.dutyBands.general}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dutyBands: { ...f.dutyBands, general: Number(e.target.value) } }))
                  }
                />
              </Field>
              <Field label="Foodstuffs (%)">
                <input
                  className={inputClass}
                  type="number"
                  value={form.dutyBands.foodstuffs}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dutyBands: { ...f.dutyBands, foodstuffs: Number(e.target.value) } }))
                  }
                />
              </Field>
              <Field label="Industrial inputs (%)">
                <input
                  className={inputClass}
                  type="number"
                  value={form.dutyBands.industrialInputs}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      dutyBands: { ...f.dutyBands, industrialInputs: Number(e.target.value) },
                    }))
                  }
                />
              </Field>
              <Field label="Luxury / sin goods (%)">
                <input
                  className={inputClass}
                  type="number"
                  value={form.dutyBands.luxury}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dutyBands: { ...f.dutyBands, luxury: Number(e.target.value) } }))
                  }
                />
              </Field>
            </div>
            <label className="mt-4 flex items-center gap-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
              <input
                type="checkbox"
                checked={form.licensingRequired}
                onChange={(e) => setForm((f) => ({ ...f, licensingRequired: e.target.checked }))}
                className="h-4 w-4 accent-[var(--elev8-blue)]"
              />
              Import licensing required
            </label>
          </SettingsGroup>

          <SettingsGroup
            title="Customs entry points"
            summary={form.customsPoints.length === 0 ? "None selected" : `${form.customsPoints.length} selected`}
            isComplete={form.customsPoints.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Selected from the national Ports, Airports &amp; Customs
              Points list configured in Master Data. Shipments can only be
              routed through and cleared at a named point below.
            </p>
            {portsAirports.length === 0 ? (
              <p
                className="rounded-md px-3 py-2 text-[12.5px]"
                style={{ background: "#FFF7E6", color: "#8A6A1A" }}
              >
                No Ports, Airports or Customs Points defined in Master
                Data yet. Add at least one there first.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {portsAirports.map((p) => (
                  <Chip
                    key={p.id}
                    label={`${p.name} (${p.type})`}
                    on={form.customsPoints.includes(p.name)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        customsPoints: f.customsPoints.includes(p.name)
                          ? f.customsPoints.filter((c) => c !== p.name)
                          : [...f.customsPoints, p.name],
                      }))
                    }
                  />
                ))}
              </div>
            )}
          </SettingsGroup>

          <SettingsGroup
            title="HS code coverage"
            summary={form.hsCodes.length === 0 ? "None selected" : `${form.hsCodes.length} codes`}
            isComplete={form.hsCodes.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Selected from Master Data. Links each import category to
              the harmonized codes customs actually clears against.
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
                    title={pack.description ?? undefined}
                  >
                    Apply {pack.name}
                  </button>
                ))}
              </div>
            )}
            {hsCodes.length === 0 ? (
              <p
                className="rounded-md px-3 py-2 text-[12.5px]"
                style={{ background: "#FFF7E6", color: "#8A6A1A" }}
              >
                No HS codes defined in Master Data yet.
              </p>
            ) : (
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
            )}
          </SettingsGroup>

          <SettingsGroup
            title="Supported Incoterms"
            summary={form.incoterms.length === 0 ? "None enabled" : form.incoterms.join(", ")}
            isComplete={form.incoterms.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Which Incoterms 2020 rules the platform recognizes for
              risk, cost and customs-clearance responsibility on an
              import transaction.
            </p>
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
            title="Landed cost calculator components"
            summary={
              form.landedCostComponents.length === 0
                ? "None enabled"
                : `${form.landedCostComponents.length} components`
            }
            isComplete={form.landedCostComponents.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              An importer should never see product price alone. These
              are the components summed into Total Landed Cost
              everywhere on the platform.
            </p>
            <div className="flex flex-wrap gap-2">
              {LANDED_COST_COMPONENTS.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  on={form.landedCostComponents.includes(t)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      landedCostComponents: f.landedCostComponents.includes(t)
                        ? f.landedCostComponents.filter((c) => c !== t)
                        : [...f.landedCostComponents, t],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Import substitution / localization watch"
            summary={
              form.substitutionWatch.length === 0
                ? "No items flagged"
                : `${form.substitutionWatch.length} flagged`
            }
            isComplete={form.substitutionWatch.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Flag high-value, low-local-supply imports here. Each one
              becomes a costed localization opportunity for the
              Investment pillar.
            </p>
            <div className="space-y-3">
              {form.substitutionWatch.map((item, i) => {
                const estValue = Math.round((item.importValue * (item.potential - item.localSupply)) / 100);
                return (
                  <div
                    key={i}
                    className="rounded-md border p-3"
                    style={{ borderColor: "var(--elev8-g200)", background: "var(--elev8-g50)" }}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <Field label="Product">
                        <input
                          className={inputClass}
                          value={item.product}
                          onChange={(e) => updateSubstitution(i, "product", e.target.value)}
                        />
                      </Field>
                      <Field label="Import value ($M)">
                        <input
                          className={inputClass}
                          type="number"
                          value={item.importValue}
                          onChange={(e) => updateSubstitution(i, "importValue", e.target.value)}
                        />
                      </Field>
                      <Field label="Local supply (%)">
                        <input
                          className={inputClass}
                          type="number"
                          value={item.localSupply}
                          onChange={(e) => updateSubstitution(i, "localSupply", e.target.value)}
                        />
                      </Field>
                      <Field label="Potential (%)">
                        <input
                          className={inputClass}
                          type="number"
                          value={item.potential}
                          onChange={(e) => updateSubstitution(i, "potential", e.target.value)}
                        />
                      </Field>
                    </div>
                    <p className="mt-2 text-[12.5px]" style={{ color: "var(--elev8-g500)" }}>
                      Estimated local value creation if closed:{" "}
                      <strong style={{ color: "var(--elev8-ink)" }}>${estValue}M</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => removeSubstitution(i)}
                      className="mt-2 text-[12px] font-medium"
                      style={{ color: "var(--elev8-red)" }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addSubstitution}
              className="mt-3 text-[13px] font-medium"
              style={{ color: "var(--elev8-blue)" }}
            >
              + Flag a product for localization watch
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

      <PillarGovernancePanel pillar="import" lockedFields={lockedFields} conditions={conditions} />
    </div>
  );
}
