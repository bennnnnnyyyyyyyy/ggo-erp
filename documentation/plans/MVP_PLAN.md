# Internal MVP Plan

**Status:** `[📋 Approved]` 2026-10-28 by Ben · **Created:** 2026-10-27 · **Owner:** Ben Arthur
**Source:** [discovery answers](../planning/2026-10-27-discovery-questions.md) · **Roadmap:** [MASTER_PLAN.md](MASTER_PLAN.md)

This plan sets out how the ERP is laid out and what the first internal version (the MVP)
contains, so management can approve the scope and get a date. No code is written for it until
this draft is approved.

---

## 1. What we heard

| Topic | Answer |
|---|---|
| The company | CX / outsourcing / software house. Needs every area eventually |
| The product | A **general-purpose, customizable ERP**: GGO first, sellable later |
| The pain | Too many tools; Google Sheets for everything |
| Who decides | Management. "Done" = an internal MVP; **they want an ETA** |
| Reference systems | Odoo as the example; no accounts yet; wants free ones to sign up for (section 3) |
| Users | ~15 total, ~5 at the same time |
| Client portal | Still to be asked |
| Code layout | TypeScript monorepo confirmed |

**Priority order you gave:**

| Rank | Area | Rank | Area |
|---|---|---|---|
| 1 | Clients / CRM | 7 | Recruiting |
| 2 | Reporting / dashboards | 8 | Payroll |
| 3 | Time tracking / attendance | 9 | Inventory / assets |
| 4 | Staff / HR | 10 | Purchasing / suppliers |
| 5 | Projects / tasks | 11 | Support / helpdesk |
| 6 | Invoicing and payments | 12 | Accounting |

## 2. Defaults I've assumed where answers were blank

Each one can be changed; most cost little to change now and a lot to change later.

| # | Question | Assumed | Why it matters |
|---|---|---|---|
| A1 | Who builds it, and how many hours (Q52) | **Ben full time with AI agents**; Malak reviews | Drives the ETA in section 8 |
| A2 | Sign-in (Q19) | **Google Workspace sign-in**, plus email + password as a fallback | Staff already live in Google |
| A3 | Layout (Q40) | **Home screen of app tiles + a left sidebar inside each app** (Odoo-style, since that's your reference) | Sets the whole UI shell |
| A4 | Countries / currency (Q27–28) | Each organization picks its own currency and time zone; one currency per org in the MVP | Invoicing and payroll come later, so this can wait |
| A5 | Client portal (Q16) | **Not in the MVP**, but the user model leaves room for a `client` role | Pending your question to management |
| A6 | Outsourced staff log in (Q17) | **Yes, for time tracking**: they clock in and log hours themselves | Time tracking is rank 3; it's useless if only managers can enter time |
| A7 | Permissions (Q18) | Roles, plus "see own / own team / everything" on CRM records and timesheets | Common need in CX teams (agents vs leads vs managers) |
| A8 | Environments (Q49) | **Separate staging and production** Supabase projects from day one | Cheap now, painful to add later |
| A9 | Stack (Q58–60) | Keep: Hono on Cloudflare Workers, React + Vite, Supabase | You confirmed the monorepo; approved with this plan |
| A10 | Tenancy (Q61–64) | Keep: one database, `org_id` on every row, modules switched on per org | Needed to sell later; see [ADR-0002](../architecture/decisions/ADR-0002-multi-tenancy.md) |
| A11 | Keep the scaffold (Q68) | **Keep it.** It already covers sign-in, organizations and the module switch | Saves about a week |
| A12 | Light/dark (Q46) | Both, following the device setting | Already in the scaffold's styles |

## 3. Systems to study (free sign-ups)

Sign up with a work email and record findings with the [teardown template](../research/_TEMPLATE/TEARDOWN.md).
Plans and free tiers change often, so check each site's pricing page before relying on it.

| Our module | System | How to get access | Why study it |
|---|---|---|---|
| All (layout, the "app" model) | **Odoo** | Online free trial; "One App Free" plan; Community edition is open source | The model for a modular, customizable ERP: app tiles, list/kanban/form views, the "chatter" activity log on each record |
| All (customization) | **ERPNext (Frappe)** | Open source; Frappe Cloud free trial | Strongest example of custom fields, custom forms and roles set up by customers without code |
| All | **Zoho One / Zoho CRM** | Free trials; Zoho CRM has a small free edition | A suite of separate apps sharing one login; good contrast with Odoo |
| CRM (rank 1) | **HubSpot CRM** | Free CRM tier | Best-in-class contacts, companies, deals and activity timeline. Clean UX to learn from |
| CRM | **Twenty** | Open source CRM, cloud trial | Modern, simple CRM built for customization |
| Dashboards (rank 2) | Odoo / HubSpot reporting | (above) | How each module's reports and the home dashboard are built |
| Time & attendance (rank 3) | **Clockify** | Free tier | Timer, timesheets, approvals, reports by client/project |
| HR (rank 4) | **OrangeHRM** | Open source starter edition; demo | Employee records, leave, documents |
| Projects (rank 5) | **Plane** | Open source; free cloud tier | Projects, tasks, boards |
| Invoicing (rank 6) | **Invoice Ninja** | Free tier; open source | Invoices, payments, client portal (helps answer A5) |
| Support (rank 11) | **Zammad** or Zoho Desk | Open source / free tier | Ticketing, if it moves up the list |

**Licensing rule.** Odoo Community (LGPL), ERPNext (GPL) and several others are open source.
Reading their docs and using the apps is fine, but **copying their code into our product would
put our sellable product under their licence terms.** We study behavior and write our own code.
See [`research/README.md`](../research/README.md).

**Suggested order:** Odoo and HubSpot first (CRM + overall layout), then Clockify. That covers
the whole MVP. The rest can wait until those modules come up.

## 4. How the product is laid out

### 4.1 Module map

Modules are grouped into **suites** so the home screen stays tidy as modules are added. Each
module is a separate unit that can be switched on per customer (and priced that way later).

```text
Core (always on)          Sales & Clients        People                 Work
├─ Home / dashboards      ├─ CRM          [MVP]  ├─ Time & attendance   ├─ Projects & tasks
├─ Users & roles          └─ Support desk        │              [MVP]   └─ (resource planning)
├─ Org settings                                  ├─ HR / employees
├─ Audit log                                     ├─ Recruiting
├─ Import / export                               └─ Payroll
└─ Activity & notes
                          Finance                Operations
                          ├─ Invoicing           ├─ Inventory & assets
                          └─ Accounting          └─ Purchasing
```

The MVP is **Core + CRM + Time & attendance + dashboards across both**. That covers ranks 1–3.

### 4.2 The shell (assumption A3)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [≡ Apps]  GGO ERP     🔍 Search everything (Ctrl+K)        🔔  (BA) ▾    │  top bar
├──────────────┬───────────────────────────────────────────────────────────┤
│ CRM          │  Deals                                [+ New]  [⚙ View]   │
│  Dashboard   │  ┌─ Filters: Owner ▾ Stage ▾ Tag ▾  Saved views ▾ ─────┐  │
│  Companies   │  │ List │ Board │                                       │  │
│  Contacts    │  ├──────┴───────────────────────────────────────────────┤  │
│ ▸Deals       │  │  …records…                                           │  │
│  Activities  │  │                                                      │  │
│  Settings    │  └──────────────────────────────────────────────────────┘  │
└──────────────┴───────────────────────────────────────────────────────────┘
  sidebar = pages of the current app       content = one of the standard views
```

- **[≡ Apps]** opens the home screen: one tile per enabled module, grouped by suite.
- **Top bar** stays the same in every app: global search, notifications, profile and organization switcher.
- **Sidebar** lists the current app's pages only, so it never grows into a 60-item menu.
- Works on a phone: the sidebar becomes a drawer. Time tracking's clock-in is designed phone-first.

### 4.3 Four standard views, reused by every module

This is what makes a general-purpose ERP fast to build and consistent to use. Each module
supplies its fields and rules; the views are shared components.

| View | Used for | Example |
|---|---|---|
| **List** | Any table of records: sort, filter, saved views, bulk actions, CSV export | Companies, contacts, time entries |
| **Board** | Records moving through stages; drag between columns | Deals by stage; later tasks, tickets, candidates |
| **Record page** | One record: fields on the left, **activity timeline** on the right (notes, calls, emails, changes, files) | A company, a deal, an employee |
| **Dashboard** | Cards of numbers and charts with date and owner filters | CRM pipeline, hours this week |

```text
Record page
┌───────────────────────────────────────────┬──────────────────────────────┐
│ Acme Health  · Client · Owner: Ben        │ Activity                     │
│ [Edit] [⋯]                                │ [Note] [Call] [Meeting] [Task]│
├───────────────────────────────────────────┤ ──────────────────────────── │
│ Details           Contacts (3)   Deals (2)│ Today  Call with J. Smith    │
│ Industry  Healthcare                      │ Mon    Stage → Proposal      │
│ Website   …                               │ Oct 20 Note: wants 5 agents  │
│ Custom fields …                           │ …                            │
└───────────────────────────────────────────┴──────────────────────────────┘
```

### 4.4 Home: what you see after signing in

- **"My day"**: my open tasks and follow-ups due, my deals that need a next step, whether I've clocked in, and my hours this week.
- **Company cards** (managers): pipeline by stage, deals won this month, team hours by client.
- App tiles underneath.

## 5. What "customizable" means

| Level | What a customer admin can change | When |
|---|---|---|
| Settings | Name, logo, colours, currency, time zone, date format | MVP |
| Lists | Pipeline stages, tags, lead sources, activity types, client statuses | MVP |
| Roles | Built-in roles, plus "own / team / all" visibility | MVP |
| Custom fields | Add fields (text, number, date, choice, person) to companies, contacts and deals | Phase 2 |
| Custom roles | Fine-grained permissions per role | Phase 2 |
| Forms and views | Rearrange record pages; saved views shared with the team | Phase 2–3 |
| Automations | "When a deal is won, create a task…" | Phase 3 |
| Custom objects | Whole new record types without code (like Frappe) | Later; very large job |

**Approach:** each module has its own real tables (fast, safe, reportable), plus a custom-fields
layer on top. We do **not** build a fully metadata-driven engine like Odoo or Frappe in the MVP.
That would add months before anything is usable.

## 6. Code layout

The current scaffold, extended per module (you confirmed the monorepo):

```text
apps/api/src/modules/<key>/       routes.ts, service.ts, schema (validation), tests
apps/web/src/modules/<key>/       pages and module-specific components
apps/web/src/components/views/    the shared List, Board, RecordPage and Dashboard views
packages/shared/src/modules/<key> manifest, permission keys, shared types
sql/NNN_<key>_<topic>.sql          one or more migrations per module
documentation/plans/<KEY>_PLAN.md  one plan per module, from MODULE_PLAN_TEMPLATE.md
```

Conventions:
- **Tables** are prefixed by module: `crm_companies`, `crm_deals`, `time_entries`. Core tables have no prefix.
- **API paths**: `/v1/<module>/<resource>`, such as `/v1/crm/deals/:id`.
- **Permissions**: `<module>.<resource>.<action>`, such as `crm.deals.manage`.
- Modules talk to each other through their API and service functions, never by reaching into each other's tables. Time entries reference a CRM company by id; that link is the one allowed dependency.

## 7. MVP scope

### Core
- Google + email sign-in, invite users, assign roles, disable users.
- Org settings (name, logo, currency, time zone).
- App home screen with tiles and "My day".
- Global search across companies, contacts and deals.
- Activity timeline and notes on any record; audit log.
- **CSV import from Google Sheets exports**, with a dry run and duplicate check. This is how we get off spreadsheets.

### CRM (rank 1)
- **Companies** (clients and prospects, with status), **contacts** linked to companies, **deals** with value, stage, owner and expected close date.
- Configurable pipeline stages; board and list views; tags; owners.
- **Activities**: notes, calls, meetings and tasks with due dates and reminders.
- Visibility: own / team / all.

### Time & attendance (rank 3)
- **Clock in / out** (phone-friendly) with breaks; attendance view for managers.
- **Time entries** against a client (CRM company) and an optional label for the work; start/stop timer or manual entry.
- **Weekly timesheet**: submit, then a manager approves or rejects with a reason. Approved weeks are locked.
- Teams (a team lead sees their team's time).

### Dashboards (rank 2, built on the two modules above)
- CRM: pipeline value by stage, won/lost this period, activities per person, deals with no next step.
- Time: hours by client, hours by person, attendance (late or missing clock-ins), timesheets awaiting approval.
- Date-range and owner filters; export any card to CSV.

### Not in the MVP
HR, projects, invoicing, recruiting, payroll, inventory, purchasing, support and accounting, plus
the client portal, custom fields, automations, billing and self sign-up. They follow in rank order (section 9).

## 8. Milestones and ETA

**This assumes A1: one developer full time with AI agents, plus review.** Weeks are working
weeks; ranges allow for unknowns.

| # | Milestone | Contents | Weeks |
|---|---|---|---|
| M0 | Research & sign-off | Odoo, HubSpot and Clockify teardowns; this plan and the ADRs approved; Supabase staging + prod | 1 |
| M1 | Core platform | Google sign-in, users and roles, settings, app home, shared List/Board/Record/Dashboard views, activity timeline, audit, search | 2–3 |
| M2 | CRM | Companies, contacts, deals, pipeline, activities, visibility rules, CSV import | 2–3 |
| M3 | Time & attendance | Clock in/out, timer and entries, weekly timesheets, approvals, teams | 2 |
| M4 | Dashboards | CRM and time dashboards, "My day" | 1 |
| M5 | Pilot | Import real data from Sheets, 3–5 pilot users, fixes, production deploy | 1–2 |
| | **Total** | | **9–12 weeks** |

**ETA for management:** starting Monday 2 November 2026, the internal MVP lands in **mid-January
to early February 2027**, allowing about a week for the holidays.

- At **half time** (about 20 h/week), expect roughly **18–22 weeks**: March to April 2027.
- A **second developer** (Malak) on the modules after M1 saves roughly 2–3 weeks.
- The biggest risks to the date: scope added mid-way, the client-portal decision (if yes, add ~2 weeks), and how messy the Google Sheets data is.

Management sees progress at the end of each milestone, not only at the end. M2 alone is a
usable CRM that can replace the client spreadsheets.

## 9. After the MVP (in your rank order)

| Phase | Modules | Rough size |
|---|---|---|
| 2 | HR / employees (4), Projects & tasks (5), custom fields | 5–7 weeks |
| 3 | Invoicing (6) from approved time, Recruiting (7) | 5–7 weeks |
| 4 | Payroll (8). Depends on the countries question; payroll rules are country-specific | 4–8 weeks per country |
| 5 | Inventory/assets (9), Purchasing (10), Support (11), Accounting (12) | 3–6 weeks each |
| Sellable | Self sign-up, billing, branding, super-admin console, security review | 4–6 weeks |

## 10. Questions still open (in order of impact)

1. **Who builds it, and how many hours a week?** This sets the ETA (A1).
2. **Client portal, yes or no?** (A5) Ask management before M1 ends.
3. **Layout: OK with Odoo-style app tiles plus a sidebar?** (A3) Needed before M1.
4. **Google sign-in: does everyone, outsourced staff included, have a company Google account?** (A2)
5. **Should outsourced agents clock in themselves?** (A6)
6. **Which Google Sheets hold the client and time data today?** Share them (or their column headers) for M2/M5.
7. **What end-to-end workflow matters most?** (Q12) You said you'd explain it later; it may reorder the phases.
8. **Countries and currencies.** Not needed for the MVP; needed before invoicing and payroll.
9. **Product name and brand.**

## 11. Approval

| Who | Decision | Date |
|---|---|---|
| Ben Arthur | Approved, start M1 | 2026-10-28 |
| Management | | |
