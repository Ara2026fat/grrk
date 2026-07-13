/**
 * Typed environment access. No module should read `import.meta.env`
 * directly — this is the single seam that changes when Cloud Migration
 * (Blueprint Section 13) introduces real backend credentials.
 */
export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? "GRRK",
  defaultLocale: (import.meta.env.VITE_DEFAULT_LOCALE ?? "ar") as "ar" | "en",
  storageDriver: import.meta.env.VITE_STORAGE_DRIVER ?? "indexeddb",
  backendDriver: import.meta.env.VITE_BACKEND_DRIVER ?? "local",
} as const;
