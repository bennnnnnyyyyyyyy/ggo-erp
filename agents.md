# Agent Instructions — ggo-erp

This repository is the GGO ERP: a modular, multi-tenant ERP. It is built for internal use at GG Outsourcing first and designed from day one to be sold to other companies. Every design choice must survive the question "what happens when a second customer signs up?"

The live path is a Cloudflare Worker API in `apps/api/` and a React frontend in `apps/web/`, sharing types from `packages/shared/`, backed by Supabase Postgres. Migrations live in `sql/`.

## Documentation and planning

- **Multi-agent collaboration**: humans and AI agents (Claude, Codex, Antigravity, Cursor) co-develop this repo. Follow the folder authorities in [`documentation/README.md`](documentation/README.md) to prevent context drift.
- Keep plans, research, operational notes, architecture and worklogs under `documentation/` (`architecture/`, `plans/`, `planning/`, `research/`, `operations/`, `reference/`, `reviews/`).
- **Reverse-engineering work** (studying an existing online system to rebuild its features) goes in `documentation/research/<system-slug>/`, copied from `documentation/research/_TEMPLATE/`. Record what the system does, never copy its code, assets, branding or copy text. See [`documentation/research/README.md`](documentation/research/README.md).
- A module is not built until it has an approved plan in `documentation/plans/` (start from [`MODULE_PLAN_TEMPLATE.md`](documentation/plans/MODULE_PLAN_TEMPLATE.md)) and an entry in [`checklist.md`](documentation/plans/checklist.md).
- Significant fixes, schema changes, migrations and architectural work must add a dated section to [`documentation/operations/WORKLOG.md`](documentation/operations/WORKLOG.md) with **Objective**, **Actions Completed**, **Database / System Result**, and **Safety Status**.
- Architectural decisions that are hard to reverse get an ADR in `documentation/architecture/decisions/`.
- Keep active planning documents in sync as implementation decisions are made. Use relative links and check that new links resolve.

## Multi-tenancy and sellability rules (non-negotiable)

- Every business table has `org_id uuid not null references organizations(id)` and row level security. No exceptions for "internal only" tables.
- Never hardcode GG Outsourcing names, logos, currencies, time zones, tax rules or workflows. Put them in organization settings or seed data.
- Every API route resolves the caller's organization and checks a permission (`requirePermission('module.action')`) before touching data.
- Modules are switched on per organization (`org_modules`). New features belong to a module; the core stays small.
- Money is stored as integer minor units (`bigint`) plus an ISO 4217 currency code. Timestamps are `timestamptz` in UTC.
- Business records are soft-deleted (`deleted_at`) and changes are written to the append-only `audit_log`.

## Safety and implementation rules

- State assumptions before coding and make surgical changes only in files relevant to the request.
- Never run `DROP`, `TRUNCATE`, broad `DELETE`, bucket destruction or production mutations without explicit user consent and a verified target.
- Preserve append-only audit behavior. Prefer reviewed SQL migrations and local verification before any production schema change. Migrations are numbered, rerun-safe, and end with read-only verification queries.
- Do not use automated browser testing. Give the user the URL and ask them to test manually.
- Keep secrets out of source, logs, plans and worklogs. Do not modify `.env`, `.dev.vars`, deployed secrets or production data unless explicitly asked.
- Never author a commit, finish work then i will handle the commit and pushing to main

## Repository boundaries

- API, auth and tenancy enforcement: `apps/api/`.
- Frontend: `apps/web/`.
- Shared types, permission keys, module manifests and validation schemas: `packages/shared/`.
- Database migrations and schema references: `sql/`.
- One-off and operational scripts: `scripts/`.
- Documentation: `documentation/` only.

## Environment and tooling

- Windows 10. Use PowerShell. Do not use `cmd` or `cmd /c`.
- The system PATH may not be configured. Node lives at `C:\Users\ben.arthur\node-v24.14.1-win-x64\` and Git at `C:\Users\ben.arthur\PortableGit\bin\`; use absolute executable paths if a command is not found.
- No administrator privileges are available; never request elevation.
- npm workspaces: run `npm install` at the repo root. Use `npm run <script> -w apps/api` (or `apps/web`, `packages/shared`) for one package.

## Verification handoff

- Use `rg` first for code searches.
- Before handing off, run `npm run typecheck` and `npm test` at the root. Do not claim deployment or production verification unless it actually happened.
- Summarize changed files, checks run, database impact, and any manual deployment or browser steps still required.

## Don't forget to update the worklog!
