# Research: studying existing systems

**Parent index:** [`documentation/README.md`](../README.md)

We will be handed a list of online systems to reverse engineer. This folder holds one teardown
per system: a structured record of **what the system does**, detailed enough that we can write
a module plan from it without going back to the system.

## Ground rules

- **Record behavior, not code.** Capture screens, fields, workflows, rules and reports in our own
  words. Do not copy source code, scripts, stylesheets, images, logos, icon sets, or marketing
  and help-text copy into this repo. Do not download or vendor their bundles.
- **Use only access we are entitled to**: public pages, trial accounts, or accounts GG Outsourcing
  already holds. Respect each system's terms of service. No credential sharing, scraping behind
  logins, or probing of APIs beyond normal use.
- **Screenshots are for internal reference only.** Keep them in the system's `screenshots/`
  folder; they never ship in the product or in marketing.
- **Our product must not look like theirs.** Research informs features and workflows; our UI,
  naming and branding are our own.
- **Never paste real customer or personal data** seen in a system into this repo. Replace it
  with made-up values.

## Workflow

1. Copy [`_TEMPLATE/`](_TEMPLATE/) to `research/<system-slug>/` (lowercase, hyphens, e.g. `acme-inventory`).
2. Fill in `TEARDOWN.md` section by section. Mark anything you inferred rather than saw as *(inferred)*.
3. Fill in the **parity matrix**: each feature gets a priority (`Must` / `Should` / `Could` / `Won't`).
4. Add the system to the index below with its status.
5. When the teardown is complete, write `plans/<MODULE>_PLAN.md` from
   [`MODULE_PLAN_TEMPLATE.md`](../plans/MODULE_PLAN_TEMPLATE.md), linking back to the teardown.
   One system may feed several modules, and one module may draw on several systems.

## Index

| System | Slug | What it covers | Teardown status | Feeds plan(s) |
|---|---|---|---|---|
| _(none yet: waiting for the list)_ | | | | |

Status values: `Not started`, `In progress`, `Complete`, `Parked`.
