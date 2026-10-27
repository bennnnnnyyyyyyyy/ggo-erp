# Discovery Questions: ERP Layout and Scope

**Status:** Partly answered (2026-10-27). Turned into [`plans/MVP_PLAN.md`](../plans/MVP_PLAN.md); blanks there are filled with defaults (section 2) · **Created:** 2026-10-27
**Purpose:** settle how the ERP is laid out (product, modules, screens, code, hosting) before
building anything. Answers here become `plans/MASTER_PLAN.md` and the ADRs.

**How to answer:** write under each `**A:**`. Short answers are fine, and so is "don't know yet".
Questions marked ⭐ block planning, so answer those first. Where options are listed, pick one or
write your own.

> Note: an uncommitted scaffold already exists in this repo. Section 12 lists what it assumed so
> you can confirm or overturn each assumption. Nothing is deployed and nothing touched a database,
> so throwing it away costs nothing.

---

## 1. The business and the goal

1. ⭐ What does GG Outsourcing do day to day? Which departments would use the ERP (ops, finance, HR, sales, recruiting, client services…)?
   **A:** a General purpose- customizable erp, for ggo at the moment, we are a cx / outsourcing / software house, so we would need all of the above in an ERP
2. ⭐ What problem is this solving right now? (e.g. too many separate tools, paying for subscriptions, spreadsheets, no single view of clients/staff)
   **A:** too many tools, hate spreadsheets
3. ⭐ What tools and spreadsheets does the company use today that this should replace? Which one hurts most?
   **A:** google sheets
4. Who asked for this, and who decides what "done" looks like for version 1?
   **A:** manamgment, done is an intial mvp ,i need an eta of the internal mvp
5. What would make version 1 a success in 3 months? (e.g. "finance stops using X", "all staff log time here")
   **A:**

## 2. The systems to reverse engineer

6. ⭐ Do you have any of the list yet? Even 2–3 names help shape the layout.
   **A:** [www.odoo.com](https://www.odoo.com/) for example (suggest erps i can sign up for free)
7. Do we have accounts on these systems (company accounts, trials), or only their public websites?
   **A:** no
8. Is the goal to **replace** each system (stop paying for it) or to **combine** the best parts of several into one?
   **A:**
9. Should our version match their workflows closely (so staff don't need retraining), or is it fine to redesign?
   **A:**
10. Is any of them something the company currently pays for? Roughly how much a month? (This helps decide build order.)
    **A:**

## 3. Modules and scope

11. ⭐ Which areas does version 1 need? Rank them 1 = first, or mark "not needed".

    | Area                                                 | Rank / not needed |
    | ---------------------------------------------------- | ----------------- |
    | Clients / CRM (clients, contacts, deals)             | 1                 |
    | Staff / HR (employees, onboarding, documents, leave) | 4                 |
    | Time tracking / attendance                           | 3                 |
    | Payroll                                              | 8                 |
    | Projects / tasks                                     | 5                 |
    | Invoicing and payments                               | 6                 |
    | Accounting (ledger, expenses, tax, reports)          | 12                |
    | Purchasing / suppliers                               | 10                |
    | Inventory / assets                                   | 9                 |
    | Recruiting / applicant tracking                      | 7                 |
    | Support tickets / helpdesk                           | 11                |
    | Reporting / dashboards                               | 2                 |
    | Other:                                               |                   |

    **A:** (fill in the table)

12. Is there a workflow that crosses several areas and has to work end to end? (e.g. client signs → staff assigned → hours logged → client invoiced → staff paid)
    **A:** i will tell you all later
13. Should version 1 be one module done fully, or several modules done partly?
    **A:**

## 4. Users, roles and access

14. ⭐ Roughly how many people will use it internally at first? How many at the same time?
    **A:** 5 sim max, 15ish total
15. What kinds of users are there? (e.g. owner, managers, finance, team leads, agents/outsourced staff, clients)
    **A:**
16. Will **clients** of GG Outsourcing ever log in (a client portal to see reports and invoices, approve timesheets)?
    **A:** i still need to ask
17. Will outsourced staff log in themselves (clock in, request leave, see payslips), or only office staff?
    **A:**
18. Do permissions need to go beyond role level? (e.g. "a team lead only sees their own team", "only finance sees salaries")
    **A:**
19. How should people sign in? Email + password / Google Workspace / Microsoft / magic link / single sign-on later?
    **A:**

## 5. Selling it later

20. ⭐ Who would buy it? Other outsourcing / BPO companies, small businesses in general, or a specific industry?
    **A:**
21. How soon might the first outside customer use it? (months, a year, "someday")
    **A:**
22. How would it be priced? Per user / per module / flat tiers / setup fee + monthly?
    **A:**
23. Would customers sign up themselves online, or would you set each one up by hand?
    **A:**
24. Should each customer be able to put their own logo and colours on it (white-label), or is it always our brand?
    **A:**
25. Would any customer need its data in its own separate database or country (data residency)?
    **A:**
26. Product name? (The UI currently just says "ERP".)
    **A:**

## 6. Location, money and rules

27. ⭐ Which countries do GG Outsourcing and its staff and clients operate in?
    **A:**
28. Which currencies? Do invoices or payroll ever mix currencies?
    **A:**
29. Which tax rules matter (VAT/GST, withholding, payroll tax)? Any legal invoice format required (e.g. e-invoicing)?
    **A:**
30. Time zones: are staff and clients in different ones? Should times show in the viewer's zone or the company's?
    **A:**
31. Languages: English only, or others too (now or later)?
    **A:**

## 7. Data and migration

32. What existing data must be brought in on day one (clients, staff, past invoices, timesheets)? Where does it live now?
    **A:**
33. How much history matters? (all of it, the last year, only open items)
    **A:**
34. Are there records that must be kept for a legal period (payroll, invoices, HR files)?
    **A:**
35. Is there sensitive personal data (ID numbers, bank details, salaries, medical/leave reasons)? Who may see it?
    **A:**

## 8. Integrations

36. Which outside tools must it connect to? (Google Workspace, Microsoft 365, Slack, QuickBooks/Xero, bank, payment provider, phone system, e-signature, job boards)
    **A:**
37. Should it send emails (invoices, reminders, notifications)? From which address/domain?
    **A:**
38. Does anything need to sync both ways with Google Sheets, as Prospector does?
    **A:**
39. Should the ERP and DME Desk Prospector share anything (users, clients, sign-in)? Or stay completely separate?
    **A:**

## 9. Layout and how it looks

40. ⭐ Main navigation: which layout do you picture?
    - (a) Left sidebar grouped by module (like most ERPs)
    - (b) Top tabs per module, sidebar inside each module
    - (c) A home dashboard of tiles that opens each app (like Odoo / Zoho)

    **A:**

41. What should a user see first when they sign in? (their tasks for today, company dashboard, last screen they used)
    **A:**
42. Does anyone need it on a phone? Which tasks? (clock in, approve, check a client) Is a mobile-friendly website enough, or do you want an app later?
    **A:**
43. Desktop habits: lots of keyboard use and dense tables (finance/ops style), or simple, spacious screens?
    **A:**
44. Is there an existing brand (logo, colours, font) to use, or should it get its own look?
    **A:**
45. Any system (one on the list or another) whose look and feel you particularly like or dislike?
    **A:**
46. Is light mode, dark mode, or both needed?
    **A:**

## 10. Tech, hosting and cost

47. Any hosting preference or constraint? (Cloudflare and Supabase like Prospector, Vercel, the company's own servers, Azure/AWS because a client requires it)
    **A:**
48. Monthly budget for hosting and services, at first and once it's sold?
    **A:**
49. Should there be separate staging (test) and production environments from the start?
    **A:**
50. Where will the code live (GitHub org/account)? Private repo?
    **A:**
51. Does it need to work offline or on poor connections anywhere?
    **A:**

## 11. Team, process and timeline

52. ⭐ Who is building it? Just you with AI agents, or Malak and others too? How many hours a week?
    **A:**
53. Who reviews and approves plans and code before they go live?
    **A:**
54. Any deadline or event this needs to be ready for?
    **A:**
55. Should we keep the same documentation habits as Prospector (worklog, plans, checklist), or lighter, or stricter?
    **A:**
56. How do you want to test: you clicking through by hand (as in Prospector), automated tests, a few internal pilot users?
    **A:**

## 12. Assumptions already in the scaffold: confirm or change

| #   | Assumption                                                                                | Confirm / change |
| --- | ----------------------------------------------------------------------------------------- | ---------------- |
| 57  | TypeScript monorepo: API, web app and shared code in one repo                             | yes              |
| 58  | API on Cloudflare Workers (Hono), same as Prospector                                      |                  |
| 59  | Web app in React + Vite                                                                   |                  |
| 60  | Supabase Postgres for data, Supabase Auth for sign-in (not Prospector's own login system) |                  |
| 61  | One database for all customers, every row tagged with its company (`org_id`)              |                  |
| 62  | A user can belong to several companies and switch between them                            |                  |
| 63  | Fixed roles to start (owner, admin, member, viewer), custom roles later                   |                  |
| 64  | Features grouped into modules that are switched on per customer (the hook for pricing)    |                  |
| 65  | Left-sidebar layout, grouped by module                                                    |                  |
| 66  | SQL migrations run by hand in Supabase, as in Prospector                                  |                  |
| 67  | Money stored in cents with a currency code; all times stored in UTC                       |                  |
| 68  | Keep the scaffold as the starting point (vs. delete it and start once the plan is agreed) |                  |

---

## Next step

Once the ⭐ questions are answered: write the module map and screen layout as a draft in
`documentation/plans/`, update the master plan, and confirm or rewrite ADR-0001/0002. No more
code until that draft is approved.
