import { createClient } from '@supabase/supabase-js';

// The browser uses Supabase only for sign-in and the organization picker. All other data goes
// through the API, which enforces tenancy and permissions. Values come from the root .env
// (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) via apps/web/vite.config.ts.
export const supabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'missing-publishable-key',
);
