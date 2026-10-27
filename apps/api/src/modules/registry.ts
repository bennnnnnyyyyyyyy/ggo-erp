import type { Hono } from 'hono';
import { findModule } from '@ggo/shared';
import type { AppEnv } from '../env';
import { coreRoutes } from './core/routes';

// Each module's routes, keyed by its manifest key in packages/shared/src/modules.ts.
// Adding a module: create src/modules/<key>/routes.ts, add its manifest, register it here.
export const MODULE_ROUTES: Record<string, Hono<AppEnv>> = {
  core: coreRoutes,
};

for (const key of Object.keys(MODULE_ROUTES)) {
  if (!findModule(key)) throw new Error(`Module routes registered for "${key}" but it has no manifest`);
}
