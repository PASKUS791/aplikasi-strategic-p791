/*
 * Team DUKUN PASKUS 791
 * Jevier - Frontend
 * Teddy - Backend
 * Lee - Cyber Sector
 * Osiris - Bot Manufactur
 * Internal proprietary source notice.
 */

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const publicBasePath = process.env.VITE_PUBLIC_BASE_PATH || "/";

export default defineConfig({
  root: projectRoot,
  base: publicBasePath,
  publicDir: resolve(projectRoot, "public"),
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    fs: {
      allow: [projectRoot],
    },
    proxy: {
      "/api": {
        target: "http://localhost:4455",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: resolve(projectRoot, "dist-strategic"),
    emptyOutDir: true,
  },
});
