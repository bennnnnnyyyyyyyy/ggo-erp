# SQL migrations

Numbered files, run by hand in the Supabase SQL Editor by the project owner, one at a time,
in order. Agents write and review these files; **agents do not execute them against a
Supabase project** unless the user explicitly asks for that specific file on that specific
project, and the run is then logged in
[`documentation/operations/WORKLOG.md`](../documentation/operations/WORKLOG.md).

## Rules for every file

- Named `NNN_short_name.sql`, numbered after the highest existing number (check this folder
  before picking one; two files must never share a number).
- Wrapped in `begin; … commit;` so a failure leaves the database untouched.
- Rerun-safe: `create table if not exists`, `create or replace function`, add columns with
  `add column if not exists`. Never `drop table`, `truncate` or a broad `delete`.
- Every business table: `org_id uuid not null references organizations(id)`, RLS enabled,
  `created_at`, `updated_at`, `deleted_at`, and an index that leads with `org_id`.
- Money in `bigint` minor units plus a `char(3)` currency. Timestamps as `timestamptz`.
- Read-only verification queries at the bottom. Save their output with the run.
- Paste the whole file with nothing selected (a partial selection cuts a `$$` function body in half).

## Status

| File | Purpose | Status |
|---|---|---|
| `001_tenancy_core.sql` | `organizations`, `memberships`, `org_modules`, append-only `audit_log`, `is_org_member()`, RLS, `bootstrap_organization()` | **Run 2026-10-27** on `plhuuhcpvlytozyedamt` (by Ben, SQL Editor); GGO bootstrapped (renamed from GG Outsourcing 2026-10-28) |
| `002_core_user_lookup.sql` | `find_auth_user_id(email)` for adding existing accounts to an org; service role only | **Run 2026-10-28** on `plhuuhcpvlytozyedamt` (by Ben, SQL Editor); verified: only service_role can execute |

## After 001: creating the first organization

1. In Supabase, **Authentication > Users > Add user** with the owner's email and a password.
2. In the SQL Editor:

   ```sql
   select public.bootstrap_organization('GGO', 'ggo', '<owner email>');
   ```

3. Log the run in the worklog.
