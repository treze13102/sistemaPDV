// Writes one index.html per logged-in route so the static build has a real page at every address.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { appRoutes } = JSON.parse(readFileSync(join(root, "routes.json"), "utf8"));

const html = (title) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <title>${title} · Mont Royal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.jsx"></script>
  </body>
</html>
`;

for (const r of appRoutes) {
  const dir = join(root, r);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html(r.split("/")[0]));
}
console.log(`wrote ${appRoutes.length} pages`);
