import { Hono } from 'hono';
import {
  COMPANY_FIELDS,
  CONTACT_FIELDS,
  DEAL_FIELDS,
  STAGE_FIELDS,
  closedAtFor,
  type SearchHit,
  type StageKind,
} from '@ggo/shared';
import type { AppEnv } from '../../env';
import { db } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { resourceRoutes, type ResourceConfig } from '../../lib/resource';
import { ok } from '../../lib/response';
import { requirePermission } from '../../middleware/tenant';

const READ = 'crm.records.read';
const MANAGE = 'crm.records.manage';
const REFS = { companies: 'crm_companies', contacts: 'crm_contacts', stages: 'crm_pipeline_stages' };

async function stageKind(c: Parameters<NonNullable<ResourceConfig['beforeWrite']>>[0], stageId: string): Promise<StageKind> {
  const { data, error } = await db(c.env)
    .from('crm_pipeline_stages')
    .select('kind')
    .eq('org_id', c.var.tenant.orgId)
    .eq('id', stageId)
    .single<{ kind: StageKind }>();
  if (error) throw error;
  return data.kind;
}

export const companies: ResourceConfig = {
  table: 'crm_companies',
  entityType: 'crm_company',
  module: 'crm',
  noun: 'company',
  fields: COMPANY_FIELDS,
  readPermission: READ,
  managePermission: MANAGE,
  deletePermission: 'crm.records.delete',
  refs: REFS,
  filters: { status: 'status', ownerId: 'owner_id' },
  titleOf: (r) => String(r.name),
  defaults: async (c) => ({ status: 'lead', ownerId: c.var.user.id }),
};

export const contacts: ResourceConfig = {
  table: 'crm_contacts',
  entityType: 'crm_contact',
  module: 'crm',
  noun: 'contact',
  fields: CONTACT_FIELDS,
  readPermission: READ,
  managePermission: MANAGE,
  deletePermission: 'crm.records.delete',
  refs: REFS,
  filters: { companyId: 'company_id', ownerId: 'owner_id' },
  titleOf: (r) => [r.first_name, r.last_name].filter(Boolean).join(' '),
  defaults: async (c) => ({ ownerId: c.var.user.id }),
};

export const deals: ResourceConfig = {
  table: 'crm_deals',
  entityType: 'crm_deal',
  module: 'crm',
  noun: 'deal',
  fields: DEAL_FIELDS,
  readPermission: READ,
  managePermission: MANAGE,
  deletePermission: 'crm.records.delete',
  refs: REFS,
  filters: { companyId: 'company_id', contactId: 'contact_id', stageId: 'stage_id', ownerId: 'owner_id' },
  titleOf: (r) => String(r.title),
  defaults: async (c) => {
    // New deals start in the first open stage, in the org's currency, owned by the creator.
    const { data } = await db(c.env)
      .from('crm_pipeline_stages')
      .select('id')
      .eq('org_id', c.var.tenant.orgId)
      .eq('kind', 'open')
      .is('deleted_at', null)
      .order('position')
      .limit(1)
      .maybeSingle<{ id: string }>();
    return { stageId: data?.id, currency: c.var.tenant.defaultCurrency, ownerId: c.var.user.id };
  },
  beforeWrite: async (c, columns, before) => {
    if (typeof columns.stage_id !== 'string' || columns.stage_id === before?.stage_id) return;
    const kind = await stageKind(c, columns.stage_id);
    columns.closed_at = closedAtFor(kind, (before?.closed_at as string | null) ?? null, new Date());
  },
};

export const stages: ResourceConfig = {
  table: 'crm_pipeline_stages',
  entityType: 'crm_stage',
  module: 'crm',
  noun: 'stage',
  fields: STAGE_FIELDS,
  readPermission: READ,
  managePermission: 'crm.settings.manage',
  orderBy: { column: 'position', ascending: true },
  titleOf: (r) => String(r.name),
};

export const crmRoutes = new Hono<AppEnv>();

crmRoutes.route('/companies', resourceRoutes(companies));
crmRoutes.route('/contacts', resourceRoutes(contacts));
crmRoutes.route('/deals', resourceRoutes(deals));

// A stage that still holds deals can't be deleted; move the deals first.
crmRoutes.delete('/stages/:id', requirePermission('crm.settings.manage'), async (c, next) => {
  const { count, error } = await db(c.env)
    .from('crm_deals')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', c.var.tenant.orgId)
    .eq('stage_id', c.req.param('id'))
    .is('deleted_at', null);
  if (error) throw error;
  if (count) throw new HttpError(409, `This stage still has ${count} deal(s). Move them to another stage first.`, 'stage_in_use');
  await next();
});
crmRoutes.route('/stages', resourceRoutes(stages));

/** Strips characters that have meaning in PostgREST filters, then wraps for ILIKE. */
function likePattern(q: string): string {
  return `%${q.replace(/[%_,()\\*]/g, ' ').trim()}%`;
}

crmRoutes.get('/search', requirePermission(READ), async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (q.length < 2) return ok(c, [] as SearchHit[]);
  const p = likePattern(q);
  const client = db(c.env);
  const orgId = c.var.tenant.orgId;
  const [co, ct, dl] = await Promise.all([
    client.from('crm_companies').select('id, name, status').eq('org_id', orgId).is('deleted_at', null).ilike('name', p).limit(8),
    client
      .from('crm_contacts')
      .select('id, first_name, last_name, email, job_title')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .or(`first_name.ilike.${p},last_name.ilike.${p},email.ilike.${p}`)
      .limit(8),
    client.from('crm_deals').select('id, title').eq('org_id', orgId).is('deleted_at', null).ilike('title', p).limit(8),
  ]);
  for (const r of [co, ct, dl]) if (r.error) throw r.error;
  const hits: SearchHit[] = [
    ...(co.data ?? []).map((r) => ({ type: 'company' as const, id: r.id as string, title: r.name as string, subtitle: r.status as string })),
    ...(ct.data ?? []).map((r) => ({
      type: 'contact' as const,
      id: r.id as string,
      title: [r.first_name, r.last_name].filter(Boolean).join(' '),
      subtitle: (r.job_title as string | null) ?? (r.email as string | null),
    })),
    ...(dl.data ?? []).map((r) => ({ type: 'deal' as const, id: r.id as string, title: r.title as string, subtitle: null })),
  ];
  return ok(c, hits);
});
