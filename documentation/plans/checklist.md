# Plans Execution Status & Checklist

**Last updated:** 2026-10-28
**Source of truth for what actually happened:** [`../operations/WORKLOG.md`](../operations/WORKLOG.md)

## Status overview

| Status | Plans |
|---|---|
| ✅ Live | none |
| 🟡 In progress | [CORE_PLAN.md](CORE_PLAN.md) (M1), [CRM_PLAN.md](CRM_PLAN.md) (M2 built locally, waiting on sql/003), [MASTER_PLAN.md](MASTER_PLAN.md) phase 0 |
| 📋 Approved / ready | [MVP_PLAN.md](MVP_PLAN.md) (approved 2026-10-28), [ADR-0001](../architecture/decisions/ADR-0001-stack.md), [ADR-0002](../architecture/decisions/ADR-0002-multi-tenancy.md) |
| 📝 Draft / RFC | [MASTER_PLAN.md](MASTER_PLAN.md) (to be rewritten from the MVP plan) |
| 💡 Backlog | M3 (Time & attendance), M4 (Dashboards), M5 (Pilot) |

## Detail

- [ ] **[MASTER_PLAN.md](MASTER_PLAN.md): Phase 0, Scaffold**
  - **Done:** repo structure, docs system, API and web skeletons, `sql/001` run on `plhuuhcpvlytozyedamt`, GGO organization bootstrapped, ADRs accepted (2026-10-28).
  - **Remaining:** separate staging project (A8), web hosting choice, first deploy, CI.
- [ ] **[MVP_PLAN.md](MVP_PLAN.md) M0: Research & sign-off**
  - **Done:** plan and ADRs approved (2026-10-28).
  - **Remaining:** Odoo, HubSpot and Clockify teardowns; staging + production Supabase projects.
- [ ] **[CORE_PLAN.md](CORE_PLAN.md) M1: Core platform**
  - **Slice 1 built locally (2026-10-28):** shell with app home and per-app sidebar, Settings → General / Users / Audit log, invites with copyable link, role changes, disable/enable, shared List view, password reset, invite acceptance, optional Google button.
  - **Waiting on Ben:** browser check. `sql/002` run 2026-10-28.
  - **Slice 2 done (2026-10-28, with CRM):** Record page + activity timeline, Board view, global search, Settings → Apps, My tasks.
  - **Slice 2 remaining:** Dashboard cards (with M4), logo upload, notifications, two-org isolation test.
- [ ] **[CRM_PLAN.md](CRM_PLAN.md) M2: CRM**
  - **Built locally (2026-10-28):** companies, contacts, deals, pipeline board, record pages with timeline, tasks, search.
  - **Waiting on Ben:** run `sql/003`, switch CRM on in Settings → Apps, browser check; answers in [INPUT_NEEDED.md](../planning/INPUT_NEEDED.md).
  - **Remaining:** CSV import (M5), own/team visibility (after teams in M3).

## Migrations

See [`sql/README.md`](../../sql/README.md) for per-file status.
