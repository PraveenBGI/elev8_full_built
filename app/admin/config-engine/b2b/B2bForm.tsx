"use client";

/**
 * app/admin/config-engine/b2b/B2bForm.tsx
 */

import { useState, useTransition } from "react";
import {
  BUSINESS_IDENTITIES,
  OPPORTUNITY_TYPES,
  VERIFICATION_LEVELS,
  type B2bPayloadInput,
} from "@/lib/modules/config-engine/schemas";
import { SettingsGroup } from "@/components/SettingsGroup";
import { PillarGovernancePanel } from "@/components/PillarGovernancePanel";
import type { PillarConditionRow } from "@/lib/modules/config-engine/adapter";
import { saveB2bPayloadAction } from "./actions";

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

function CategoryEditor({
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
          placeholder="e.g. Renewable Energy Equipment"
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

export function B2bForm({
  initial,
  lockedFields,
  conditions,
}: {
  initial: B2bPayloadInput;
  lockedFields: string[];
  conditions: PillarConditionRow[];
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
      const result = await saveB2bPayloadAction(form);
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

  const matchWeightsTotal =
    form.matchWeights.industry +
    form.matchWeights.product +
    form.matchWeights.location +
    form.matchWeights.certification +
    form.matchWeights.pastPerformance +
    form.matchWeights.icv;

  return (
    <div className="max-w-[820px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        B2B
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        The connective tissue between every other pillar: where Procurement
        demand meets suppliers, where Import buyers find local
        distributors, and where Export-ready manufacturers get discovered.
      </p>

      <form onSubmit={handleSubmit}>
        <div
          className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
          style={{ borderColor: "var(--elev8-g100)" }}
        >
          <SettingsGroup
            title="Business identities enabled"
            summary={
              form.enabledIdentities.length === 0
                ? "None enabled"
                : form.enabledIdentities.join(", ")
            }
            isComplete={form.enabledIdentities.length > 0}
            defaultOpen
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              An organization can hold multiple identities at once, e.g. a
              company can be both Supplier and Exporter.
            </p>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_IDENTITIES.map((identity) => (
                <Chip
                  key={identity}
                  label={identity}
                  on={form.enabledIdentities.includes(identity)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      enabledIdentities: f.enabledIdentities.includes(identity)
                        ? f.enabledIdentities.filter((i) => i !== identity)
                        : [...f.enabledIdentities, identity],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Marketplace categories"
            summary={form.categories.length === 0 ? "None added" : form.categories.join(", ")}
            isComplete={form.categories.length > 0}
          >
            <CategoryEditor
              items={form.categories}
              onChange={(categories) => setForm((f) => ({ ...f, categories }))}
            />
          </SettingsGroup>

          <SettingsGroup
            title="Opportunity types enabled"
            summary={
              form.opportunityTypes.length === 0
                ? "None enabled"
                : form.opportunityTypes.join(", ")
            }
            isComplete={form.opportunityTypes.length > 0}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Which requirement types organizations can publish and respond
              to on the national B2B network.
            </p>
            <div className="flex flex-wrap gap-2">
              {OPPORTUNITY_TYPES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  on={form.opportunityTypes.includes(t)}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      opportunityTypes: f.opportunityTypes.includes(t)
                        ? f.opportunityTypes.filter((o) => o !== t)
                        : [...f.opportunityTypes, t],
                    }))
                  }
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="Counterparty verification"
            summary={form.requireVerification ? "Required before participation" : "Not required"}
            isComplete={form.requireVerification}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              Determines whether an unverified buyer or supplier can
              transact on the platform, the trust layer every RFQ,
              quotation and contract in every other pillar relies on.
            </p>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
                <input
                  type="checkbox"
                  checked={form.requireVerification}
                  onChange={(e) => setForm((f) => ({ ...f, requireVerification: e.target.checked }))}
                  className="h-4 w-4 accent-[var(--elev8-blue)]"
                />
                Require verification before participation
              </label>
              <Field label="Minimum verification level">
                <select
                  className={inputClass}
                  value={form.minVerificationLevel}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minVerificationLevel: e.target.value as B2bPayloadInput["minVerificationLevel"],
                    }))
                  }
                >
                  {VERIFICATION_LEVELS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </SettingsGroup>

          <SettingsGroup
            title="National matching engine weighting"
            summary={`Totals ${matchWeightsTotal}%`}
            isComplete={matchWeightsTotal === 100}
          >
            <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
              How the Business Match Score is calculated whenever a buyer,
              supplier or investor is matched to an opportunity anywhere on
              the platform. Must total 100%.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ["industry", "Industry match"],
                  ["product", "Product / service match"],
                  ["location", "Location match"],
                  ["certification", "Certification match"],
                  ["pastPerformance", "Past performance"],
                  ["icv", "ICV contribution"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    className={inputClass}
                    type="number"
                    value={form.matchWeights[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        matchWeights: { ...f.matchWeights, [key]: Number(e.target.value) },
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
            {matchWeightsTotal !== 100 && (
              <p className="mt-2 text-[12px]" style={{ color: "var(--elev8-red)" }}>
                Currently totals {matchWeightsTotal}%, must equal 100%.
              </p>
            )}
            {fieldErrors.industry?.map((m) => (
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

      <PillarGovernancePanel pillar="b2b" lockedFields={lockedFields} conditions={conditions} />
    </div>
  );
}
