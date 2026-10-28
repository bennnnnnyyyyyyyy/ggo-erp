-- 003_crm_and_activities.sql
-- CRM tables (pipeline stages, companies, contacts, deals) and the core `activities` table
-- that gives any record a timeline of notes, calls, meetings and tasks.
-- Plan: documentation/plans/CRM_PLAN.md
--
-- Rerun-safe: `if not exists` everywhere; policies and triggers dropped and recreated by name.
-- No table or data is ever dropped. Run the whole file in the Supabase SQL Editor with nothing
-- selected, then run the verification queries at the bottom.
--
-- Links between records use composite foreign keys on (org_id, id), so a row can only ever
-- point at a row in the same organization.

begin;

-- ---------------------------------------------------------------- pipeline stages

create table if not exists public.crm_pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id),
  name        text not null check (length(trim(name)) between 1 and 80),
  position    integer not null default 0,
  kind        text not null default 'open' check (kind in ('open', 'won', 'lost')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (org_id, id)
);
create index if not exists crm_pipeline_stages_org_idx on public.crm_pipeline_stages (org_id, position) where deleted_at is null;

-- ---------------------------------------------------------------- companies

create table if not exists public.crm_companies (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id),
  name        text not null check (length(trim(name)) between 1 and 200),
  status      text not null default 'lead' check (status in ('lead', 'prospect', 'client', 'former')),
  industry    text,
  website     text,
  phone       text,
  email       text,
  address     text,
  source      text,
  owner_id    uuid references auth.users(id),
  tags        text[] not null default '{}',
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (org_id, id)
);
create index if not exists crm_companies_org_idx on public.crm_companies (org_id, created_at desc) where deleted_at is null;
create index if not exists crm_companies_name_idx on public.crm_companies (org_id, lower(name));

-- ---------------------------------------------------------------- contacts

create table if not exists public.crm_contacts (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id),
  first_name  text not null check (length(trim(first_name)) between 1 and 100),
  last_name   text,
  company_id  uuid,
  job_title   text,
  email       text,
  phone       text,
  owner_id    uuid references auth.users(id),
  tags        text[] not null default '{}',
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (org_id, id),
  foreign key (org_id, company_id) references public.crm_companies (org_id, id)
);
create index if not exists crm_contacts_org_idx on public.crm_contacts (org_id, created_at desc) where deleted_at is null;
create index if not exists crm_contacts_company_idx on public.crm_contacts (org_id, company_id);

-- ---------------------------------------------------------------- deals

create table if not exists public.crm_deals (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id),
  title               text not null check (length(trim(title)) between 1 and 200),
  company_id          uuid,
  contact_id          uuid,
  stage_id            uuid not null,
  amount_minor        bigint not null default 0 check (amount_minor >= 0),
  currency            char(3) not null check (currency ~ '^[A-Z]{3}$'),
  owner_id            uuid references auth.users(id),
  expected_close_date date,
  closed_at           timestamptz,
  lost_reason         text,
  tags                text[] not null default '{}',
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  unique (org_id, id),
  foreign key (org_id, company_id) references public.crm_companies (org_id, id),
  foreign key (org_id, contact_id) references public.crm_contacts (org_id, id),
  foreign key (org_id, stage_id) references public.crm_pipeline_stages (org_id, id)
);
create index if not exists crm_deals_org_idx on public.crm_deals (org_id, created_at desc) where deleted_at is null;
create index if not exists crm_deals_stage_idx on public.crm_deals (org_id, stage_id) where deleted_at is null;
create index if not exists crm_deals_company_idx on public.crm_deals (org_id, company_id);

-- ---------------------------------------------------------------- activities (core)

-- Notes, calls, meetings and tasks attached to any record. `entity_type` names the record type
-- (for example `crm_company`); the API checks the caller may read or manage that type.
create table if not exists public.activities (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id),
  entity_type  text not null check (entity_type ~ '^[a-z][a-z0-9_]{1,60}$'),
  entity_id    uuid not null,
  kind         text not null check (kind in ('note', 'call', 'meeting', 'task')),
  subject      text check (subject is null or length(subject) <= 200),
  body         text check (body is null or length(body) <= 10000),
  due_at       timestamptz,
  done_at      timestamptz,
  assignee_id  uuid references auth.users(id),
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);
create index if not exists activities_entity_idx on public.activities (org_id, entity_type, entity_id, created_at desc) where deleted_at is null;
create index if not exists activities_open_tasks_idx on public.activities (org_id, assignee_id, due_at)
  where kind = 'task' and done_at is null and deleted_at is null;

-- ---------------------------------------------------------------- triggers and RLS

do $$
declare t text;
begin
  foreach t in array array['crm_pipeline_stages', 'crm_companies', 'crm_contacts', 'crm_deals', 'activities'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', t || '_updated_at', t);

    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke insert, update, delete on public.%I from authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_member_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (deleted_at is null and public.is_org_member(org_id))', t || '_member_read', t);
  end loop;
end $$;

commit;

-- ---------------------------------------------------------------- verification (read-only)

-- 1. Five tables with RLS on (expect five rows, relrowsecurity = true).
select relname, relrowsecurity from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('crm_pipeline_stages', 'crm_companies', 'crm_contacts', 'crm_deals', 'activities')
order by relname;

-- 2. One read policy per table (expect five rows).
select tablename, policyname from pg_policies
where schemaname = 'public'
  and tablename in ('crm_pipeline_stages', 'crm_companies', 'crm_contacts', 'crm_deals', 'activities')
order by tablename;

-- 3. anon has no privileges on them (expect zero rows).
select table_name, privilege_type from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
  and table_name in ('crm_pipeline_stages', 'crm_companies', 'crm_contacts', 'crm_deals', 'activities');
