import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Bindings } from '../env';
import { NotConfiguredError } from './errors';

// The Worker is the trusted server side: it uses the service-role key, which bypasses RLS.
// That makes tenant scoping the Worker's job — every query must filter by the caller's org_id.
// RLS stays on as the second line of defence for any direct client access.
export function db(env: Bindings): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new NotConfiguredError('Supabase');
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
