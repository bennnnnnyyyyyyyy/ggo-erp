# ADR-0001: Stack

**Status:** Proposed (awaiting Ben's approval)
**Date:** 2026-10-27
**Deciders:** Ben Arthur

## Context

The ERP starts as an internal tool for GG Outsourcing and must be sellable later: many
customers, per-customer modules, and a codebase several people and AI agents can work on without
drift. The team already runs DME Desk Prospector on a Cloudflare Worker (Hono) + Supabase +
static frontend, so that operating knowledge (Wrangler, Supabase SQL Editor migrations, RLS)
carries over.

## Decision

- **TypeScript everywhere**, in one npm-workspaces monorepo (`apps/api`, `apps/web`,
  `packages/shared`). An ERP has many entities and rules; shared types between API and UI catch
  mistakes that plain JS would not.
- **API: Hono on Cloudflare Workers.** Same runtime and deployment as Prospector. Cheap at low
  volume, no servers to manage.
- **Web: React + Vite**, built to static files. Any static host works.
- **Database and auth: Supabase** (Postgres + Supabase Auth). Postgres suits ERP data
  (transactions, constraints, reporting). Supabase Auth gives password, magic link, OAuth and
  SSO-ready sign-in without us storing passwords (Prospector's custom `app_users` + bcrypt is not
  carried over).
- **Migrations as numbered SQL files** in `sql/`, run by hand, as in Prospector.

## Consequences

- One language and one type system across the stack.
- Long-running jobs (big imports, report generation) will need Workers Queues, Cron Triggers or
  a separate worker; Workers have CPU-time limits per request.
- Supabase Auth ties sign-in to Supabase. Moving off it later means migrating users, which is
  possible but not trivial.

## Alternatives considered

- **Next.js on Vercel**: strong full-stack option, but splits the team across two hosting
  models and mixes server and UI code, which makes the tenancy boundary harder to audit.
- **Plain JS like Prospector**: faster to start, but too loose for an ERP's data model.
- **An off-the-shelf ERP framework (Odoo, ERPNext)**: fast feature coverage, but Python stacks
  we don't run, and their licensing and architecture constrain how we sell.
