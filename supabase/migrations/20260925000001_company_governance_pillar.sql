-- Company Configuration -- Governance Pillar, first of the 8 per-pillar
-- preference sub-groups (Phase 2). Three sub-pages: Compliance & Certs,
-- Risk Intelligence, Document Room & Audit.
--
-- compliance is one jsonb blob (requiredCerts, tradeRequirements,
-- certsHeld, certExpiry) -- same reasoning as commercial_terms/
-- pillar_selection: always read/written together as one unit.
--
-- risk_reviewed is a plain boolean, not a jsonb blob, because Risk
-- Intelligence has no real editable data yet -- the mockup's own risk
-- table is entirely COMPUTED from trade corridor data (allCorridors(),
-- itself built from Import/Export corridor sub-groups that don't exist
-- in this schema yet). Until those exist, this page is honestly just a
-- static risk-framework explainer plus an acknowledgment checkbox, so
-- that's the only real field it needs.
--
-- doc_checklist is a plain text[], matching every other simple
-- multi-select field in this project.
--
-- company_audit_log is a genuinely new, cross-cutting capability: a
-- real timestamped audit trail (the mockup's own S.auditLog /
-- logAudit()), not scoped to just Governance. It gets its own table
-- (append-only, one row per save action) rather than a jsonb array on
-- companies, since an ever-growing log doesn't belong inside a single
-- row that gets rewritten on every update. IMPORTANT SCOPE NOTE: this
-- migration only wires logging into the Governance actions built this
-- session -- Identity, Role, Trade Intent, Geography, Market Priority,
-- Goals, Commercial Terms and Pillar Selection's own save actions do
-- NOT call this yet. Backfilling those is real, flagged follow-up work,
-- not done here.
--
-- Rollback:
--   alter table public.companies drop column if exists compliance;
--   alter table public.companies drop column if exists risk_reviewed;
--   alter table public.companies drop column if exists doc_checklist;
--   drop table if exists public.company_audit_log;

alter table public.companies
  add column compliance jsonb not null default '{}',
  add column risk_reviewed boolean not null default false,
  add column doc_checklist text[] not null default '{}';

create table public.company_audit_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  section text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

alter table public.company_audit_log enable row level security;

-- Append-only from the app's perspective: members can read and insert
-- their own company's log, but no update/delete policy exists at all,
-- so those operations are structurally impossible for any ordinary
-- session, not just discouraged by convention.
create policy "company_audit_log_select_members"
  on public.company_audit_log
  for select
  using (public.is_company_member(company_id));

create policy "company_audit_log_insert_members"
  on public.company_audit_log
  for insert
  with check (public.is_company_member(company_id));

create index company_audit_log_company_id_created_at_idx
  on public.company_audit_log (company_id, created_at desc);
