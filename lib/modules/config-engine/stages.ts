/**
 * lib/modules/config-engine/stages.ts
 *
 * Ported directly from elev8-country-admin-config_3.html's own `STAGES`
 * constant -- same ids, same order, same icons/labels/descriptions,
 * same mandatory flags. This is the single source of truth for the
 * stepper navigation; don't hand-edit a copy of this list somewhere else.
 *
 * Only `identity` has a real page right now. Every other stage renders
 * through the placeholder route (app/admin/config-engine/[stage]/page.tsx)
 * until it's actually built -- see 02-MODULE-ROADMAP.md and
 * 05-PROGRESS-TRACKER.md for build order.
 */

export type Stage = {
  id: string;
  num: number;
  icon: string;
  label: string;
  shortLabel: string;
  description: string;
  mandatory: boolean;
  /** The 8 stages that map 1:1 to a `pillar_id` in the schema. */
  isPillar: boolean;
};

export const STAGES: Stage[] = [
  {
    id: "welcome",
    num: 0,
    icon: "👋",
    label: "Welcome",
    shortLabel: "Welcome",
    description: "Before you begin",
    mandatory: false,
    isPillar: false,
  },
  {
    id: "identity",
    num: 1,
    icon: "🌐",
    label: "Country Identity",
    shortLabel: "Identity",
    description:
      "Country metrics, sectors, business governance, corporate classification & strategic control",
    mandatory: true,
    isPillar: false,
  },
  {
    id: "masterdata",
    num: 2,
    icon: "🗂️",
    label: "Country Master Data",
    shortLabel: "Master Data",
    description:
      "HS codes, economic/industrial zones, ports & airports, and the national tax/VAT system every pillar references",
    mandatory: true,
    isPillar: false,
  },
  {
    id: "statecluster",
    num: 3,
    icon: "📍",
    label: "State Cluster",
    shortLabel: "State Cluster",
    description:
      "States/governorates active on the platform, thrust cluster designation & each state's own partner network",
    mandatory: false,
    isPillar: false,
  },
  {
    id: "corridors",
    num: 4,
    icon: "🛤️",
    label: "Corridor Configuration",
    shortLabel: "Corridors",
    description:
      "Shared national trade corridor registry — origin, destination, gateway, mode, HS coverage & risk — used by both Import and Export",
    mandatory: false,
    isPillar: false,
  },
  {
    id: "governance",
    num: 5,
    icon: "🏛️",
    label: "Governance",
    shortLabel: "Governance",
    description: "Authorities, stakeholders, escalation & data governance",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "procurement",
    num: 6,
    icon: "🛒",
    label: "Procurement",
    shortLabel: "Procurement",
    description: "Tender types, thresholds, evaluation weighting & supplier KPIs",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "b2b",
    num: 7,
    icon: "🤝",
    label: "B2B",
    shortLabel: "B2B",
    description: "Business identities, categories & the national matching engine",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "import",
    num: 8,
    icon: "📥",
    label: "Import",
    shortLabel: "Import",
    description: "Import categories, duties & localization intelligence",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "export",
    num: 9,
    icon: "📤",
    label: "Export",
    shortLabel: "Export",
    description: "Priority sectors, target markets, incentives & export readiness",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "investment",
    num: 10,
    icon: "📈",
    label: "Investment",
    shortLabel: "Investment",
    description: "Priority sectors, incentives, SEZs & investor matching",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "sustainability",
    num: 11,
    icon: "🌱",
    label: "Sustainability",
    shortLabel: "Sustainability",
    description: "National ESG / GHG framework & targets",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "icv",
    num: 12,
    icon: "🏴",
    label: "ICV / Local Content",
    shortLabel: "ICV",
    description:
      "Control config, obligation allocation, contribution scoring & spend targets",
    mandatory: true,
    isPillar: true,
  },
  {
    id: "review",
    num: 13,
    icon: "🏁",
    label: "Review & Validation",
    shortLabel: "Review",
    description: "Completion, warnings & publish",
    mandatory: false,
    isPillar: false,
  },
];

export type StageStatus = "done" | "in_progress" | "pending";

/**
 * readiness_level values that count as "done" for stepper purposes.
 * Matches the enum in supabase/migrations/20260918000000_config_engine_foundation.sql.
 */
const DONE_READINESS = new Set(["production_ready", "published"]);
const IN_PROGRESS_READINESS = new Set([
  "basic_setup",
  "configuration_in_progress",
  "validation_required",
  "ready_for_review",
]);

export function readinessToStageStatus(
  readinessLevel: string | undefined,
): StageStatus {
  if (!readinessLevel) return "pending";
  if (DONE_READINESS.has(readinessLevel)) return "done";
  if (IN_PROGRESS_READINESS.has(readinessLevel)) return "in_progress";
  return "pending";
}
