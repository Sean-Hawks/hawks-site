import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
function load(name) {
  const url = new URL(`../app/lib/${name}.ts`, import.meta.url);
  const code = ts.transpileModule(fs.readFileSync(url, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {},
    require = createRequire(url);
  vm.runInNewContext(code, {
    exports,
    require: (id) => (id.startsWith("./") ? load(id.slice(2)) : require(id)),
  });
  return exports;
}
const {
  buildExploreItems,
  estimatedMinutes,
  filterExploreItems,
  drawExploreItem,
} = load("explore");
const post = {
  slug: "a",
  title: "Essay",
  date: "2026-01-01",
  content: "正文".repeat(1500),
};
test("the discovery pool excludes private, empty and non-review content", () => {
  const items = buildExploreItems(
    [
      post,
      { ...post, slug: "private", status: "private" },
      { ...post, slug: "empty", content: "![[image.jpg]]" },
    ],
    [{ id: "note", title: "Note", date: "2026-02-01", desc: "Hello" }],
    [
      {
        slug: "artist",
        category: "artist",
        content: "",
        hasReview: false,
        recommendedWorks: [{}],
      },
    ],
  );
  assert.equal(items.length, 2);
  assert.equal(items[0].kind, "talk");
  assert.equal(items[1].minutes, 6);
  assert.equal(filterExploreItems(items, 5, "all").length, 1);
  assert.equal(filterExploreItems(items, 0, "post").length, 1);
});
test("estimated time ignores image filenames and formatting markers", () => {
  assert.equal(
    estimatedMinutes("![[very-long-filename.jpg]]\n:::info\n短文\n:::"),
    1,
  );
  assert.equal(estimatedMinutes("字".repeat(501)), 2);
});
test("draws do not repeat before exhausting a round and do not immediately repeat at the boundary", () => {
  const items = ["a", "b", "c"].map((id) => ({ id }));
  let seen = [];
  const chosen = [];
  for (let i = 0; i < 3; i++) {
    const result = drawExploreItem(items, seen, 0);
    chosen.push(result.item.id);
    seen = result.seen;
  }
  assert.deepEqual(chosen, ["a", "b", "c"]);
  const next = drawExploreItem(items, seen, 0.99);
  assert.equal(next.newRound, true);
  assert.notEqual(next.item.id, "c");
  assert.equal(items.length, 3);
});
test("empty and single-item pools are safe, including stale history and invalid random values", () => {
  assert.equal(drawExploreItem([], [], 0).item, undefined);
  assert.equal(drawExploreItem([{ id: "a" }], ["old", "a"], NaN).item.id, "a");
  assert.equal(drawExploreItem([{ id: "a" }, { id: "b" }], [], 1).item.id, "b");
});
