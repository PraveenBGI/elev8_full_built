"use client";

/**
 * app/admin/config-engine/governance/GovernanceForm.tsx
 *
 * Four sections from the mockup's Governance stage: Government
 * Authorities, Sector Stakeholders (both real tables, cross-pillar
 * reference data), and Escalation Matrix + Data Governance & Access
 * Policy (genuinely governance-specific, stored in pillar_configs).
 */

import { useState, useTransition } from "react";
import {
  AUTHORITY_TYPES,
  AUTHORITY_DOMAINS,
  type AuthorityInput,
  type StakeholderInput,
  type GovernancePayloadInput,
} from "@/lib/modules/config-engine/schemas";
import type { AuthorityRow, StakeholderRow } from "@/lib/modules/config-engine/adapter";
import { SettingsGroup } from "../SettingsGroup";
import {
  addAuthorityAction,
  addStakeholderAction,
  deleteAuthorityAction,
  deleteStakeholderAction,
  saveGovernancePayloadAction,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
        {label}
      </label>
      {children}
      {error?.map((m) => (
        <p key={m} className="text-xs" style={{ color: "var(--elev8-red)" }}>
          {m}
        </p>
      ))}
    </div>
  );
}

function AuthorityTable({ initialAuthorities }: { initialAuthorities: AuthorityRow[] }) {
  const [rows, setRows] = useState(initialAuthorities);
  const [draft, setDraft] = useState<AuthorityInput>({
    name: "",
    type: AUTHORITY_TYPES[0],
    domain: AUTHORITY_DOMAINS[0],
    headquarters: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await addAuthorityAction(draft);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setRows((r) => [
        ...r,
        { id: `pending-${draft.name}`, ref: `A${r.length + 1}`, ...draft },
      ]);
      setDraft({ name: "", type: AUTHORITY_TYPES[0], domain: AUTHORITY_DOMAINS[0], headquarters: null });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteAuthorityAction(id);
      if (result.ok) setRows((r) => r.filter((row) => row.id !== id));
    });
  }

  return (
    <div>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Authorities registered here can be granted approval rights in
        Procurement, Investment, Sustainability, and ICV workflows.
      </p>

      {rows.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Ref</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Name</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Type</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Domain</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>HQ</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-3 py-2">{a.ref}</td>
                  <td className="px-3 py-2">{a.name}</td>
                  <td className="px-3 py-2">{a.type}</td>
                  <td className="px-3 py-2">{a.domain}</td>
                  <td className="px-3 py-2">{a.headquarters}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
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
        <Field label="Name of the authority" error={fieldErrors.name}>
          <input
            className={inputClass}
            placeholder="e.g. National Standards Authority"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field label="Type of authority">
          <select
            className={inputClass}
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as AuthorityInput["type"] }))}
          >
            {AUTHORITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Domain">
          <select
            className={inputClass}
            value={draft.domain}
            onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value as AuthorityInput["domain"] }))}
          >
            {AUTHORITY_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Headquarters">
          <input
            className={inputClass}
            value={draft.headquarters ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, headquarters: e.target.value || null }))}
          />
        </Field>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--elev8-blue)" }}
          >
            Add authority
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

function StakeholderTable({ initialStakeholders }: { initialStakeholders: StakeholderRow[] }) {
  const [rows, setRows] = useState(initialStakeholders);
  const [draft, setDraft] = useState<StakeholderInput>({
    name: "",
    sectors: [],
    domain: AUTHORITY_DOMAINS[0],
  });
  const [sectorsText, setSectorsText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const sectors = sectorsText.split(",").map((s) => s.trim()).filter(Boolean);
    const toSave = { ...draft, sectors };

    startTransition(async () => {
      const result = await addStakeholderAction(toSave);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setRows((r) => [...r, { id: `pending-${toSave.name}`, ref: `S${r.length + 1}`, ...toSave }]);
      setDraft({ name: "", sectors: [], domain: AUTHORITY_DOMAINS[0] });
      setSectorsText("");
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteStakeholderAction(id);
      if (result.ok) setRows((r) => r.filter((row) => row.id !== id));
    });
  }

  return (
    <div>
      {rows.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-md border" style={{ borderColor: "var(--elev8-g200)" }}>
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr style={{ background: "var(--elev8-g50)" }}>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Ref</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Name</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Sectors</th>
                <th className="px-3 py-2 font-medium" style={{ color: "var(--elev8-g600)" }}>Domain</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t" style={{ borderColor: "var(--elev8-g100)" }}>
                  <td className="px-3 py-2">{s.ref}</td>
                  <td className="px-3 py-2">{s.name}</td>
                  <td className="px-3 py-2">{s.sectors.join(", ")}</td>
                  <td className="px-3 py-2">{s.domain}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
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
        <Field label="Stakeholder name" error={fieldErrors.name}>
          <input
            className={inputClass}
            placeholder="e.g. Ministry of Trade & Industry"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        </Field>
        <Field label="Mapped sectors">
          <input
            className={inputClass}
            placeholder="Comma-separated"
            value={sectorsText}
            onChange={(e) => setSectorsText(e.target.value)}
          />
        </Field>
        <Field label="Domain">
          <select
            className={inputClass}
            value={draft.domain}
            onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value as StakeholderInput["domain"] }))}
          >
            {AUTHORITY_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--elev8-blue)" }}
          >
            Add stakeholder
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

function EscalationAndDataGovernance({ initial }: { initial: GovernancePayloadInput }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addLevel() {
    setForm((f) => ({
      ...f,
      escalation: [...f.escalation, { level: f.escalation.length + 1, role: "" }],
    }));
  }

  function removeLevel(index: number) {
    setForm((f) => ({
      ...f,
      escalation: f.escalation
        .filter((_, i) => i !== index)
        .map((e, i) => ({ ...e, level: i + 1 })),
    }));
  }

  function updateLevelRole(index: number, role: string) {
    setForm((f) => ({
      ...f,
      escalation: f.escalation.map((e, i) => (i === index ? { ...e, role } : e)),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");

    startTransition(async () => {
      const result = await saveGovernancePayloadAction(form);
      if (result.ok) {
        setStatus("saved");
        setStatusMessage("Saved");
      } else {
        setStatus("error");
        setStatusMessage(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-4 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
        Determines who approves what, in what order, across Procurement
        tenders, Investment projects, Sustainability disclosures and ICV
        waivers.
      </p>

      <div className="mb-3 space-y-2">
        {form.escalation.map((level, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-16 shrink-0 text-[12.5px] font-medium"
              style={{ color: "var(--elev8-g600)" }}
            >
              Level {level.level}
            </span>
            <input
              className={inputClass}
              value={level.role}
              onChange={(e) => updateLevelRole(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeLevel(i)}
              className="shrink-0 text-[12px] font-medium"
              style={{ color: "var(--elev8-red)" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addLevel}
        className="mb-5 text-[13px] font-medium"
        style={{ color: "var(--elev8-blue)" }}
      >
        + Add escalation level
      </button>

      <div className="mb-2 h-px" style={{ background: "var(--elev8-g100)" }} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Data governance model">
          <input
            className={inputClass}
            value={form.dataGovernance ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, dataGovernance: e.target.value || null }))}
          />
        </Field>
        <Field label="Audit frequency">
          <select
            className={inputClass}
            value={form.auditFrequency ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                auditFrequency: e.target.value
                  ? (e.target.value as GovernancePayloadInput["auditFrequency"])
                  : null,
              }))
            }
          >
            <option value="">Not set</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annually">Annually</option>
          </select>
        </Field>
        <Field label="Access policy">
          <input
            className={inputClass}
            value={form.accessPolicy ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, accessPolicy: e.target.value || null }))}
          />
        </Field>
        <Field label="Information classification levels">
          <input
            className={inputClass}
            value={form.infoClassification ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, infoClassification: e.target.value || null }))}
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

export function GovernanceForm({
  authorities,
  stakeholders,
  governancePayload,
}: {
  authorities: AuthorityRow[];
  stakeholders: StakeholderRow[];
  governancePayload: GovernancePayloadInput;
}) {
  const authoritiesSummary =
    authorities.length === 0 ? "None added" : `${authorities.length} registered`;
  const stakeholdersSummary =
    stakeholders.length === 0 ? "None added" : `${stakeholders.length} registered`;
  const escalationSummary =
    governancePayload.escalation.length === 0
      ? "No levels defined"
      : `${governancePayload.escalation.length} level${governancePayload.escalation.length === 1 ? "" : "s"}`;

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Governance
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        Authorities, stakeholders, escalation, and data governance. Every
        other pillar that needs an approval authority reads from what you
        register here.
      </p>

      <div
        className="rounded-xl border bg-white px-5 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <SettingsGroup
          title="Government authorities"
          summary={authoritiesSummary}
          isComplete={authorities.length > 0}
          defaultOpen
        >
          <AuthorityTable initialAuthorities={authorities} />
        </SettingsGroup>

        <SettingsGroup
          title="Sector stakeholders"
          summary={stakeholdersSummary}
          isComplete={stakeholders.length > 0}
        >
          <StakeholderTable initialStakeholders={stakeholders} />
        </SettingsGroup>

        <SettingsGroup
          title="Escalation matrix and data governance"
          summary={escalationSummary}
          isComplete={governancePayload.escalation.length > 0}
        >
          <EscalationAndDataGovernance initial={governancePayload} />
        </SettingsGroup>
      </div>
    </div>
  );
}
