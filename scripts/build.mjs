import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Keep the multi-page build explicit so it also works in restricted shells
// where Vite cannot bundle and load vite.config.js before starting a build.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { appRoutes } = JSON.parse(readFileSync(resolve(root, "routes.json"), "utf8"));
const input = {
  main: resolve(root, "index.html"),
  login: resolve(root, "login/index.html"),
  config: resolve(root, "config/index.html"),
  designSystem: resolve(root, "design-system/index.html"),
};

for (const route of appRoutes) {
  input[route.replace(/[^a-z]+/gi, "_")] = resolve(root, route, "index.html");
}

await build({
  configFile: false,
  plugins: [react()],
  resolve: { alias: { "@": resolve(root, "src/royal") } },
  base: "/",
  build: { outDir: "dist", rollupOptions: { input } },
});
