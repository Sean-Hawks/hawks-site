import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
const code = ts.transpileModule(
  fs.readFileSync(
    new URL("../app/lib/comments-client.ts", import.meta.url),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
vm.runInNewContext(code, { exports, URL, AbortSignal });
const { commentsApiOrigin, commentPageKey, mergeComments } = exports;

test("comments API origin permits HTTPS and local development, rejecting credentials and paths", () => {
  for (const value of [
    undefined,
    "",
    "http://remote.example",
    "https://user:secret@example.com",
    "https://example.com/api",
    "https://example.com/?token=secret",
    "https://example.com/#fragment",
    "javascript:alert(1)",
  ])
    assert.equal(commentsApiOrigin(value), null);
  assert.equal(
    commentsApiOrigin("https://comments.hawks.tw/"),
    "https://comments.hawks.tw",
  );
  assert.equal(
    commentsApiOrigin("http://127.0.0.1:8790"),
    "http://127.0.0.1:8790",
  );
});

test("canonical page keys retain separate article threads across trailing slash variants", () => {
  assert.equal(commentPageKey("/"), "/");
  assert.equal(commentPageKey("/blog/example"), "/blog/example/");
  assert.equal(commentPageKey("/blog/example/"), "/blog/example/");
  assert.notEqual(
    commentPageKey("/blog/example/"),
    commentPageKey("/talk/example/"),
  );
});

test("overlapping history and retries produce one item per ID while applying deletion updates", () => {
  const current = [
    { id: 2, body: "reply" },
    { id: 3, body: "remove me" },
  ];
  const incoming = [
    { id: 1, body: "parent" },
    { id: 2, body: "reply" },
    { id: 3, body: "", deleted: 1 },
  ];
  const merged = mergeComments(current, incoming);
  assert.deepEqual(
    Array.from(merged, (item) => item.id),
    [1, 2, 3],
  );
  assert.equal(merged[2].body, "");
  assert.equal(merged[2].deleted, 1);
  assert.equal(
    current[1].body,
    "remove me",
    "merging must not mutate existing state",
  );
});
