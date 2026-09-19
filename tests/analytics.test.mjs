import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

function render(environment) {
  const url = new URL("../app/components/CloudflareAnalytics.tsx", import.meta.url);
  const code = ts.transpileModule(fs.readFileSync(url, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: createRequire(url),
    process: { env: { NODE_ENV: environment } },
  });
  return renderToStaticMarkup(exports.default());
}

function page(origin, scripts = []) {
  const markup = render("production");
  const source = markup.match(/<script[^>]*>([\s\S]*)<\/script>/)?.[1];
  assert.ok(source, "production HTML must include the analytics bootstrap");
  const document = {
    querySelector: () => scripts.find((script) => script["data-cf-beacon"]),
    createElement: (tag) => ({
      tag,
      setAttribute(key, value) { this[key] = value; },
    }),
    body: { appendChild: (script) => scripts.push(script) },
  };
  return {
    scripts,
    run: () => vm.runInNewContext(source, { window: { location: { origin } }, document }),
  };
}

test("production loads the official module beacon once and leaves native SPA tracking enabled", () => {
  const context = page("https://hawks.tw");
  context.run();
  context.run();
  assert.equal(context.scripts.length, 1);
  const script = context.scripts[0];
  assert.equal(script.tag, "script");
  assert.equal(script.type, "module");
  assert.equal(script.async, true);
  assert.equal(script.src, "https://static.cloudflareinsights.com/beacon.min.js");
  assert.deepEqual(JSON.parse(script["data-cf-beacon"]), {
    token: "430b038461df4770b3b0c08cea7572e6",
  });
});

test("production previews and lookalike hosts never load analytics", () => {
  for (const origin of [
    "http://localhost:3000", "http://localhost:4175", "http://127.0.0.1:4175",
    "https://sean-hawks.github.io", "https://preview.pages.dev", "null",
    "http://hawks.tw", "https://hawks.tw:8443", "https://www.hawks.tw",
    "https://hawks.tw.example.com", "https://nothawks.tw",
  ]) {
    const context = page(origin);
    context.run();
    assert.equal(context.scripts.length, 0, origin);
  }
});

test("an existing Cloudflare snippet is not inserted a second time", () => {
  const existing = { "data-cf-beacon": '{"token":"existing-site"}' };
  const context = page("https://hawks.tw", [existing]);
  context.run();
  assert.deepEqual(context.scripts, [existing]);
});

test("development and test rendering include no analytics bootstrap", () => {
  assert.equal(render("development"), "");
  assert.equal(render("test"), "");
});
