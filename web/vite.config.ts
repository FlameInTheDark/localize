import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Vite config for the Localize translation frontend.
//
// Produces a fully static bundle in ./dist (no Node server, no `_next` folder)
// that can be embedded directly into a Go binary via `embed.FS`.
//
//   make build-origin   → VITE_API_BASE_URL is empty   (same-origin API)
//   make build-custom   → VITE_API_BASE_URL=<api base> (dev/separate)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Only scan index.html for dependency optimization — prevents Vite from
  // trying to resolve imports inside stray HTML files (e.g. skills/examples).
  optimizeDeps: {
    entries: ["index.html"],
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
