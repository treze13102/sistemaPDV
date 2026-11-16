// Renders every logged-in route once on the server to catch runtime errors. Exits when done.
import { createServer } from "vite";
import { readFileSync } from "node:fs";

const { appRoutes } = JSON.parse(readFileSync(new URL("../routes.json", import.meta.url), "utf8"));
const mem = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
globalThis.localStorage = mem();
globalThis.sessionStorage = mem();
globalThis.document = { documentElement: { style: { setProperty() {} }, lang: "" }, title: "", addEventListener() {}, removeEventListener() {} };

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
let failed = 0;
try {
  const React = (await import("react")).default;
  const { renderToString } = await import("react-dom/server");
  for (const r of [...appRoutes, "products/create?id=p1", "customers/create?id=c1"]) {
    const [path, search = ""] = r.split("?");
    globalThis.window = { location: { pathname: `/${path}/`, search: search ? `?${search}` : "" }, addEventListener() {}, removeEventListener() {}, history: { pushState() {} }, scrollTo() {} };
    try {
      const { default: App } = await server.ssrLoadModule("/src/app/App.jsx");
      const html = renderToString(React.createElement(App));
      console.log(`ok   /${r}  (${html.length} chars)`);
    } catch (e) {
      failed++;
      console.log(`FAIL /${r}: ${e.message}`);
    }
  }
  for (const p of ["/src/login/Login.jsx", "/src/design/DesignSystem.jsx"]) {
    try {
      const { default: C } = await server.ssrLoadModule(p);
      renderToString(React.createElement(C));
      console.log(`ok   ${p}`);
    } catch (e) {
      failed++;
      console.log(`FAIL ${p}: ${e.message}`);
    }
  }
} finally {
  await server.close();
}
process.exit(failed ? 1 : 0);
