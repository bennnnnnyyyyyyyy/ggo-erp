import { Hono, type Context } from 'hono';
import { validateRecord, type FieldDef, type RecordValues } from '@ggo/shared';
import type { AppEnv } from '../env';
import { requirePermission } from '../middleware/tenant';
import { writeAudit } from './audit';
import { jsonBody } from './body';
import { db } from './db';
import { HttpError } from './errors';
import { ok } from './response';

// Org-scoped CRUD for a business table, driven by shared field definitions. Every query filters
// by the caller's org_id; deletes are soft; every write is audited. Modules declare a resource
// and mount the returned routes.

type Ctx = Context<AppEnv>;
export type Row = Record<string, unknown> & { id: string };

export type ResourceConfig = {
  /** Database table, e.g. `crm_companies`. */
  table: string;
  /** Audit and activity entity type, e.g. `crm_company`. */
  entityType: string;
  /** Module the resource belongs to; its routes and activities need it enabled. */
  module: string;
  /** Singular noun for messages, e.g. `company`. */
  noun: string;
  fields: readonly FieldDef[];
  readPermission: string;
  managePermission: string;
  /** `ref` field targets: resource name → table, same module. */
  refs?: Record<string, string>;
  /** Query parameters that filter the list: param → column. */
  filters?: Record<string, string>;
  orderBy?: { column: string; ascending: boolean };
  /** Human title of a row, for audit summaries, search and "My tasks". */
  titleOf: (row: Row) => string;
  /** Fills in missing values on create, before validation (API keys). */
  defaults?: (c: Ctx) => Promise<RecordValues>;
  /** Adjusts database columns before insert/update; `before` is set on update. */
  beforeWrite?: (c: Ctx, columns: Record<string, unknown>, before: Row | null) => Promise<void>;
};

/** Every declared resource, by entity type. Activities and the timeline look entities up here. */
export const ENTITIES = new Map<string, ResourceConfig>();

function toApi(cfg: ResourceConfig, row: Row): RecordValues {
  const out: RecordValues = {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? null,
  };
  for (const f of cfg.fields) out[f.key] = row[f.column] ?? (f.type === 'tags' ? [] : null);
  return out;
}

function toColumns(cfg: ResourceConfig, values: RecordValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of cfg.fields) if (f.key in values) out[f.column] = values[f.key];
  return out;
}

function failValidation(errors: Record<string, string>): never {
  throw new HttpError(400, Object.values(errors).join('. '), 'invalid_input');
}

/** Checks that `ref` and `user` values point at live rows / active members of this org. */
async function checkReferences(c: Ctx, cfg: ResourceConfig, values: RecordValues) {
  const client = db(c.env);
  const orgId = c.var.tenant.orgId;
  for (const f of cfg.fields) {
    const v = values[f.key];
    if (v === null || v === undefined) continue;
    if (f.type === 'ref') {
      const table = f.ref && cfg.refs?.[f.ref];
      if (!table) throw new Error(`No table for ref ${f.ref} on ${cfg.table}`);
      const { data, error } = await client.from(table).select('id').eq('org_id', orgId).eq('id', v).is('deleted_at', null).maybeSingle();
      if (error) throw error;
      if (!data) failValidation({ [f.key]: `${f.label} not found` });
    } else if (f.type === 'user') {
      const { data, error } = await client
        .from('memberships')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', v)
        .is('disabled_at', null)
        .maybeSingle();
      if (error) throw error;
      if (!data) failValidation({ [f.key]: `${f.label} must be an active member` });
    }
  }
}

export async function loadRow(c: Ctx, cfg: ResourceConfig, id: string): Promise<Row> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, `That ${cfg.noun} doesn't exist`, 'not_found');
  const { data, error } = await db(c.env)
    .from(cfg.table)
    .select('*')
    .eq('org_id', c.var.tenant.orgId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle<Row>();
  if (error) throw error;
  if (!data) throw new HttpError(404, `That ${cfg.noun} doesn't exist`, 'not_found');
  return data;
}

/** Keys whose values differ, for audit before/after. */
function diff(before: RecordValues, after: RecordValues): { before: RecordValues; after: RecordValues } {
  const b: RecordValues = {};
  const a: RecordValues = {};
  for (const k of Object.keys(after)) {
    if (k === 'updatedAt') continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) {
      b[k] = before[k];
      a[k] = after[k];
    }
  }
  return { before: b, after: a };
}

export function resourceRoutes(cfg: ResourceConfig): Hono<AppEnv> {
  ENTITIES.set(cfg.entityType, cfg);
  const r = new Hono<AppEnv>();
  const order = cfg.orderBy ?? { column: 'created_at', ascending: false };

  r.get('/', requirePermission(cfg.readPermission), async (c) => {
    let q = db(c.env).from(cfg.table).select('*').eq('org_id', c.var.tenant.orgId).is('deleted_at', null);
    for (const [param, column] of Object.entries(cfg.filters ?? {})) {
      const v = c.req.query(param);
      if (v) q = q.eq(column, v);
    }
    // Lists are filtered and sorted in the browser for now; capped to keep responses small.
    const { data, error } = await q.order(order.column, { ascending: order.ascending }).limit(2000);
    if (error) throw error;
    return ok(c, ((data ?? []) as Row[]).map((row) => toApi(cfg, row)));
  });

  r.get('/:id', requirePermission(cfg.readPermission), async (c) => ok(c, toApi(cfg, await loadRow(c, cfg, c.req.param('id')))));

  r.post('/', requirePermission(cfg.managePermission), async (c) => {
    const body = { ...((await cfg.defaults?.(c)) ?? {}), ...(await jsonBody(c)) };
    const { values, errors } = validateRecord(cfg.fields, body);
    if (Object.keys(errors).length) failValidation(errors);
    await checkReferences(c, cfg, values);
    const columns = toColumns(cfg, values);
    await cfg.beforeWrite?.(c, columns, null);

    const { data, error } = await db(c.env)
      .from(cfg.table)
      .insert({ ...columns, org_id: c.var.tenant.orgId, created_by: c.var.user.id })
      .select('*')
      .single<Row>();
    if (error) throw error;
    const record = toApi(cfg, data);
    await writeAudit(c, {
      action: `${cfg.entityType}.created`,
      entityType: cfg.entityType,
      entityId: data.id,
      summary: `Created ${cfg.noun} ${cfg.titleOf(data)}`,
      after: record,
    });
    return ok(c, record, 201);
  });

  r.patch('/:id', requirePermission(cfg.managePermission), async (c) => {
    const before = await loadRow(c, cfg, c.req.param('id'));
    const { values, errors } = validateRecord(cfg.fields, await jsonBody(c), true);
    if (Object.keys(errors).length) failValidation(errors);
    await checkReferences(c, cfg, values);
    const columns = toColumns(cfg, values);
    await cfg.beforeWrite?.(c, columns, before);
    if (Object.keys(columns).length === 0) return ok(c, toApi(cfg, before));

    const { data, error } = await db(c.env)
      .from(cfg.table)
      .update(columns)
      .eq('org_id', c.var.tenant.orgId)
      .eq('id', before.id)
      .select('*')
      .single<Row>();
    if (error) throw error;
    const record = toApi(cfg, data);
    const changes = diff(toApi(cfg, before), record);
    if (Object.keys(changes.after).length) {
      await writeAudit(c, {
        action: `${cfg.entityType}.updated`,
        entityType: cfg.entityType,
        entityId: data.id,
        summary: `Updated ${cfg.noun} ${cfg.titleOf(data)}: ${Object.keys(changes.after).join(', ')}`,
        ...changes,
      });
    }
    return ok(c, record);
  });

  r.delete('/:id', requirePermission(cfg.managePermission), async (c) => {
    const before = await loadRow(c, cfg, c.req.param('id'));
    const { error } = await db(c.env)
      .from(cfg.table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('org_id', c.var.tenant.orgId)
      .eq('id', before.id);
    if (error) throw error;
    await writeAudit(c, {
      action: `${cfg.entityType}.deleted`,
      entityType: cfg.entityType,
      entityId: before.id,
      summary: `Deleted ${cfg.noun} ${cfg.titleOf(before)}`,
      before: toApi(cfg, before),
    });
    return ok(c, { id: before.id });
  });

  return r;
}
