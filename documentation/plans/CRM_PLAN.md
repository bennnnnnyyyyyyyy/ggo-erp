# CRM Plan (M2)

**Module key:** `crm`
**Status:** `[🟡 In progress]` · **Created:** 2026-10-28 (built on Ben's go-ahead; defaults below are open to change, see section 11)
**Owner:** Ben Arthur · **Reviewers:** Ben Arthur
**Parent plan:** [MVP_PLAN.md](MVP_PLAN.md) milestone M2
**Research:** none yet (Odoo / HubSpot teardowns pending); scope follows MVP_PLAN section 7
**Depends on modules:** core

---

## 1. Goal

Replace the client spreadsheets: one place for companies (clients and prospects), the people
at them, the deals being worked, and every note, call, meeting and task along the way.

## 2. Scope

**In (this version):**

| ID | Feature |
|---|---|
| R1 | Companies: name, status (lead / prospect / client / former), industry, website, phone, email, address, source, owner, tags |
| R2 | Contacts: name, job title, email, phone, company, owner, tags |
| R3 | Deals: title, company, contact, value + currency, stage, owner, expected close date, lost reason, tags |
| R4 | Pipeline stages per org, editable (name, order, open / won / lost); a default set is created when CRM is switched on |
| R5 | Board view of deals by stage (drag to move) and list views for all three |
| R6 | Record page for each, with an activity timeline: notes, calls, meetings, tasks (due date, assignee, done) and the change history |
| R7 | "My tasks" on the home screen; global search across companies, contacts and deals |

**Out (later):** own / team / all visibility (needs teams, M3; until then everyone with
`crm.*.read` sees all records, which suits ~15 users); CSV import (M5 with the real Sheets);
custom fields (phase 2); email sync.

## 3. Data model

Migration: `sql/003_crm_and_activities.sql`. Every table has `org_id`, RLS (members read;
writes only through the API), `created_at`, `updated_at`, `deleted_at`, and indexes leading with
`org_id`. Links between records use composite foreign keys `(org_id, id)` so a record can never
point at another organization's data, even through a bug.

| Table | Key columns |
|---|---|
| `crm_pipeline_stages` | `name`, `position`, `kind` (open / won / lost) |
| `crm_companies` | `name`, `status`, `industry`, `website`, `phone`, `email`, `address`, `source`, `owner_id`, `tags text[]` |
| `crm_contacts` | `first_name`, `last_name`, `company_id`, `job_title`, `email`, `phone`, `owner_id`, `tags` |
| `crm_deals` | `title`, `company_id`, `contact_id`, `stage_id`, `amount_minor bigint`, `currency char(3)`, `owner_id`, `expected_close_date`, `closed_at`, `lost_reason`, `tags` |
| `activities` (core) | `entity_type`, `entity_id`, `kind` (note / call / meeting / task), `subject`, `body`, `due_at`, `done_at`, `assignee_id` |

`activities` is a core table so any later module (HR, projects, support) gets a timeline for free.
Change history on the timeline comes from `audit_log`, so it is never duplicated.

Moving a deal into a won or lost stage sets `closed_at`; moving it back to an open stage clears it.

## 4. Permissions

| Key | Default roles | Allows |
|---|---|---|
| `crm.records.read` | all | See companies, contacts, deals, their timelines |
| `crm.records.manage` | owner, admin, member | Create, edit, delete records; log activities |
| `crm.records.delete` | owner, admin | Delete records (Ben, 2026-10-28) |
| `crm.settings.manage` | owner, admin | Edit pipeline stages |

Members get `crm.records.manage` because sales staff must be able to work their deals. That is
a change from the core default (members get no `.manage`); the shared role mapping allows a
module to grant specific manage keys to members.

## 5. API

| Method | Path | Permission |
|---|---|---|
| GET/POST | `/v1/crm/companies`, `/contacts`, `/deals` | read / manage |
| GET/PATCH/DELETE | `/v1/crm/<resource>/:id` | read / manage |
| GET/POST/PATCH/DELETE | `/v1/crm/stages[/:id]` | read / `crm.settings.manage` |
| GET | `/v1/crm/search?q=` | read |
| GET/POST | `/v1/core/activities?entityType=&entityId=` | the entity's read / manage |
| PATCH/DELETE | `/v1/core/activities/:id` | the entity's manage |
| GET | `/v1/core/activities/mine` | member |
| GET | `/v1/core/timeline?entityType=&entityId=` | the entity's read |
| GET | `/v1/core/modules`; POST `/v1/core/modules/:key/enable` · `/disable` | `core.org.read` / `core.org.manage` |

Fields are validated from one field definition in `packages/shared/src/crm.ts`, used by both the
API and the web forms. Deletes are soft. Every create, update and delete writes `audit_log`.

## 6. Screens

| Screen | Route |
|---|---|
| Deals board / list | `/crm`, `/crm/deals/list` |
| Companies list | `/crm/companies` |
| Contacts list | `/crm/contacts` |
| Record pages | `/crm/companies/:id`, `/crm/contacts/:id`, `/crm/deals/:id` |
| Pipeline settings | `/crm/settings` |
| Apps on/off | `/settings/apps` |

## 7. Business rules

Deal value is stored in minor units of its currency; it defaults to the org's currency. Totals
on the board are per currency and never mix currencies.

## 8. Org settings this module adds

Pipeline stages. Company statuses and lead sources are fixed lists for now (section 11).

## 9. Tests

Shared field validation (types, required, enums, money, tags). Stage closed-at rule.

## 10. Rollout

1. Run `sql/003_crm_and_activities.sql` and its verification queries; log in the worklog.
2. Restart the API and web app.
3. Settings → Apps → switch CRM on (creates the default pipeline).
4. Manual check in the browser.

## 11. Open questions (defaults in use)

1. **Company statuses**: lead, prospect, client, former. Right words for GGO?
2. **Default pipeline**: New → Qualified → Proposal → Negotiation → Won / Lost. GGO's real sales stages?
3. **Lead sources**: free text for now. Want a fixed list (referral, website, LinkedIn, cold outreach…)?
4. **Fields missing** from companies, contacts or deals that the Sheets have today?
5. **Who may delete** records: everyone who can edit (default), or admins only?
