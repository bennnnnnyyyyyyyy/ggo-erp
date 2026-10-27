import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  // One .env at the repo root serves both apps. Only the two public values are handed to the
  // browser; SUPABASE_SECRET_KEY never leaves the API.
  const env = loadEnv(mode, repoRoot, '');
  return {
    envDir: repoRoot,
    plugins: [react()],
    server: { port: 5173 },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL ?? ''),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(env.SUPABASE_PUBLISHABLE_KEY ?? ''),
    },
  };
});
