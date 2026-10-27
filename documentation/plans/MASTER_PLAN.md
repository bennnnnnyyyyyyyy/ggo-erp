# Master Plan

**Status:** `[📝 Draft / RFC]` · **Last updated:** 2026-10-27
**Live status per item:** [`checklist.md`](checklist.md)

The phases below get the ERP from scaffold to a product another company could buy.

> **The internal MVP is planned in [`MVP_PLAN.md`](MVP_PLAN.md)**: layout, module map, MVP
> scope (Core + CRM + Time & attendance + dashboards), milestones and ETA. Where this file and
> the MVP plan differ, the MVP plan is newer. This file will be rewritten once the MVP plan is
> approved.

## Phase 0: Scaffold `[🟡 In Progress]`

- [x] Monorepo: `apps/api`, `apps/web`, `packages/shared`, `sql/`, `documentation/`.
- [x] Agent rules (`agents.md`), documentation system, research template, module plan template.
- [x] API: auth (Supabase JWT), tenant resolution, permission and module guards, standard responses.
- [x] Web: sign-in, organization picker, module-driven shell.
- [x] `sql/001_tenancy_core.sql` written.
- [ ] ADR-0001 and ADR-0002 approved.
- [ ] Supabase project created; `sql/001` run; first org bootstrapped.
- [ ] Hosting chosen for the web app; API and web deployed to a staging URL.
- [ ] GitHub remote and CI (typecheck + tests on every PR).

## Phase 1: Core platform

What every module will need. Built once, in `core`.

- User invitations by email, role changes, disabling a member.
- Custom roles per organization (a `roles` table with permission sets; built-in roles stay as defaults).
- Organization settings screen: name, logo, currency, time zone, date and number formats.
- Audit log viewer (API route exists: `GET /v1/core/audit`).
- Document numbering service (`INV-0001` style, per org and per document type, gap-safe).
- File attachments (Supabase Storage, scoped by org).
- Custom fields on any entity (JSONB plus a field definition table), because every customer asks.
- Data import/export (CSV) framework, dry-run first.
- Two-org isolation test helper (ADR-0002 consequence).
- Notifications (in-app and email).

## Phase 2: Business modules (set by the research list)

Typical ERP modules, to be confirmed, merged or dropped as teardowns land:

| Candidate module | Typical scope |
|---|---|
| Contacts / CRM | Customers, suppliers, contacts, activities |
| Products & inventory | Items, warehouses, stock moves, adjustments |
| Sales | Quotes, sales orders, invoices, payments |
| Purchasing | Purchase orders, receipts, supplier bills |
| Accounting | Chart of accounts, journal, ledger, tax, reports |
| HR & payroll | Employees, attendance, leave, payroll runs |
| Projects & time | Projects, tasks, timesheets, billing |
| Reporting | Cross-module dashboards and exports |

Each module goes through: teardown → module plan (approved) → migration → API → screens →
worklog entry → checklist `[✅ Live]`.

## Phase 3: Sellable

- Self-serve sign-up creating a new organization (with `bootstrap_organization` logic in the API).
- Plans and billing (Stripe): plan → enabled modules and limits; `org_modules` is the switch.
- Per-org branding (logo, colours via the CSS tokens already in `apps/web/src/styles.css`).
- Super-admin console (across orgs): support access with audit, usage, suspend an org.
- Backups and data export per org; data deletion on request.
- Security review, terms of service, privacy policy, DPA.
- Public docs and onboarding.

## Decisions waiting on the user

- Approve or change ADR-0001 (stack) and ADR-0002 (tenancy).
- Product name (the UI currently says "ERP").
- Web hosting: Cloudflare Pages or Vercel.
- Which Supabase organization/project to use, and whether staging and production are separate projects.
