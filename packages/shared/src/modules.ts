// A module is a sellable unit of functionality. The API and the web app both read this
// registry, and `org_modules` decides which ones each organization has switched on.

export type ModuleManifest = {
  key: string;
  name: string;
  description: string;
  /** Core modules are always on and cannot be disabled per organization. */
  core: boolean;
  /** Other modules that must be enabled first. */
  dependsOn: string[];
  /** Permission keys this module defines, as `<module>.<action>`. */
  permissions: string[];
};

export const MODULES: readonly ModuleManifest[] = [
  {
    key: 'core',
    name: 'Core',
    description: 'Organization, users, roles, settings and the audit log.',
    core: true,
    dependsOn: [],
    permissions: ['core.org.manage', 'core.users.read', 'core.users.manage', 'core.audit.read'],
  },
];

export function findModule(key: string): ModuleManifest | undefined {
  return MODULES.find((m) => m.key === key);
}

export function allPermissionKeys(): string[] {
  return MODULES.flatMap((m) => m.permissions);
}
