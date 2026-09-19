import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
const code = ts.transpileModule(
  fs.readFileSync(new URL("../app/lib/hearts-client.ts", import.meta.url), "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
vm.runInNewContext(code, { exports, URL, Uint8Array, btoa, AbortController, setTimeout, clearTimeout });
const { heartsApiOrigin, createHeartVisitorStore, requestHeart, HeartRequestError } = exports;
const token = "a".repeat(43);
const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" },
});

test("API origins reject insecure or credential-bearing URLs but permit explicit localhost development", () => {
  for (const value of [undefined, "", "http://example.com", "https://user:secret@example.com", "https://example.com/path", "https://example.com/?token=a", "https://example.com/#secret", "javascript:alert(1)"])
    assert.equal(heartsApiOrigin(value), null);
  assert.equal(heartsApiOrigin("https://api.hawks.tw/"), "https://api.hawks.tw");
  assert.equal(heartsApiOrigin("http://localhost:8787"), "http://localhost:8787");
  assert.equal(heartsApiOrigin("http://127.0.0.1:8787"), "http://127.0.0.1:8787");
});

test("read-only visits create no identifier, and 32 random bytes become a reusable URL-safe token", () => {
  let raw = null, generated = 0;
  const storage = { getItem: () => raw, setItem: (_key, value) => { raw = value; } };
  const port = { storage: () => storage, randomValues: (bytes) => { generated++; assert.equal(bytes.length, 32); return bytes.fill(255); } };
  const first = createHeartVisitorStore(port);
  assert.equal(first().token, null);
  assert.equal(generated, 0);
  const visitor = first(true);
  assert.match(visitor.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(visitor.persistent, true);
  assert.equal(createHeartVisitorStore(port)().token, visitor.token);
  assert.equal(generated, 1);
  raw = "b".repeat(43);
  assert.equal(first().token, raw);
  raw = null;
  assert.equal(first().token, null);
  assert.equal(raw, null, "clearing storage must not resurrect the previous token");
});

test("blocked storage retains one temporary identity and never reports persistence", () => {
  for (const storage of [
    { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } },
    { getItem: () => null, setItem() { throw Error("quota"); } },
  ]) {
    let generated = 0;
    const get = createHeartVisitorStore({ storage: () => storage, randomValues: (bytes) => { generated++; return bytes.fill(123); } });
    assert.equal(get().token, null);
    const first = get(true);
    assert.equal(first.persistent, false);
    assert.equal(get(true).token, first.token);
    assert.equal(generated, 1);
  }
});

test("malformed stored tokens are replaced only when the visitor presses like", () => {
  let raw = "not-a-token";
  const get = createHeartVisitorStore({
    storage: () => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }),
    randomValues: (bytes) => bytes.fill(42),
  });
  assert.equal(get().token, null);
  assert.equal(raw, "not-a-token");
  assert.match(get(true).token, /^[A-Za-z0-9_-]{43}$/);
});

test("GET and desired-state PUT keep the token in authorization, never in URLs, and disable caching", async () => {
  const calls = [];
  const fetcher = async (url, init) => { calls.push({ url, init }); return response({ count: 12, liked: init.method === "PUT" }); };
  assert.equal((await requestHeart("https://api.hawks.tw", "post:hello", { fetcher })).liked, false);
  const result = await requestHeart("https://api.hawks.tw", "library:book:hello", { token, liked: true, fetcher });
  assert.equal(result.count, 12);
  assert.equal(result.liked, true);
  assert.equal(calls[0].init.headers.Authorization, undefined);
  assert.equal(calls[1].url, "https://api.hawks.tw/v1/hearts/library%3Abook%3Ahello");
  assert.ok(!calls[1].url.includes(token));
  assert.equal(calls[1].init.headers.Authorization, `Bearer ${token}`);
  assert.equal(calls[1].init.body, '{"liked":true}');
  assert.equal(calls[1].init.cache, "no-store");
  assert.equal(calls[1].init.credentials, "omit");
  assert.equal(calls[1].init.redirect, "error");
  await requestHeart("https://api.hawks.tw", "talk:台北散步", { fetcher });
  assert.equal(calls[2].url, `https://api.hawks.tw/v1/hearts/${encodeURIComponent("talk:台北散步")}`);
});

test("invalid configuration, identifiers and write credentials never issue a request", async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return response({ count: 0, liked: false }); };
  for (const [origin, id, options] of [
    ["http://example.com", "post:a", {}],
    ["https://api.hawks.tw", "../../secret", {}],
    ["https://api.hawks.tw", "post:a", { token: "bad" }],
    ["https://api.hawks.tw", "post:a", { liked: true }],
  ]) await assert.rejects(requestHeart(origin, id, { ...options, fetcher }));
  assert.equal(calls, 0);
});

test("server errors, malformed responses and offline requests never turn into synthetic counts", async () => {
  for (const value of [null, { count: -1, liked: false }, { count: 1.2, liked: true }, { count: 0, liked: "false" }, { count: Number.MAX_SAFE_INTEGER + 1, liked: false }])
    await assert.rejects(requestHeart("https://api.hawks.tw", "post:a", { fetcher: async () => response(value) }));
  await assert.rejects(requestHeart("https://api.hawks.tw", "post:a", { fetcher: async () => response({}, 429) }), (error) => error instanceof HeartRequestError && error.status === 429);
  await assert.rejects(requestHeart("https://api.hawks.tw", "post:a", { fetcher: async () => new Response("not json") }));
  await assert.rejects(requestHeart("https://api.hawks.tw", "post:a", { fetcher: async () => { throw Error("offline"); } }), /offline/);
});

test("navigation cancellation and request deadlines abort a pending request", async () => {
  const fetcher = async (_url, init) => new Promise((_resolve, reject) => {
    if (init.signal.aborted) return reject(new DOMException("Aborted", "AbortError"));
    init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  });
  const controller = new AbortController();
  const pending = requestHeart("https://api.hawks.tw", "post:a", { signal: controller.signal, fetcher });
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
  await assert.rejects(requestHeart("https://api.hawks.tw", "post:a", { fetcher, timeoutMs: 5 }), { name: "AbortError" });
});
