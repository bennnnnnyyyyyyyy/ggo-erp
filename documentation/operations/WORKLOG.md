# GGO ERP Worklog

Newest first. Every significant fix, schema change, migration run, deployment or data operation
gets an entry with these four headings:

- **Objective.** Why the work was done.
- **Actions Completed.** What changed, with file paths.
- **Database / System Result.** What happened in Supabase / Cloudflare / hosting, or "None".
- **Safety Status.** Tests run, what was not verified, and manual steps still needed.

---

## 2026-10-28 — First answers from INPUT_NEEDED applied

**Objective.** Act on Ben's answers in `documentation/planning/INPUT_NEEDED.md`.

**Actions Completed.** Q6 (admins delete): new permission `crm.records.delete` (owner/admin); built-in members now get only `.read` keys plus a module's `memberGrants` (`packages/shared/src/permissions.ts`); `lib/resource.ts` takes an optional `deletePermission`; CRM record pages hide Delete without it. Q8: read GGO's existing time app and wrote `documentation/research/ggo-time-management/NOTES.md` (paid/unpaid status segments, GPS, shifts, departments, weekly approvals, overtime rules) as input for M3. Recorded Q2, Q3, Q7, Q10 and clarified Q4, Q11, Q12 in the file; CRM_PLAN permissions table updated.

**Database / System Result.** None.

**Safety Status.** `npm run typecheck` clean; `npm test` passing (shared 12, api 11). Not browser-tested.

## 2026-10-28 — CRM (M2) and M1 slice 2 building blocks

**Objective.** Ben asked for a working MVP and to keep building, parking decisions. Built the CRM with the shared record page, timeline, board and search it needs.

**Actions Completed.**
- Plans: new `documentation/plans/CRM_PLAN.md` (defaults; open questions in section 11); new `documentation/planning/INPUT_NEEDED.md` collecting every question for Ben.
- `sql/003_crm_and_activities.sql` (new, not run): `crm_pipeline_stages`, `crm_companies`, `crm_contacts`, `crm_deals`, core `activities`; composite `(org_id, id)` foreign keys so records can't link across orgs; RLS read for members, writes only via the API.
- Shared: `fields.ts` (field definitions + `validateRecord`, money input helpers), `crm.ts` (record types, field lists, default stages, `closedAtFor`), CRM module manifest with `memberGrants` (members may manage CRM records), activity and timeline types. Tests in `fields.test.ts`.
- API: `lib/resource.ts` generic org-scoped CRUD (validation, same-org reference checks, soft delete, audit with before/after); `modules/crm/routes.ts` (companies, contacts, deals, stages, search; stage delete refused while it holds deals; won/lost stages set `closed_at`); core `activityRoutes.ts` (activities, "my tasks", timeline merging activities with audit history) and `moduleRoutes.ts` (switch modules on/off; CRM seeds the default pipeline).
- Web: path parameters in the router; shared `RecordPage`, `RecordForm`, `Timeline`, `BoardView`, `Modal`, field inputs/values; CRM app (deals board + list, companies, contacts, record pages with related lists, pipeline settings); Settings → Apps; "My tasks" on home; top-bar search (Ctrl+K).

**Database / System Result.** None. `sql/003` written, not run.

**Safety Status.** `npm run typecheck` clean; `npm test` 23/23 (shared 12, api 11). Not browser-tested. Manual: run `sql/003` and its checks, then Settings → Apps → switch on CRM, then click through.

## 2026-10-28 — sql/002 applied

**Objective.** Enable inviting people from Settings → Users.

**Actions Completed.** Ben ran `sql/002_core_user_lookup.sql` in the SQL Editor.

**Database / System Result.** Project `plhuuhcpvlytozyedamt`: `public.find_auth_user_id(text)` created. Verification query 2: anon false, authenticated false, service_role true (as intended). `sql/002` status: **Run (live)**.

**Safety Status.** Function only; no tables or data touched. Ben also saved settings on Authentication → OAuth Server (the page that makes Supabase an identity provider for other apps). The ERP does not use it; recommended turning it back off. Site URL is `http://localhost:5173`, which also covers invite and reset redirects locally.

## 2026-10-28 — MVP plan approved; M1 core platform, slice 1

**Objective.** Ben approved the MVP plan and asked for M1 to start. He also clarified that DME Desk Prospector only supplied the agent instructions and skills, not the design.

**Actions Completed.**
- Docs: `MVP_PLAN.md` marked approved; ADR-0001 and ADR-0002 accepted, with the Prospector framing removed from ADR-0001 and MVP_PLAN A9 and a note added to the discovery questions; new `documentation/plans/CORE_PLAN.md` (M1, two slices); `plans/README.md` and `checklist.md` updated.
- `sql/002_core_user_lookup.sql` (new, not run): `find_auth_user_id(email)`, security definer, service role only.
- Shared (`packages/shared`): `core.org.read` permission; `core.ts` with `OrgSettings`, `Member`, `InviteResult`, `AuditEntry`, `ROLES`, `DATE_FORMATS`; the session's `org` now carries currency, time zone and date format.
- API (`apps/api`): `lib/audit.ts` (`writeAudit`), `lib/body.ts`; `modules/core/org.ts` (GET/PATCH `/v1/core/org`); `modules/core/memberRoutes.ts` (list, invite, change role, disable/enable, new invite link); `modules/core/members.ts` holds the role rules (only owners touch owners, no self-changes, always one active owner). Invites return a link generated with `auth.admin.generateLink` instead of emailing, because the built-in mailer only reaches the Supabase team. A new link can only be made for an account this org created that has never signed in (stops one org's admin taking over another org's user). Every change writes `audit_log`. Tests in `test/core.test.ts`.
- Web (`apps/web`): history router (`lib/router.tsx`); new shell with a top bar (Apps, org, user menu), per-app sidebar and phone drawer; app home with tiles grouped by suite (`modules/core/Home.tsx`); app registry (`modules/registry.tsx`); Settings → General, Users, Audit log; shared `components/views/ListView.tsx` (search, sort, CSV export); dates shown in the org's time zone and format (`lib/format.ts`); invite links land on "Choose a password"; optional "Continue with Google" behind `AUTH_GOOGLE_ENABLED`; a user with one org skips the org picker. Removed `CoreHome.tsx`.

**Database / System Result.** None. `sql/002` written, not run. No schema or data changes in this entry.

**Safety Status.** `npm run typecheck` clean; `npm test` 15/15 (shared 4, api 11). Not browser-tested. Known: `npm run build -w apps/web` fails because npm runs scripts in Windows PowerShell 5, which rejects `&&` (existing script, not changed here). Manual steps: run `sql/002` in the SQL Editor; add `http://localhost:5173` to Supabase Auth Redirect URLs; then click through the app.

## 2026-10-28 — Organization renamed to GGO; local API started

**Objective.** The company is GGO (Gulf Global Outsourcing), not "GG Outsourcing". Ben's sign-in also showed "Failed to fetch".

**Actions Completed.** At Ben's request, PATCHed `organizations` row `6e5ca4f3-…8f8f` to `name = 'GGO'`, `slug = 'ggo'` over the REST API, and inserted an `organization.updated` row in `audit_log` with before/after values. Replaced "GG Outsourcing" with "GGO" in `agents.md`, `README.md`, `sql/README.md`, both ADRs, the discovery questions, `MODULE_PLAN_TEMPLATE.md` and `research/README.md` (older worklog entries left as history). "Failed to fetch" was the local API not running (nothing on port 8787); started it with `npm run dev:api`.

**Database / System Result.** Project `plhuuhcpvlytozyedamt`: organization now GGO / `ggo`, same id; audit row id 2. No schema change.

**Safety Status.** Single-row update to a verified target plus one append-only audit insert. Both apps must be running locally (`npm run dev:api` and `npm run dev:web`) for sign-in to work.

## 2026-10-28 — Owner account email corrected

**Objective.** The owner account was created as `bd@prime-ad.com`, which is not a real mailbox, so it could never receive a reset link. Ben asked for it to be deleted or changed to `ben@prime-ad.com`.

**Actions Completed.** Changed rather than deleted (deletion is blocked by the owner membership and audit references, and would orphan them). At Ben's request the agent called the Auth admin API `PUT /auth/v1/admin/users/6c11936c-d114-443b-aa4a-18719b63bd01` with `email = ben@prime-ad.com`, `email_confirm = true`, after confirming it was the only user and the new address was unused.

**Database / System Result.** Project `plhuuhcpvlytozyedamt`: user `6c11936c-…bd01` now `ben@prime-ad.com`, confirmed. Same user id, so the GG Outsourcing owner membership is unchanged (verified). The password was not changed.

**Safety Status.** Single-row update to one verified user. No audit row written (Auth admin change, outside the app). Ben still needs to set a password through the reset flow.

## 2026-10-28 — Password reset flow in the web app

**Objective.** Ben's sign-in failed with "Invalid login credentials" and the app had no way to reset a password. Deleting the user in the dashboard also failed ("Database error deleting user").

**Actions Completed.**
- Read-only check of the Auth admin API: `bd@prime-ad.com` exists, is confirmed and not banned, and last signed in successfully 2026-10-27 20:23 UTC, so the failure is a wrong password, not configuration.
- `apps/web/src/components/SignIn.tsx`: "Forgot password?" mode that calls `resetPasswordForEmail` with `redirectTo` set to the app's origin; same message whether or not the account exists; shows expired-link errors.
- `apps/web/src/components/SetPassword.tsx` (new): set and confirm a new password on the recovery session (`updateUser`).
- `apps/web/src/lib/supabase.ts`: detects `type=recovery` / `error_description` in the URL hash before the client strips it. `apps/web/src/App.tsx`: shows `SetPassword` when arriving from a recovery link or on the `PASSWORD_RECOVERY` event.
- The failed delete is expected: `memberships.user_id`, `org_modules.enabled_by` and `audit_log.actor_user_id` reference `auth.users` with no cascade, so Postgres refuses to delete a user who owns an org or appears in the append-only audit log. Not changed; the owner account should be reset, not deleted.

**Database / System Result.** None changed. Read-only Auth admin query only.

**Safety Status.** `npm run typecheck` clean; `npm test` passing (shared 4, api 4). Reset flow not yet tested in the browser. Manual: add `http://localhost:5173` to Supabase Auth > URL Configuration > Redirect URLs; the built-in mailer only delivers to members of the Supabase org team and is heavily rate-limited, so real use needs custom SMTP.

## 2026-10-27 — sql/001 applied and first organization bootstrapped

**Objective.** Let Ben sign in: the account existed but belonged to no organization.

**Actions Completed.** Ben ran `sql/001_tenancy_core.sql` in the SQL Editor and created the Auth user `bd@prime-ad.com`. At Ben's request the agent then called `bootstrap_organization('GG Outsourcing', 'gg-outsourcing', 'bd@prime-ad.com')` over the REST RPC endpoint with the project's secret key.

**Database / System Result.** Project `plhuuhcpvlytozyedamt`: one organization (GG Outsourcing, `6e5ca4f3-ca9a-4e1b-b8b9-2952ead68f8f`), one membership (owner), one `organization.created` audit row. `sql/001` status: **Run (live)**.

**Safety Status.** Insert-only, through the sanctioned bootstrap function. Sign-in through the browser still to be confirmed by Ben.

## 2026-10-27 — Local apps connected to the Supabase project

**Objective.** Get the local app past "Failed to fetch" using the Supabase project Ben created (ref `plhuuhcpvlytozyedamt`).

**Actions Completed.** Both apps now read the one git-ignored `.env` at the repo root: `apps/api` via `wrangler dev --env-file ../../.env`; `apps/web` via `vite.config.ts`, which hands the browser only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The API's secret is renamed `SUPABASE_SECRET_KEY` (new Supabase key naming) and honours an optional `SUPABASE_JWKS_URL`. Added `.env.example`; the sign-in page says when Supabase isn't configured. Added `@types/node` to the web app for the config file.

**Database / System Result.** Read-only checks only: auth health 200, JWKS 200, `public.organizations` does not exist yet (`sql/001` not run). The Supabase connector has no permission on this project, so no SQL was run by the agent.

**Safety Status.** Typecheck clean; tests 8/8. `.env` is git-ignored and its values were never printed. Still needed (manual): run `sql/001` in the SQL Editor, create the owner user, run `bootstrap_organization`.

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
