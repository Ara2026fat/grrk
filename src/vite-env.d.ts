/// <reference types="vite/client" />

// Augments ImportMetaEnv with the VITE_* variables GRRK actually reads
// (see src/config/env.ts — the only file allowed to read them directly).
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_DEFAULT_LOCALE: string;
  readonly VITE_STORAGE_DRIVER: string;
  readonly VITE_BACKEND_DRIVER: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
