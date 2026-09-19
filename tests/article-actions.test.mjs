import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
const code = ts.transpileModule(
  fs.readFileSync(
    new URL("../app/lib/article-actions.ts", import.meta.url),
    "utf8",
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;
vm.runInNewContext(code, { exports, URL, Error });
const { canonicalArticleUrl, articleCitation, copyArticleText, shareArticle } =
  exports;
test("article URLs always use the public canonical address without local state", () => {
  assert.equal(
    canonicalArticleUrl("/blog/hipac?utm_source=test#day-1"),
    "https://hawks.tw/blog/hipac/",
  );
  for (const value of [
    "https://evil.example/blog/a",
    "//evil.example/blog/a",
    "javascript:alert(1)",
    "/search/?q=test",
  ])
    assert.throws(() => canonicalArticleUrl(value));
  assert.equal(
    articleCitation("測試", "https://hawks.tw/blog/a/", "2026-09-19"),
    "測試 — Hawks（2026-09-19）\nhttps://hawks.tw/blog/a/",
  );
});
test("clipboard denial yields manual text instead of a false success", async () => {
  assert.equal(await copyArticleText("text", {}), "manual");
  assert.equal(
    await copyArticleText("text", {
      clipboard: {
        async writeText() {
          throw Error("denied");
        },
      },
    }),
    "manual",
  );
});
test("unsupported sharing copies the canonical URL and cancellation does not overwrite the clipboard", async () => {
  let copied = "unchanged";
  const clipboard = {
    async writeText(text) {
      copied = text;
    },
  };
  assert.equal(
    await shareArticle("Title", "https://hawks.tw/blog/a/", { clipboard }),
    "copied",
  );
  assert.equal(copied, "https://hawks.tw/blog/a/");
  const cancelled = new Error("cancel");
  cancelled.name = "AbortError";
  assert.equal(
    await shareArticle("Title", "different", {
      clipboard,
      async share() {
        throw cancelled;
      },
    }),
    "cancelled",
  );
  assert.equal(copied, "https://hawks.tw/blog/a/");
});
test("native share success and non-cancellation errors follow separate paths", async () => {
  let shared;
  assert.equal(
    await shareArticle("Title", "https://hawks.tw/talk/a/", {
      async share(data) {
        shared = data;
      },
    }),
    "shared",
  );
  assert.equal(shared.url, "https://hawks.tw/talk/a/");
  assert.equal(
    await shareArticle("Title", "url", {
      async share() {
        throw Error("blocked");
      },
    }),
    "manual",
  );
});
