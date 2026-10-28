import type { ComponentType } from 'react';
import { hasPermission, type SessionInfo } from '@ggo/shared';
import { GeneralSettings } from './core/settings/GeneralSettings';
import { UsersSettings } from './core/settings/UsersSettings';
import { AuditLog } from './core/settings/AuditLog';

// Apps shown as tiles on the home screen. Each belongs to a module (packages/shared/src/modules.ts);
// an app appears only when its module is enabled for the org and the user can open at least one page.

export type AppPage = {
  /** Relative to the app's basePath; '' is the app's first page. */
  path: string;
  label: string;
  permission?: string;
  component: ComponentType;
};

export type AppDef = {
  key: string;
  module: string;
  name: string;
  description: string;
  /** Home-screen grouping (MVP_PLAN section 4.1). */
  suite: 'Core' | 'Sales & Clients' | 'People' | 'Work' | 'Finance' | 'Operations';
  basePath: string;
  pages: AppPage[];
};

export const APPS: AppDef[] = [
  {
    key: 'settings',
    module: 'core',
    name: 'Settings',
    description: 'Organization, users and audit log',
    suite: 'Core',
    basePath: '/settings',
    pages: [
      { path: '', label: 'General', permission: 'core.org.read', component: GeneralSettings },
      { path: '/users', label: 'Users', permission: 'core.users.read', component: UsersSettings },
      { path: '/audit', label: 'Audit log', permission: 'core.audit.read', component: AuditLog },
    ],
  },
];

export const SUITE_ORDER: AppDef['suite'][] = ['Core', 'Sales & Clients', 'People', 'Work', 'Finance', 'Operations'];

/** Apps this user can open, each with only the pages they are allowed to see. */
export function visibleApps(session: SessionInfo): AppDef[] {
  return APPS.filter((a) => session.modules.includes(a.module))
    .map((a) => ({ ...a, pages: a.pages.filter((p) => !p.permission || hasPermission(session.permissions, p.permission)) }))
    .filter((a) => a.pages.length > 0);
}

export function resolveRoute(path: string, apps: AppDef[]): { app: AppDef; page: AppPage | null } | null {
  const clean = path.replace(/\/+$/, '') || '/';
  const app = apps.find((a) => clean === a.basePath || clean.startsWith(`${a.basePath}/`));
  if (!app) return null;
  const rest = clean.slice(app.basePath.length);
  return { app, page: app.pages.find((p) => p.path === rest) ?? null };
}
