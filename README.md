# GGO ERP

A modular, multi-tenant ERP. Built for internal use at GG Outsourcing first, designed to be
sold to other companies.

**Status:** scaffold. Nothing deployed yet. See the [worklog](documentation/operations/WORKLOG.md).

## Layout

```text
apps/api/          Cloudflare Worker API (Hono, TypeScript): auth, tenancy, permissions, module routes
apps/web/          Web app (React + Vite)
packages/shared/   Types, module manifests, permission keys and helpers used by both
sql/               Numbered Supabase migrations, run by hand (see sql/README.md)
scripts/           Operational and one-off scripts
documentation/     All project docs: architecture, plans, research, worklog
```

## Getting started

Requires Node 22+.

```powershell
npm install
Copy-Item apps/api/.dev.vars.example apps/api/.dev.vars
Copy-Item apps/web/.env.example apps/web/.env.local
# fill in the Supabase URL and keys, run sql/001 in Supabase, bootstrap an org (sql/README.md)
npm run dev:api
npm run dev:web
```

Checks: `npm run typecheck` and `npm test`.

## Read next

- [`agents.md`](agents.md): rules for anyone (human or AI) changing this repo.
- [`PLANS.md`](PLANS.md): what to read before changing a module.
- [`documentation/README.md`](documentation/README.md): documentation index.
- [`documentation/research/README.md`](documentation/research/README.md): how we study existing systems.
