// Component browser contract with synthetic data and mocked Server Actions.
// No Supabase environment, login, production reads or writes are used here.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { build } from "esbuild";
import puppeteer from "puppeteer-core";

const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), "fivesaint-workflow-ui-"),
);
const output = process.env.WORKFLOW_BROWSER_OUTPUT;
if (output) fs.mkdirSync(output, { recursive: true });
const router = `export function useRouter(){return {push:url=>{window.__navigation=url},refresh:()=>{window.__refreshed=true}}}`;
const actions = `export async function emitOrderFromWorkspace(input){window.__calls.push(input);await new Promise(r=>setTimeout(r,100));return {manufacturingOrderId:'synthetic-of'}}
export async function decideOrderRequest(id,decision,reason){window.__decisions.push({id,decision,reason});return {order_id:'synthetic-order'}}
export async function cancelOrder(){} export async function updateOrderStatus(){}`;
await build({
  stdin: {
    contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {OrderWorkspace} from './src/components/administracion/OrderWorkspace';window.__calls=[];window.__decisions=[];createRoot(document.getElementById('app')).render(React.createElement(OrderWorkspace,{data:window.__data}));`,
    resolveDir: process.cwd(),
    loader: "tsx",
  },
  bundle: true,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  outfile: path.join(temporary, "app.js"),
  plugins: [
    {
      name: "isolated-actions",
      setup(b) {
        b.onResolve({ filter: /^next\/navigation$/ }, () => ({
          path: "router",
          namespace: "mock",
        }));
        b.onResolve({ filter: /^next\/link$/ }, () => ({
          path: "link",
          namespace: "mock",
        }));
        b.onResolve({ filter: /^@\/lib\/supabase\// }, () => ({
          path: "actions",
          namespace: "mock",
        }));
        b.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
          contents:
            args.path === "router"
              ? router
              : args.path === "link"
                ? `import React from 'react';export default function Link(props){return React.createElement('a',props,props.children)}`
                : actions,
          loader: "js",
          resolveDir: process.cwd(),
        }));
        b.onResolve({ filter: /^@\// }, (args) => ({
          path: path.resolve("src", args.path.slice(2) + ".ts"),
        }));
      },
    },
  ],
});
const cssFiles = [];
const cssRoot = ".next/static";
function findCss(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findCss(p);
    else if (p.endsWith(".css")) cssFiles.push(p);
  }
}
findCss(cssRoot);
const css = cssFiles.map((p) => fs.readFileSync(p, "utf8")).join("\n");
const data = {
  orderId: "11111111-1111-4111-8111-111111111111",
  orderNumber: 32,
  budgetNumber: 205,
  clientName: "Cliente de prueba",
  sellerName: "Vendedor de prueba",
  status: "processing",
  approval: "approved",
  total: 1263000,
  notes: null,
  lines: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      product_name: "Bañera Lady Plus",
      variant_name: null,
      quantity: 1,
      product_id: null,
      variant_id: null,
      configuration: {},
      factory_notes: null,
    },
  ],
  documents: [],
  products: [{ id: "33333333-3333-4333-8333-333333333333", name: "Lady Plus" }],
  variants: [],
  recipes: [],
  options: [],
};
let scenario = data;
const server = http.createServer((req, res) => {
  res.setHeader(
    "content-type",
    req.url === "/app.js" ? "text/javascript" : "text/html; charset=utf-8",
  );
  res.end(
    req.url === "/app.js"
      ? fs.readFileSync(path.join(temporary, "app.js"))
      : `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body class="bg-stone-50 p-4"><div id="app"></div><script>window.__data=${JSON.stringify(scenario).replaceAll("<", "\\u003c")}</script><script src="/app.js"></script></body></html>`,
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_PATH ||
    "C:/Users/yoelz/.cache/puppeteer/chrome/win64-154.0.8037.57/chrome-win64/chrome.exe",
  headless: true,
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base);
  await page.waitForSelector("h1");
  assert.ok(
    await page.$eval("header", (e) =>
      e.innerText.includes("Aceptado · en preparación"),
    ),
  );
  await page.select(
    'select[aria-label^="Producto técnico"]',
    data.products[0].id,
  );
  assert.ok(
    await page.$eval("form", (e) =>
      e.innerText.includes("Falta definir cómo se fabrica"),
    ),
  );
  assert.equal(
    await page.$eval('button[type="submit"]', (b) => b.disabled),
    true,
  );
  assert.equal(await page.evaluate(() => window.__calls.length), 0);
  if (output)
    await page.screenshot({
      path: path.join(output, "pedido-sin-receta.png"),
      fullPage: true,
    });
  console.log(
    "PASS: accepted order is not reapproved; missing recipe is visible and emission is disabled.",
  );
  const recipe = {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Receta Lady Plus",
    product_id: data.products[0].id,
    variant_id: null,
    version: 1,
  };
  scenario = {
    ...data,
    recipes: [{...recipe, status:"draft", name:"FSLP1 — LADYPLUS 4J", technical_notes:"Pendiente de revisar la descripción"}],
    lines: [{...data.lines[0], product_id:data.products[0].id}],
  };
  await page.reload();
  await page.waitForSelector('details summary');
  await page.click('details summary');
  const imported = await page.$eval('a[href*="recipe="]', e=>({text:e.textContent,href:e.getAttribute('href')}));
  assert.ok(imported.text.includes('FSLP1'));
  assert.ok(imported.href.includes('recipe='+recipe.id));
  assert.equal(await page.$eval('button[type="submit"]',b=>b.disabled),true);
  assert.equal(await page.evaluate(()=>window.__calls.length),0);
  console.log('PASS: imported draft is visible by source code with a review link and cannot issue an OF.');
  scenario = {
    ...data,
    recipes: [recipe],
    lines: [{ ...data.lines[0], product_id: data.products[0].id }],
  };
  await page.reload();
  await page.waitForSelector('button[type="submit"]');
  await page.click('input[type="checkbox"]');
  assert.equal(
    await page.$eval('button[type="submit"]', (b) => b.disabled),
    false,
  );
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.__navigation);
  assert.equal(
    await page.evaluate(() => window.__navigation),
    "/administracion/fabricacion/synthetic-of",
  );
  const calls = await page.evaluate(() => window.__calls);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].orderId, data.orderId);
  assert.equal(calls[0].requestId, undefined);
  assert.equal(calls[0].lines[0].bomId, recipe.id);
  console.log(
    "PASS: one confirmation emits from the accepted order and opens the printable OF directly.",
  );
  scenario = {
    ...scenario,
    orderId: undefined,
    requestId: "55555555-5555-4555-8555-555555555555",
    status: "pending",
    approval: "pending",
  };
  await page.reload();
  await page.waitForSelector("h1");
  await page.click('input[type="checkbox"]');
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.__calls.length);
  const requestCall = await page.evaluate(() => window.__calls[0]);
  assert.equal(requestCall.requestId, scenario.requestId);
  assert.equal(requestCall.orderId, undefined);
  console.log(
    "PASS: pending request submits acceptance and issuance together; independent accept-in-preparation remains available.",
  );
  for (const width of [390, 768]) {
    await page.setViewport({ width, height: 900 });
    await page.reload();
    await page.waitForSelector("h1");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  assert.deepEqual(errors, []);
  if (output)
    await page.screenshot({
      path: path.join(output, "solicitud-movil.png"),
      fullPage: true,
    });
  console.log(
    "PASS: desktop/mobile 390 and 768px, no overflow and no runtime errors.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  assert.equal(
    path.dirname(path.resolve(temporary)),
    path.resolve(os.tmpdir()),
  );
  assert.ok(path.basename(temporary).startsWith("fivesaint-workflow-ui-"));
  fs.rmSync(temporary, { recursive: true });
}
