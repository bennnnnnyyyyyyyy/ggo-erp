# GGO ERP Worklog

Newest first. Every significant fix, schema change, migration run, deployment or data operation
gets an entry with these four headings:

- **Objective.** Why the work was done.
- **Actions Completed.** What changed, with file paths.
- **Database / System Result.** What happened in Supabase / Cloudflare / hosting, or "None".
- **Safety Status.** Tests run, what was not verified, and manual steps still needed.

---

## 2026-10-27 — Discovery answers and draft MVP plan

**Objective.** Plan the product layout and the internal MVP before building more, and give management an ETA.

**Actions Completed.** Added `documentation/planning/2026-10-27-discovery-questions.md` (answered in part by Ben) and `documentation/plans/MVP_PLAN.md` (draft): assumed defaults for unanswered questions, free systems to study, module map, app shell and four standard views, customization levels, code conventions, MVP scope (Core + CRM + Time & attendance + dashboards), milestones (9–12 weeks full time) and open questions. Linked it from `plans/README.md`, `checklist.md`, `MASTER_PLAN.md` and the research index. Documentation only.

**Database / System Result.** None.

**Safety Status.** No code, schema or data touched. Awaiting approval from Ben and management, and answers to MVP_PLAN section 10.

## 2026-10-27 — Repository scaffold

**Objective.** Set up the ERP repository so modules can be built from reverse-engineering
research. Internal use first, structured to be sold. Documentation system and agent rules
modelled on `dmedesk-prospector`.

**Actions Completed.**
- `agents.md` (+ `CLAUDE.md` importing it): repo boundaries, multi-tenancy rules, safety rules, tooling, verification handoff.
- `documentation/`: index with folder authorities; `architecture/ARCHITECTURE.md`; ADR-0001 (stack) and ADR-0002 (tenancy), both *Proposed*; `plans/MASTER_PLAN.md`, `MODULE_PLAN_TEMPLATE.md`, `checklist.md`; `research/README.md` with ground rules and `_TEMPLATE/TEARDOWN.md`; READMEs for `planning/`, `reference/`, `reviews/`.
- npm workspaces monorepo: `packages/shared` (response types, module manifests, permissions, money), `apps/api` (Hono on Workers: `requireAuth`, `requireTenant`, `requirePermission`, `requireModule`, `/health`, `/v1/core/session`, `/v1/core/audit`), `apps/web` (Vite + React: sign-in, org picker, module-driven shell).
- `sql/001_tenancy_core.sql`: `organizations`, `memberships`, `org_modules`, append-only `audit_log`, `is_org_member()`, RLS policies, `bootstrap_organization()`; `sql/README.md` with rules and status.

**Database / System Result.** None. No Supabase project used, no SQL run, nothing deployed.

**Safety Status.** `npm run typecheck` clean across all three workspaces; `npm test` 8/8 passing
(shared 4, api 4). Sign-in and the API against a real Supabase project have not been tested.
Next manual steps: approve the ADRs, create the Supabase project, run `sql/001`, bootstrap the
first org, fill in `.dev.vars` / `.env.local`.
