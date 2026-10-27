import type { ComponentType } from 'react';
import { CoreHome } from './core/CoreHome';

// Screens each module contributes to the sidebar. The sidebar shows only modules the
// organization has enabled (from /v1/core/session) and pages whose permission the user holds.
export type ModulePage = {
  path: string;
  label: string;
  permission?: string;
  component: ComponentType;
};

export const MODULE_PAGES: Record<string, ModulePage[]> = {
  core: [{ path: '/', label: 'Home', component: CoreHome }],
};
