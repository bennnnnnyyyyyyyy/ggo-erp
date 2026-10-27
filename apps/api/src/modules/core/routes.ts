import { Hono } from 'hono';
import type { SessionInfo } from '@ggo/shared';
import type { AppEnv } from '../../env';
import { db } from '../../lib/db';
import { ok } from '../../lib/response';
import { requirePermission } from '../../middleware/tenant';

export const coreRoutes = new Hono<AppEnv>();

coreRoutes.get('/session', (c) => {
  const { user, tenant } = c.var;
  const session: SessionInfo = {
    userId: user.id,
    email: user.email,
    org: { id: tenant.orgId, name: tenant.orgName, slug: tenant.orgSlug },
    role: tenant.role,
    permissions: tenant.permissions,
    modules: tenant.modules,
  };
  return ok(c, session);
});

coreRoutes.get('/audit', requirePermission('core.audit.read'), async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 50) || 50, 200);
  const { data, error } = await db(c.env)
    .from('audit_log')
    .select('id, occurred_at, actor_user_id, action, entity_type, entity_id, summary')
    .eq('org_id', c.var.tenant.orgId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ok(c, data);
});
