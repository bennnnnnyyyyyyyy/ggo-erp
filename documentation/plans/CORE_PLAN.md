# Core Platform Plan (M1)

**Module key:** `core`
**Status:** `[🟡 In progress]` · **Created:** 2026-10-28
**Owner:** Ben Arthur · **Reviewers:** Ben Arthur
**Parent plan:** [MVP_PLAN.md](MVP_PLAN.md) milestone M1 (approved 2026-10-28)
**Research:** none yet; the layout follows MVP_PLAN section 4 (Odoo-style tiles + per-app sidebar)
**Depends on modules:** none (always on)

---

## 1. Goal

Give every later module a place to live: a consistent shell, an app home screen, organization
settings, user management with roles, and shared views. Used by every member; managed by
owners and admins.

## 2. Scope

M1 is delivered in two slices so there is something to click through early.

**Slice 1 (now):**

| ID | Feature |
|---|---|
| C1 | Shell: top bar (Apps button, org name, user menu with switch org / sign out), per-app sidebar, phone drawer, URL routing |
| C2 | App home: greeting, one tile per enabled app the user can open, grouped by suite |
| C3 | Settings → General: org name, default currency, time zone, date format |
| C4 | Settings → Users: list members with role and status; invite by email; change role; disable / re-enable |
| C5 | Settings → Audit log: newest first, who did what |
| C6 | Shared **List view**: columns, sort, quick search, CSV export of what is shown |
| C7 | Sign-in: password reset (done 2026-10-28), invite acceptance (set password), optional Google button |

**Slice 2 (rest of M1):** shared **Record page** with the **activity timeline** (notes, changes)
backed by a generic `activities` table; **Board** view; **Dashboard** cards; **global search**
(Ctrl+K) once CRM records exist; **logo upload** (Supabase Storage bucket per org); in-app
notifications.

**Out (later phases):** custom roles, custom fields, self sign-up, billing.

## 3. Data model

Slice 1 reuses `sql/001` tables. Org settings that have no column live in
`organizations.settings` (jsonb): `date_format` for now.

**Migration `sql/002_core_user_lookup.sql`:** `public.find_auth_user_id(email)` returns the
Auth user id for an email, service role only. The API needs it to invite someone who already
has an account (for example a member of another organization).

## 4. Permissions

| Key | Default roles | Allows |
|---|---|---|
| `core.org.read` | all | See org settings |
| `core.org.manage` | owner, admin | Change org settings |
| `core.users.read` | owner, admin, member | See the member list |
| `core.users.manage` | owner, admin | Invite, change roles, disable |
| `core.audit.read` | all | See the audit log |

Role rules, enforced in the API (`apps/api/src/modules/core/members.ts`):

- Only an **owner** can make someone an owner, or change or disable an owner.
- Nobody can change their own role or disable themselves (prevents lock-out).
- The last active owner can never be demoted or disabled.

## 5. API

| Method | Path | Permission | Body | Returns |
|---|---|---|---|---|
| GET | `/v1/core/org` | `core.org.read` | | org settings |
| PATCH | `/v1/core/org` | `core.org.manage` | `name`, `defaultCurrency`, `timezone`, `dateFormat` | org settings |
| GET | `/v1/core/members` | `core.users.read` | | `Member[]` |
| POST | `/v1/core/members` | `core.users.manage` | `email`, `role` | `{ member, inviteLink }` |
| PATCH | `/v1/core/members/:id` | `core.users.manage` | `role` | `Member` |
| POST | `/v1/core/members/:id/disable` · `/enable` | `core.users.manage` | | `Member` |
| POST | `/v1/core/members/:id/invite-link` | `core.users.manage` | | `{ inviteLink }` |
| GET | `/v1/core/audit` | `core.audit.read` | `limit` | audit rows (exists) |

**Invites without email.** Supabase's built-in mailer only delivers to the Supabase team, so
the API generates the invite link (`auth.admin.generateLink`) and returns it to the admin, who
sends it however they like. An existing account is simply added to the org. When custom SMTP is
set up the API can send the email instead; the screen stays the same.

Every change writes `audit_log`: `organization.updated`, `member.invited`, `member.added`,
`member.role_changed`, `member.disabled`, `member.enabled`, `member.invite_link_created`.

## 6. Screens

| Screen | Route | Permission |
|---|---|---|
| App home | `/` | member |
| Settings → General | `/settings` | `core.org.read` (edit needs `core.org.manage`) |
| Settings → Users | `/settings/users` | `core.users.read` (actions need `core.users.manage`) |
| Settings → Audit log | `/settings/audit` | `core.audit.read` |

## 7. Business rules

Currency: ISO 4217 code, three capital letters. Time zone: any IANA name the runtime knows.
Date format: `DD/MM/YYYY`, `MM/DD/YYYY` or `YYYY-MM-DD`.

## 8. Org settings this module adds

Name, default currency, time zone, date format. Logo and colours in slice 2.

## 9. Tests

Unit tests for the role rules. Route tests for auth and validation without a database.
A two-org isolation test needs a test database; tracked for slice 2.

## 10. Rollout

1. Run `sql/002_core_user_lookup.sql` and its verification query; log it in the worklog.
2. Add the app's URL to Supabase Auth → URL Configuration → Redirect URLs (invite and reset links).
3. Optional: enable the Google provider in Supabase Auth and set `AUTH_GOOGLE_ENABLED=true` in `.env`.
4. Manual check in the browser.

## 11. Open questions

- Custom SMTP provider and sender address, so invites and resets are emailed.
- Google Workspace sign-in for everyone (MVP_PLAN section 10, question 4).
