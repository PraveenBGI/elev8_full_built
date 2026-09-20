"use client";

/**
 * app/admin/config-engine/statecluster/StateClusterForm.tsx
 *
 * Two things this session built, not the full mockup section: the states
 * list (add/deactivate/thrust-flag/remove) and the delegation toggle,
 * wired to the already-existing set_state_config_control() RPC from the
 * approval-workflow migration. NOT built yet: State Partner (with logo
 * upload) and Support Partners per state -- those need a storage-upload
 * UI pattern that doesn't exist anywhere in the app yet, flagged in
 * docs/modules/config-engine/README.md rather than stubbed with fake
 * upload buttons.
 *
 * State name is free text, not the mockup's fixed OMAN_GOVERNORATES
 * dropdown -- that list is specific to one demo country and there's no
 * real geo-hierarchy master yet (a Phase 1 concern). See StateSchema's
 * own comment.
 */

import { useState, useTransition } from "react";
import type { StateRow } from "@/lib/modules/config-engine/adapter";
import type { StateInput } from "@/lib/modules/config-engine/schemas";
import {
  addStateAction,
  removeStateAction,
  setStateConfigControlAction,
  toggleStateActiveAction,
  toggleStateThrustAction,
} from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="relative h-5 w-9 rounded-full transition-colors disabled:opacity-50"
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

function StateRowItem({ state }: { state: StateRow }) {
  const [row, setRow] = useState(state);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleActive() {
    const next = !row.is_active;
    setRow((r) => ({ ...r, is_active: next }));
    startTransition(async () => {
      const result = await toggleStateActiveAction(row.id, next);
      if (!result.ok) setError(result.error);
    });
  }

  function toggleThrust() {
    const next = !row.is_thrust_cluster;
    setRow((r) => ({ ...r, is_thrust_cluster: next }));
    startTransition(async () => {
      const result = await toggleStateThrustAction(row.id, next);
      if (!result.ok) setError(result.error);
    });
  }

  function toggleDelegation() {
    const next = row.config_control === "central" ? "state" : "central";
    setRow((r) => ({ ...r, config_control: next }));
    startTransition(async () => {
      const result = await setStateConfigControlAction(row.id, next);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div
      className="rounded-md border p-3"
      style={{ borderColor: "var(--elev8-g200)", background: "var(--elev8-g50)" }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[160px] flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--elev8-ink)" }}>
            {row.name}
          </div>
          <div className="text-[11.5px]" style={{ color: "var(--elev8-g500)" }}>
            {row.config_control === "state" ? "Delegated to State Admin" : "Central configuration"}
            {" \u00b7 "}
            {row.approval_status}
          </div>
        </div>

        <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--elev8-g600)" }}>
          Active
          <Toggle on={row.is_active} onClick={toggleActive} disabled={isPending} />
        </label>

        <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--elev8-g600)" }}>
          Thrust cluster
          <Toggle on={row.is_thrust_cluster} onClick={toggleThrust} disabled={isPending} />
        </label>

        <label className="flex items-center gap-2 text-[12px]" style={{ color: "var(--elev8-g600)" }}>
          State control
          <Toggle
            on={row.config_control === "state"}
            onClick={toggleDelegation}
            disabled={isPending}
          />
        </label>
      </div>
      {error && (
        <p className="mt-2 text-[12px]" style={{ color: "var(--elev8-red)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function StateClusterForm({ states }: { states: StateRow[] }) {
  const [rows, setRows] = useState(states);
  const [draft, setDraft] = useState<StateInput>({ name: "", isThrustCluster: false });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await addStateAction(draft);
      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      setRows((r) => [
        ...r,
        {
          id: `pending-${draft.name}`,
          name: draft.name,
          is_active: true,
          is_thrust_cluster: draft.isThrustCluster,
          config_control: "central",
          approval_status: "draft",
        },
      ]);
      setDraft({ name: "", isThrustCluster: false });
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      const result = await removeStateAction(id);
      if (result.ok) {
        setRows((r) => r.filter((row) => row.id !== id));
      }
    });
  }

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        State Cluster
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        Turn on the states active on this platform, flag any as a Thrust
        Cluster, and choose whether each one is centrally configured or
        delegated to its own State Admin.
      </p>

      {rows.length > 0 ? (
        <div className="mb-5 space-y-3">
          {rows.map((s) => (
            <div key={s.id} className="group relative">
              <StateRowItem state={s} />
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                disabled={isPending}
                className="absolute right-3 top-3 text-[11px] font-medium opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: "var(--elev8-red)" }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-5 text-[13px]" style={{ color: "var(--elev8-g500)" }}>
          No states added yet.
        </p>
      )}

      <form
        onSubmit={handleAdd}
        className="rounded-md border p-4"
        style={{ borderColor: "var(--elev8-g200)" }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_auto_auto]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
              State name
            </label>
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            {fieldErrors.name?.map((m) => (
              <p key={m} className="text-xs" style={{ color: "var(--elev8-red)" }}>
                {m}
              </p>
            ))}
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-[13px]" style={{ color: "var(--elev8-ink)" }}>
            <input
              type="checkbox"
              checked={draft.isThrustCluster}
              onChange={(e) => setDraft((d) => ({ ...d, isThrustCluster: e.target.checked }))}
              className="h-4 w-4 accent-[var(--elev8-blue)]"
            />
            Thrust cluster
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="self-end rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--elev8-blue)" }}
          >
            Add state
          </button>
        </div>
      </form>
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--elev8-red)" }}>
          {error}
        </p>
      )}

      <div className="mt-10">
        <h2 className="text-[13px] font-semibold" style={{ color: "var(--elev8-g600)" }}>
          Coming next in State Cluster
        </h2>
        <ul className="mt-2 space-y-1.5">
          <li className="text-[13px]" style={{ color: "var(--elev8-g500)" }}>
            State Partner (single, with logo)
          </li>
          <li className="text-[13px]" style={{ color: "var(--elev8-g500)" }}>
            Support Partners
          </li>
        </ul>
      </div>
    </div>
  );
}
