# Input Needed from Ben

**Last updated:** 2026-10-28 · Answer inline under each **A:**. Short answers are fine.
Everything here has a default already in use, so nothing is blocked; answers change details.

## Do now (blocks testing)

1. **Run `sql/003_crm_and_activities.sql`** in the Supabase SQL Editor (whole file, nothing selected), then the three checks at the bottom. Then **Settings → Apps → CRM → Switch on**.
   **A:**

## CRM ([CRM_PLAN.md](../plans/CRM_PLAN.md) section 11)

2. Company statuses. Default: lead, prospect, client, former. Right words for GGO?
   **A:** true
   _Kept as default._
3. Sales stages. Default: New → Qualified → Proposal → Negotiation → Won / Lost (editable in CRM → Pipeline). GGO's real stages?
   **A:** true
   _Kept as default._
4. Lead source: **how did this company first come to us?** Today anyone types anything ("LinkedIn", "linkedin", "Linked In"), which can't be counted reliably. A fixed list (Referral, Website, LinkedIn, Cold outreach, Event, Partner, Other) gives clean "where do our clients come from" reports. Fixed list (you name the options, editable later) or free text?
   **A:** explain question
5. Fields your client Sheets have that companies, contacts or deals don't (e.g. contract start, headcount, service line, country)?
   **A:**
6. Who may delete CRM records: everyone who can edit (default), or admins only?
   **A:** admins
   _Done 2026-10-28: new permission `crm.records.delete`, owners and admins only; members can still create and edit._

## Time & attendance, next module (M3)

7. Should outsourced agents clock in themselves on their phones? (Default: yes.)
   **A:** yes
8. Breaks: tracked (clock out / in for break) or ignored?
   **A:** yes, check desktop/GGO-time-management
   _Read it ([notes](../research/ggo-time-management/NOTES.md)): statuses (Active, On Break, AFK, In Meeting, On Call), each paid or unpaid, every change logged as a segment; GPS on clock in/out; over-limit alerts to managers. M3 will follow that model._
9. Is time logged against a client only, or client + project / campaign?
   **A:**
10. Who approves timesheets: team leads, or one manager? Weekly (default) or monthly?
    **A:** team lead
   _Team leads approve their own team (department). Weekly assumed, as in the current app._
11. Shifts: the current app has shift scheduling. Bring it into the ERP so late / missing clock-ins are flagged against the schedule (default), or just record hours?
    **A:**

16. Does the ERP's Time & attendance **replace** the GGO Time Management app (staff move over, the old app is retired), or run **next to it** for now? It also has chat, help desk, announcements and a knowledge base; those would stay in the old app until the ERP has them.
    **A:**

## Data to move off Google Sheets (M5)

12. Moving your data in: the import screen has to match the columns your Google Sheets use today. Open each Sheet (the client list, and any time/attendance sheet) and copy just the **header row** (first row: Company, Contact, Phone, Status…) into this file, or save a copy with 2–3 example rows and fake data. No real client data is needed.
    **A:** explain

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
