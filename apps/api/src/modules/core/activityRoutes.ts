import { Hono, type Context } from 'hono';
import {
  ACTIVITY_KINDS,
  hasPermission,
  type Activity,
  type ActivityKind,
  type AuditEntry,
  type MyTask,
  type TimelineItem,
} from '@ggo/shared';
import type { AppEnv } from '../../env';
import { writeAudit } from '../../lib/audit';
import { invalid, jsonBody } from '../../lib/body';
import { db } from '../../lib/db';
import { HttpError } from '../../lib/errors';
import { ENTITIES, loadRow, type ResourceConfig } from '../../lib/resource';
import { ok } from '../../lib/response';

// Activities (notes, calls, meetings, tasks) and the timeline for any record declared with
// resourceRoutes. Access follows the record: reading needs the record's read permission,
// writing needs its manage permission, and the record's module must be enabled.

type Ctx = Context<AppEnv>;

type ActivityRow = {
  id: string;
  entity_type: string;
  entity_id: string;
  kind: ActivityKind;
  subject: string | null;
  body: string | null;
  due_at: string | null;
  done_at: string | null;
  assignee_id: string | null;
  created_by: string | null;
  created_at: string;
};

const COLUMNS = 'id, entity_type, entity_id, kind, subject, body, due_at, done_at, assignee_id, created_by, created_at';

function toActivity(r: ActivityRow): Activity {
  return {
    id: r.id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    kind: r.kind,
    subject: r.subject,
    body: r.body,
    dueAt: r.due_at,
    doneAt: r.done_at,
    assigneeId: r.assignee_id,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function entityFor(c: Ctx, entityType: string, access: 'read' | 'manage'): ResourceConfig {
  const cfg = ENTITIES.get(entityType);
  if (!cfg || !c.var.tenant.modules.includes(cfg.module)) throw new HttpError(404, 'Unknown record type', 'not_found');
  const perm = access === 'read' ? cfg.readPermission : cfg.managePermission;
  if (!hasPermission(c.var.tenant.permissions, perm)) throw new HttpError(403, "You don't have permission to do that", 'forbidden');
  return cfg;
}

/** Resolves and checks the record named by entityType + entityId. */
async function requireEntity(c: Ctx, entityType: unknown, entityId: unknown, access: 'read' | 'manage') {
  if (typeof entityType !== 'string' || typeof entityId !== 'string') invalid('entityType and entityId are required');
  const cfg = entityFor(c, entityType, access);
  const row = await loadRow(c, cfg, entityId);
  return { cfg, row };
}

function parseDue(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v !== 'string' || Number.isNaN(Date.parse(v))) invalid('Due date must be a date and time');
  return new Date(v).toISOString();
}

function parseText(v: unknown, label: string, max: number): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') invalid(`${label} must be text`);
  const t = v.trim();
  if (t.length > max) invalid(`${label} must be at most ${max} characters`);
  return t || null;
}

async function checkAssignee(c: Ctx, userId: unknown): Promise<string | null> {
  if (userId === null || userId === undefined || userId === '') return null;
  const { data, error } = await db(c.env)
    .from('memberships')
    .select('id')
    .eq('org_id', c.var.tenant.orgId)
    .eq('user_id', userId)
    .is('disabled_at', null)
    .maybeSingle();
  if (error) throw error;
  if (!data) invalid('Assignee must be an active member');
  return userId as string;
}

async function loadActivity(c: Ctx, id: string): Promise<ActivityRow> {
  const { data, error } = await db(c.env)
    .from('activities')
    .select(COLUMNS)
    .eq('org_id', c.var.tenant.orgId)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle<ActivityRow>();
  if (error) throw error;
  if (!data) throw new HttpError(404, "That activity doesn't exist", 'not_found');
  return data;
}

export const activityRoutes = new Hono<AppEnv>();

activityRoutes.get('/mine', async (c) => {
  const { data, error } = await db(c.env)
    .from('activities')
    .select(COLUMNS)
    .eq('org_id', c.var.tenant.orgId)
    .eq('assignee_id', c.var.user.id)
    .eq('kind', 'task')
    .is('done_at', null)
    .is('deleted_at', null)
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(100);
  if (error) throw error;

  // Only tasks on records the user may still read, with the record's title.
  const rows = (data ?? []) as ActivityRow[];
  const titles = new Map<string, string>();
  const byType = new Map<string, string[]>();
  for (const r of rows) byType.set(r.entity_type, [...(byType.get(r.entity_type) ?? []), r.entity_id]);
  for (const [type, ids] of byType) {
    const cfg = ENTITIES.get(type);
    if (!cfg || !c.var.tenant.modules.includes(cfg.module) || !hasPermission(c.var.tenant.permissions, cfg.readPermission)) continue;
    const { data: recs, error: recErr } = await db(c.env)
      .from(cfg.table)
      .select('*')
      .eq('org_id', c.var.tenant.orgId)
      .in('id', ids)
      .is('deleted_at', null);
    if (recErr) throw recErr;
    for (const rec of recs ?? []) titles.set(`${type}:${rec.id}`, cfg.titleOf(rec as never));
  }
  const tasks: MyTask[] = rows
    .filter((r) => titles.has(`${r.entity_type}:${r.entity_id}`))
    .map((r) => ({ ...toActivity(r), entityTitle: titles.get(`${r.entity_type}:${r.entity_id}`) ?? null }));
  return ok(c, tasks);
});

activityRoutes.get('/', async (c) => {
  const { row } = await requireEntity(c, c.req.query('entityType'), c.req.query('entityId'), 'read');
  const { data, error } = await db(c.env)
    .from('activities')
    .select(COLUMNS)
    .eq('org_id', c.var.tenant.orgId)
    .eq('entity_type', c.req.query('entityType'))
    .eq('entity_id', row.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ok(c, ((data ?? []) as ActivityRow[]).map(toActivity));
});

activityRoutes.post('/', async (c) => {
  const body = await jsonBody(c);
  const { cfg, row } = await requireEntity(c, body.entityType, body.entityId, 'manage');
  const kind = body.kind as ActivityKind;
  if (!ACTIVITY_KINDS.includes(kind)) invalid(`Kind must be one of ${ACTIVITY_KINDS.join(', ')}`);
  const subject = parseText(body.subject, 'Subject', 200);
  const text = parseText(body.body, 'Details', 10000);
  if (!subject && !text) invalid('Write something first');
  const insert = {
    org_id: c.var.tenant.orgId,
    entity_type: cfg.entityType,
    entity_id: row.id,
    kind,
    subject,
    body: text,
    due_at: kind === 'task' ? parseDue(body.dueAt) : null,
    // Tasks default to the person creating them.
    assignee_id: kind === 'task' ? ((await checkAssignee(c, body.assigneeId)) ?? c.var.user.id) : null,
    created_by: c.var.user.id,
  };
  const { data, error } = await db(c.env).from('activities').insert(insert).select(COLUMNS).single<ActivityRow>();
  if (error) throw error;
  await writeAudit(c, {
    action: 'activity.created',
    entityType: 'activity',
    entityId: data.id,
    summary: `${kind} on ${cfg.noun} ${cfg.titleOf(row)}`,
  });
  return ok(c, toActivity(data), 201);
});

activityRoutes.patch('/:id', async (c) => {
  const current = await loadActivity(c, c.req.param('id'));
  entityFor(c, current.entity_type, 'manage');
  const body = await jsonBody(c);
  const update: Record<string, unknown> = {};
  if ('subject' in body) update.subject = parseText(body.subject, 'Subject', 200);
  if ('body' in body) update.body = parseText(body.body, 'Details', 10000);
  if (current.kind === 'task') {
    if ('dueAt' in body) update.due_at = parseDue(body.dueAt);
    if ('assigneeId' in body) update.assignee_id = await checkAssignee(c, body.assigneeId);
    if ('done' in body) update.done_at = body.done ? (current.done_at ?? new Date().toISOString()) : null;
  }
  if (Object.keys(update).length === 0) return ok(c, toActivity(current));
  const { data, error } = await db(c.env)
    .from('activities')
    .update(update)
    .eq('org_id', c.var.tenant.orgId)
    .eq('id', current.id)
    .select(COLUMNS)
    .single<ActivityRow>();
  if (error) throw error;
  await writeAudit(c, {
    action: 'done' in body && Object.keys(update).length === 1 ? (body.done ? 'activity.completed' : 'activity.reopened') : 'activity.updated',
    entityType: 'activity',
    entityId: current.id,
    summary: `${current.kind} ${current.subject ?? ''}`.trim(),
  });
  return ok(c, toActivity(data));
});

activityRoutes.delete('/:id', async (c) => {
  const current = await loadActivity(c, c.req.param('id'));
  entityFor(c, current.entity_type, 'manage');
  const { error } = await db(c.env)
    .from('activities')
    .update({ deleted_at: new Date().toISOString() })
    .eq('org_id', c.var.tenant.orgId)
    .eq('id', current.id);
  if (error) throw error;
  await writeAudit(c, {
    action: 'activity.deleted',
    entityType: 'activity',
    entityId: current.id,
    summary: `Deleted ${current.kind} ${current.subject ?? ''}`.trim(),
  });
  return ok(c, { id: current.id });
});

export const timelineRoutes = new Hono<AppEnv>();

timelineRoutes.get('/', async (c) => {
  const entityType = c.req.query('entityType');
  const { row } = await requireEntity(c, entityType, c.req.query('entityId'), 'read');
  const client = db(c.env);
  const orgId = c.var.tenant.orgId;
  const [acts, audit] = await Promise.all([
    client
      .from('activities')
      .select(COLUMNS)
      .eq('org_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', row.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200),
    client
      .from('audit_log')
      .select('id, occurred_at, actor_user_id, action, entity_type, entity_id, summary, before, after')
      .eq('org_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', row.id)
      .order('occurred_at', { ascending: false })
      .limit(200),
  ]);
  if (acts.error) throw acts.error;
  if (audit.error) throw audit.error;
  const items: TimelineItem[] = [
    ...((acts.data ?? []) as ActivityRow[]).map((a) => ({ type: 'activity' as const, at: a.created_at, activity: toActivity(a) })),
    ...((audit.data ?? []) as (AuditEntry & { before: unknown; after: unknown })[]).map((e) => ({
      type: 'change' as const,
      at: e.occurred_at,
      change: e,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return ok(c, items);
});
