import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// GRRK Stage 0 - build configuration.
// Kept deliberately minimal: no business logic belongs here.
export default defineConfig({
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
