import type { Role } from '@ggo/shared';

export type Bindings = {
  APP_ENV: string;
  ALLOWED_ORIGINS: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export type AuthUser = { id: string; email: string };

export type Tenant = {
  orgId: string;
  orgName: string;
  orgSlug: string;
  role: Role;
  permissions: string[];
  modules: string[];
};

export type Variables = {
  user: AuthUser;
  tenant: Tenant;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
