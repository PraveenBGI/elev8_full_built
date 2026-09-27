"use client";

/**
 * app/company/CreateCompanyForm.tsx
 *
 * Shown when the signed-in user has no company yet. Calls
 * createCompanyAction(), which wraps create_company() -- the only
 * sanctioned way a company row is ever created.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCompanyAction } from "./actions";

const inputClass =
  "w-full rounded-md border border-[var(--elev8-g200)] bg-white px-3 py-2 text-[13px] text-[var(--elev8-ink)] outline-none transition-colors focus:border-[var(--elev8-blue)] focus:ring-2 focus:ring-[var(--elev8-blue)]/15";

export function CreateCompanyForm({
  countries,
}: {
  countries: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createCompanyAction(countryId, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-[480px] py-10">
      <h1 className="text-[22px] font-semibold" style={{ color: "var(--elev8-ink)" }}>
        Set up your business
      </h1>
      <p className="mt-1.5 mb-7 text-sm leading-relaxed" style={{ color: "var(--elev8-g500)" }}>
        This establishes your business context. elev8 uses this to
        localize governance, trade rules, and opportunity data from the
        very first screen.
      </p>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border bg-white p-6 shadow-[var(--elev8-shadow-sm)]"
        style={{ borderColor: "var(--elev8-g100)" }}
      >
        <div className="mb-4 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            Company name
          </label>
          <input
            className={inputClass}
            placeholder="e.g. Your Organisation LLC"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-5 flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium" style={{ color: "var(--elev8-g600)" }}>
            Registration country
          </label>
          <select
            className={inputClass}
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
          >
            <option value="">Choose...</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="mb-4 text-sm" style={{ color: "var(--elev8-red)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--elev8-blue)" }}
        >
          {isPending ? "Creating..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
