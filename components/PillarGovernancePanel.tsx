"use client";

/**
 * components/PillarGovernancePanel.tsx
 *
 * Shared across every pillar's UI. Two things a Country Admin manages
 * here: which dot-notation fields in this pillar are locked (a delegated
 * state cannot override them, see resolve_pillar_config()'s locked_fields
 * handling), and sector/location conditions (rule variations that apply
 * on top of the resolved config for a company matching that condition).
 *
 * Deliberately a technical/advanced panel -- override payloads are typed
 * as raw JSON, not a dynamic form matching each pillar's own field shape.
 * Building a form generator that adapts to any pillar's schema is a real,
 * separate piece of work; raw JSON is an honest, shippable v1 for what is
 * already an advanced, admin-only feature.
 */

import { useState, useTransition } from "react";
import type { PillarId } from "@/lib/modules/config-engine/stages";
import type { PillarConditionRow } from "@/lib/modules/config-engine/adapter";
import {
  addConditionAction,
  deleteConditionAction,
  saveLockedFieldsAction,
} from "@/lib/modules/config-engine/pillar-governance-actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

function LockedFieldsEditor({
  pillar,
  initialFields,
}: {
  pillar: PillarId;
  initialFields: string[];
}) {
  const [fields, setFields] = useState(initialFields);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function commit(next: string[]) {
    setError(null);
    startTransition(async () => {
      const result = await saveLockedFieldsAction(pillar, next);
      if (result.ok) {
        setFields(next);
      } else {
        setError(result.error);
      }
    });
  }

  function handleAdd() {
    const value = draft.trim();
    if (!value || fields.includes(value)) return;
    setDraft("");
    commit([...fields, value]);
  }

  return (
    <div>
      <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Dot-notation paths within this pillar that are mandatory
        everywhere. A delegated state can still set its own values for
        everything else, but these exact fields always resolve to your
        country-level value, no matter what a state sets.
      </p>
      {fields.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {fields.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[12px]"
              style={{ background: "#FDECEC", color: "var(--elev8-red)" }}
            >
              {f}
              <button
                type="button"
                onClick={() => commit(fields.filter((x) => x !== f))}
                disabled={isPending}
                className="opacity-70 hover:opacity-100"
                aria-label={`Unlock ${f}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          className={`${inputClass} font-mono`}
          placeholder="e.g. evalWeights.icv"
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
          disabled={isPending}
          className="shrink-0 rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          Lock
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--elev8-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ConditionsEditor({
  pillar,
  initialConditions,
}: {
  pillar: PillarId;
  initialConditions: PillarConditionRow[];
}) {
  const [conditions, setConditions] = useState(initialConditions);
  const [type, setType] = useState<"sector" | "location">("sector");
  const [value, setValue] = useState("");
  const [payloadJson, setPayloadJson] = useState("{}");
  const [priority, setPriority] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await addConditionAction(pillar, type, value, payloadJson, priority);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(payloadJson);
      } catch {
        // already validated server-side; unreachable in practice
      }
      setConditions((c) => [
        ...c,
        { id: `pending-${value}`, condition_type: type, condition_value: value, override_payload: parsed, priority },
      ]);
      setValue("");
      setPayloadJson("{}");
      setPriority(0);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteConditionAction(pillar, id);
      if (result.ok) {
        setConditions((c) => c.filter((x) => x.id !== id));
      }
    });
  }

  return (
    <div>
      <p className="mb-3 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Rule variations by a company&apos;s own sector or location, applied
        on top of the resolved config. E.g. Manufacturing companies get a
        different prequalification threshold.
      </p>

      {conditions.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Type</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Value</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Override</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Priority</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-3 py-2">{c.condition_type}</td>
                  <td className="px-3 py-2">{c.condition_value}</td>
                  <td className="px-3 py-2 font-mono">{JSON.stringify(c.override_payload)}</td>
                  <td className="px-3 py-2">{c.priority}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
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
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            Condition type
          </label>
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value as "sector" | "location")}
          >
            <option value="sector">Sector</option>
            <option value="location">Location</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            {type === "sector" ? "Sector name" : "Location name"}
          </label>
          <input
            className={inputClass}
            placeholder={type === "sector" ? "e.g. Manufacturing" : "e.g. Muscat"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            Override payload (JSON)
          </label>
          <textarea
            className={`${inputClass} font-mono`}
            rows={2}
            placeholder='{"prequalification":{"minScore":80}}'
            value={payloadJson}
            onChange={(e) => setPayloadJson(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            Priority
          </label>
          <input
            className={inputClass}
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--elev8-blue)" }}
          >
            Add condition
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

export function PillarGovernancePanel({
  pillar,
  lockedFields,
  conditions,
}: {
  pillar: PillarId;
  lockedFields: string[];
  conditions: PillarConditionRow[];
}) {
  return (
    <div className="mt-6 rounded-xl border p-5" style={{ borderColor: "var(--elev8-g100)", background: "var(--elev8-g50)" }}>
      <h3 className="mb-1 text-[14px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Delegation controls
      </h3>
      <p className="mb-4 text-[12.5px]" style={{ color: "var(--elev8-g500)" }}>
        Advanced: controls what a delegated State Admin can and cannot
        change in this pillar, and how the resolved config varies by a
        company&apos;s own attributes.
      </p>

      <div className="mb-5">
        <h4 className="mb-2 text-[12.5px] font-semibold" style={{ color: "var(--elev8-g600)" }}>
          Locked fields
        </h4>
        <LockedFieldsEditor pillar={pillar} initialFields={lockedFields} />
      </div>

      <div>
        <h4 className="mb-2 text-[12.5px] font-semibold" style={{ color: "var(--elev8-g600)" }}>
          Sector / location conditions
        </h4>
        <ConditionsEditor pillar={pillar} initialConditions={conditions} />
      </div>
    </div>
  );
}
