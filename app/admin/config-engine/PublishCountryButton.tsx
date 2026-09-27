"use client";

/**
 * app/admin/config-engine/PublishCountryButton.tsx
 *
 * Lives in the Topbar. One click, no approval step -- publishes the
 * whole country directly if the completeness gate passes (all 8 pillars
 * at least ready_for_review), surfacing the gate's own error message
 * inline if it doesn't.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishCountryConfigAction } from "@/lib/modules/config-engine/country-publish-actions";

export function PublishCountryButton({ approvalStatus }: { approvalStatus: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishCountryConfigAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const isPublished = approvalStatus === "published";

  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={{
          background: isPublished ? "#E9F8EF" : "var(--elev8-g100)",
          color: isPublished ? "var(--elev8-green-dk)" : "var(--elev8-g600)",
        }}
      >
        {isPublished ? "Published" : "Draft"}
      </span>
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="rounded-md px-3 py-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--elev8-blue)" }}
      >
        {isPending ? "Publishing..." : "Publish"}
      </button>
      {error && (
        <span className="max-w-[240px] text-[11.5px]" style={{ color: "var(--elev8-red)" }}>
          {error}
        </span>
      )}
    </div>
  );
}
