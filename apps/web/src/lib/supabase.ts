import { createClient } from '@supabase/supabase-js';

// The browser uses Supabase only for sign-in. All data goes through the API, which
// enforces tenancy and permissions.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost:54321',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'missing-anon-key',
);
