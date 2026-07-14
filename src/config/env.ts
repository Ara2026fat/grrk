/**
 * Typed environment access. No module should read `import.meta.env`
 * directly — this is the single seam that changes when Cloud Migration
 * (Blueprint Section 13) introduces real backend credentials.
 *
 * Supabase migration: exactly two values are required —
 * VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY — read here and
 * nowhere else. Put them in .env.local at the project root (copy
 * .env.example if that file doesn't exist yet).
 */
export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? "GRRK",
  defaultLocale: (import.meta.env.VITE_DEFAULT_LOCALE ?? "ar") as "ar" | "en",
  backendDriver: import.meta.env.VITE_BACKEND_DRIVER ?? "supabase",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
} as const;
