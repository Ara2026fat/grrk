import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// GRRK Stage 0 - build configuration.
// Kept deliberately minimal: no business logic belongs here.
//
// base: "./" (GitHub Pages deployment) — makes every built asset URL
// relative instead of absolute-from-root, so the same build works whether
// it's served from the site root or from a project subpath
// (username.github.io/repo-name/) without needing to know the repo name
// ahead of time or hardcode it here.
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
