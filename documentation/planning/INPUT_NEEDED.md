# Input Needed from Ben

**Last updated:** 2026-10-28 · Answer inline under each **A:**. Short answers are fine.
Everything here has a default already in use, so nothing is blocked; answers change details.

## Do now (blocks testing)

1. **Run `sql/003_crm_and_activities.sql`** in the Supabase SQL Editor (whole file, nothing selected), then the three checks at the bottom. Then **Settings → Apps → CRM → Switch on**.
   **A:**

## CRM ([CRM_PLAN.md](../plans/CRM_PLAN.md) section 11)

2. Company statuses. Default: lead, prospect, client, former. Right words for GGO?
   **A:**
3. Sales stages. Default: New → Qualified → Proposal → Negotiation → Won / Lost (editable in CRM → Pipeline). GGO's real stages?
   **A:**
4. Lead source. Default: free text. Want a fixed list (referral, website, LinkedIn, cold outreach…)?
   **A:**
5. Fields your client Sheets have that companies, contacts or deals don't (e.g. contract start, headcount, service line, country)?
   **A:**
6. Who may delete CRM records: everyone who can edit (default), or admins only?
   **A:**

## Time & attendance, next module (M3)

7. Should outsourced agents clock in themselves on their phones? (Default: yes.)
   **A:**
8. Breaks: tracked (clock out / in for break) or ignored?
   **A:**
9. Is time logged against a client only, or client + project / campaign?
   **A:**
10. Who approves timesheets: team leads, or one manager? Weekly (default) or monthly?
   **A:**
11. Shifts: does anyone need a schedule to compare against (late / missing clock-ins), or just record hours?
   **A:**

## Data to move off Google Sheets (M5)

12. Share the client and time-tracking Sheets, or just their column headers, so the import can be built to match.
   **A:**

## Still open from the MVP plan ([MVP_PLAN.md](../plans/MVP_PLAN.md) section 10)

13. Client portal: yes or no? (Not in the MVP either way; affects later design.)
   **A:**
14. Countries and currencies GGO operates in (needed before invoicing and payroll).
   **A:**
15. Product name, if not "GGO ERP".
   **A:**

## Parked (decide later; defaults in place)

- **Email sending** (invites and password resets): custom SMTP, Google Workspace or Resend. Default: copy-link invites.
- **Google sign-in**: enable the provider in Supabase and set `AUTH_GOOGLE_ENABLED=true`. Default: email + password.
- **Staging environment**: second Supabase project. Default: one project for now.
- **Hosting** for the web app: Cloudflare Pages or Vercel. Default: undecided; local only.
