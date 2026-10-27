# Architecture

How GGO ERP works today. **Status:** scaffold only (2026-10-27). Nothing is deployed and
`sql/001` has not been run. See the [worklog](../operations/WORKLOG.md).

## The short version

| Part | Where | Runs on | Notes |
|---|---|---|---|
| API | `apps/api/` | Cloudflare Workers (Hono, TypeScript) | Trusted server side. Holds the Supabase service-role key. Enforces tenancy and permissions. |
| Web app | `apps/web/` | Static build (Vite + React); host TBD (Cloudflare Pages or Vercel) | Signs in with Supabase Auth. All data goes through the API. |
| Shared | `packages/shared/` | Imported by both | Response types, module manifests, permission keys, money helpers. |
| Database | `sql/` | Supabase Postgres | Numbered migrations, run by hand. RLS on every table. |
| Auth | Supabase Auth | | The API verifies the access token (JWT) against the project's JWKS. |

Why these choices: [ADR-0001](decisions/ADR-0001-stack.md). Tenancy model:
[ADR-0002](decisions/ADR-0002-multi-tenancy.md).

## Request flow

```text
Browser (apps/web)
  │  supabase.auth.signInWithPassword()  → access token (JWT)
  │  fetch(`${VITE_API_BASE_URL}/v1/<module>/...`)
  │  Authorization: Bearer <jwt>    X-Org-Id: <organization uuid>
  ▼
Cloudflare Worker (apps/api/src/index.ts, Hono)
  │  cors → requireAuth (verify JWT, set c.var.user)
  │       → requireTenant (membership in X-Org-Id, role → permissions, enabled modules; set c.var.tenant)
  │       → requireModule(<key>) → route → requirePermission('<module>.<action>')
  ▼
apps/api/src/modules/<key>/routes.ts
  │  every query filters by c.var.tenant.orgId
  ▼
Supabase Postgres (service-role client; RLS is the second line of defence)
```

The browser talks to Supabase directly for exactly two things: signing in, and listing the
user's own organizations in the picker (RLS limits that to their memberships).

## Response shape

Every response is `{ success: true, data }` or `{ success: false, status, error, code? }`, and
the HTTP status matches `status`. `HttpError` maps to its own status; `NotConfiguredError` (a
missing secret) maps to **503**; anything else is logged and returns 500 with a generic message.

## Modules

A module is a sellable unit (inventory, invoicing, HR…). It consists of:

1. A manifest in `packages/shared/src/modules.ts`: key, name, dependencies, permission keys.
2. API routes in `apps/api/src/modules/<key>/routes.ts`, registered in `apps/api/src/modules/registry.ts`
   and mounted at `/v1/<key>`, behind `requireModule(<key>)`.
3. Screens in `apps/web/src/modules/<key>/`, registered in `apps/web/src/modules/registry.tsx`.
   The sidebar shows only enabled modules and pages the user has permission for.
4. Tables in a numbered `sql/` migration, every one with `org_id` and RLS.
5. A row in `org_modules` switches it on for an organization. `core` is always on.

## Database conventions

See [`sql/README.md`](../../sql/README.md). In short: `org_id` on every business table, RLS
on, soft delete (`deleted_at`), `created_at`/`updated_at`, money as `bigint` minor units plus
currency, `timestamptz` everywhere, append-only `audit_log` for changes.

## Permissions

Built-in roles (`owner`, `admin`, `member`, `viewer`) map to default permissions in
`packages/shared/src/permissions.ts`. Permission keys are `<module>.<resource>.<action>`, and
a grant of `<module>.*` covers everything in that module. Custom roles per organization are
planned (see the [Master Plan](../plans/MASTER_PLAN.md), phase 1).

## Local development

```powershell
npm install
Copy-Item .env.example .env    # one file for both apps; fill in from Supabase > Project Settings > API Keys
npm run dev:api    # http://localhost:8787 (wrangler dev --env-file ../../.env)
npm run dev:web    # http://localhost:5173
npm run typecheck
npm test
```

## Known issues

- Vitest 5 on this Windows machine waits ~10 s after tests finish ("close timed out … 2 Vite
  servers"). Tests still pass and the exit code is 0.
