import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Multi-page static build: each address gets its own folder with an index.html.
const { appRoutes } = JSON.parse(readFileSync(resolve(__dirname, "routes.json"), "utf8"));

const input = {
  main: resolve(__dirname, "index.html"),
  login: resolve(__dirname, "login/index.html"),
  config: resolve(__dirname, "config/index.html"),
  designSystem: resolve(__dirname, "design-system/index.html"),
};
for (const r of appRoutes) input[r.replace(/[^a-z]+/gi, "_")] = resolve(__dirname, r, "index.html");

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "src/royal") } },
  base: "/",
  build: { outDir: "dist", rollupOptions: { input } },
});
