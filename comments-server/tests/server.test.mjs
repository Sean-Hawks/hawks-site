import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createCommentsServer, readConfig } from "../src/server.mjs";

const origin = "http://localhost:3000";
const config = {
  database: ":memory:",
  origins: [origin],
  proxy: "none",
  secret: "",
  allowUnverified: true,
  hostnames: ["localhost"],
  adminToken: "test-admin-token",
};
async function fixture(t, overrides = {}, ports = {}) {
  const app = createCommentsServer({ ...config, ...overrides }, ports);
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const get = (page = "/blog/test/", before) =>
    fetch(
      `${base}/v1/comments/messages?page=${encodeURIComponent(page)}${before ? `&before=${before}` : ""}`,
    );
  const post = (payload = {}, page = "/blog/test/", headers = {}) =>
    fetch(`${base}/v1/comments/messages?page=${encodeURIComponent(page)}`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        requestId: randomUUID(),
        name: "匿名",
        body: "測試留言",
        ...payload,
      }),
    });
  const remove = (id, token = config.adminToken) =>
    fetch(`${base}/v1/comments/messages/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  return { app, base, get, post, remove };
}

test("production configuration fails closed and unverified mode only accepts local origins", () => {
  assert.throws(() => readConfig({}), /TURNSTILE_SECRET/);
  assert.throws(
    () => readConfig({ COMMENTS_ALLOW_UNVERIFIED: "true" }),
    /localhost/,
  );
  assert.throws(
    () =>
      readConfig({
        COMMENTS_TURNSTILE_SECRET: "test",
        COMMENTS_ORIGINS: "https://hawks.tw/path",
      }),
    /ORIGINS/,
  );
  assert.throws(
    () =>
      readConfig({ COMMENTS_TURNSTILE_SECRET: "test", COMMENTS_PORT: "NaN" }),
    /PORT/,
  );
  assert.equal(
    readConfig({ COMMENTS_ALLOW_UNVERIFIED: "true", COMMENTS_ORIGINS: origin })
      .allowUnverified,
    true,
  );
});

test("page isolation, nested replies, and idempotent retry", async (t) => {
  const f = await fixture(t);
  const payload = {
    requestId: randomUUID(),
    name: "Hawks",
    body: "你好\n第二行",
  };
  const first = await f.post(payload);
  assert.equal(first.status, 201);
  const { message } = await first.json();
  const retry = await f.post(payload);
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).message.id, message.id);
  assert.equal((await f.post({ ...payload, body: "另一則" })).status, 409);
  assert.equal((await (await f.get("/talk/test/")).json()).messages.length, 0);
  assert.equal(
    (await f.post({ replyTo: message.id }, "/talk/test/")).status,
    400,
  );
  const reply = (
    await (await f.post({ body: "回覆", replyTo: message.id })).json()
  ).message;
  const nested = (
    await (await f.post({ body: "再回覆", replyTo: reply.id })).json()
  ).message;
  assert.equal(nested.replyTo, reply.id);
  assert.equal((await (await f.get()).json()).messages.length, 3);
});

test("deleted parents keep their replies while removing public content", async (t) => {
  const f = await fixture(t);
  const root = (
    await (await f.post({ name: "作者", body: "要刪除的內容" })).json()
  ).message;
  const reply = (
    await (await f.post({ replyTo: root.id, body: "保留回覆" })).json()
  ).message;
  assert.equal((await f.remove(root.id, "wrong-token")).status, 401);
  assert.equal((await f.remove(root.id)).status, 200);
  const history = await (await f.get()).json();
  assert.equal(history.messages[0].deleted, 1);
  assert.equal(history.messages[0].body, "");
  assert.equal(history.messages[0].name, "已刪除");
  assert.equal(history.messages[1].id, reply.id);
  assert.equal((await f.post({ replyTo: root.id })).status, 400);
});

test("malformed input, oversized messages and honeypot are rejected", async (t) => {
  let time = Date.now();
  const f = await fixture(t, {}, { now: () => time });
  for (const payload of [
    { body: " " },
    { body: "a".repeat(1001) },
    { name: "a".repeat(25) },
    { replyTo: 98765 },
    { requestId: "-".repeat(36) },
    { website: "spam.example" },
    { name: "evil\nname" },
    { body: "a\u0000b" },
  ]) {
    time += 61_000;
    assert.equal((await f.post(payload)).status, 400);
  }
  assert.equal((await f.get("/blog/../test/")).status, 400);
  assert.equal(
    (await fetch(`${f.base}/v1/comments/messages?page=%2F&before=nope`)).status,
    400,
  );
  assert.equal(
    (await f.post({}, "/", { "Content-Type": "text/plain" })).status,
    415,
  );
  assert.equal((await f.post({ body: "🦈".repeat(1000) })).status, 201);
  const oversized = await fetch(`${f.base}/v1/comments/messages?page=%2F`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ body: "a".repeat(13000) }),
  });
  assert.equal(oversized.status, 413);
});

test("CORS, proxy trust and rate limits", async (t) => {
  const f = await fixture(t);
  assert.equal(
    (await f.post({}, "/", { Origin: "https://evil.example" })).status,
    403,
  );
  assert.equal((await f.post({}, "/", { Origin: "" })).status, 403);
  const preflight = await fetch(`${f.base}/v1/comments/messages`, {
    method: "OPTIONS",
    headers: { Origin: origin },
  });
  assert.equal(preflight.headers.get("access-control-allow-origin"), origin);
  assert.equal(preflight.status, 204);
  for (let n = 0; n < 6; n++)
    assert.equal(
      (await f.post({}, "/", { "CF-Connecting-IP": `spoof-${n}` })).status,
      201,
    );
  assert.equal((await f.post()).status, 429);
  const proxied = await fixture(t, { proxy: "cloudflare" });
  assert.equal((await proxied.get()).status, 403);
  const first = await proxied.post({}, "/", {
    "CF-Connecting-IP": "203.0.113.10",
  });
  assert.equal(first.status, 201);
  const id = (await first.json()).message.id;
  assert.equal(
    (await proxied.remove(id)).status,
    200,
    "local CLI admin works behind tunnel without proxy headers",
  );
});

test("Tailscale proxy requires a single verified IP and isolates visitor limits", async (t) => {
  const f = await fixture(t, { proxy: "tailscale" });
  assert.equal((await f.post()).status, 403);
  for (const address of ["invalid", "203.0.113.1, 203.0.113.2"])
    assert.equal(
      (await f.post({}, "/", { "X-Forwarded-For": address })).status,
      403,
    );
  for (let n = 0; n < 6; n++)
    assert.equal(
      (await f.post({}, "/", { "X-Forwarded-For": "203.0.113.1" })).status,
      201,
    );
  assert.equal(
    (await f.post({}, "/", { "X-Forwarded-For": "203.0.113.1" })).status,
    429,
  );
  const other = await f.post({}, "/", { "X-Forwarded-For": "2001:db8::2" });
  assert.equal(other.status, 201);
  assert.equal((await f.remove((await other.json()).message.id)).status, 200);
});

test("Turnstile validates action and hostname and handles outage", async (t) => {
  const good = { success: true, hostname: "localhost", action: "comment" };
  for (const verification of [
    { ...good, success: false },
    { ...good, hostname: "evil.example" },
    { ...good, action: "wrong" },
    good,
  ]) {
    const f = await fixture(
      t,
      { secret: "test-secret", allowUnverified: false },
      { fetchImpl: async () => new Response(JSON.stringify(verification)) },
    );
    assert.equal((await f.post()).status, 400, "missing tokens fail closed");
    assert.equal(
      (await f.post({ token: "test-token" })).status,
      verification === good ? 201 : 400,
    );
  }
  const outage = await fixture(
    t,
    { secret: "test" },
    {
      fetchImpl: async () => {
        throw new Error("network");
      },
    },
  );
  assert.equal((await outage.post({ token: "test-token" })).status, 503);
});

test("simultaneous sends with one request id create one comment", async (t) => {
  const f = await fixture(
    t,
    { secret: "test-secret" },
    {
      fetchImpl: async () => {
        await new Promise((resolve) => setImmediate(resolve));
        return new Response(
          JSON.stringify({
            success: true,
            hostname: "localhost",
            action: "comment",
          }),
        );
      },
    },
  );
  const payload = { requestId: randomUUID(), token: "test-token" };
  const responses = await Promise.all([f.post(payload), f.post(payload)]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 201]);
  assert.equal((await (await f.get()).json()).messages.length, 1);
});

test("SQLite persists across service restart and pagination loses no comments", async () => {
  const dir = mkdtempSync(join(tmpdir(), "hawks-comments-test-"));
  const db = join(dir, "comments.sqlite");
  let time = Date.now();
  const app = createCommentsServer(
    { ...config, database: db },
    { now: () => time },
  );
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  try {
    for (let n = 0; n < 105; n++) {
      time += 61_000;
      const response = await fetch(`${base}/v1/comments/messages?page=%2F`, {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: randomUUID(),
          name: "匿名",
          body: `留言 ${n}`,
        }),
      });
      assert.equal(response.status, 201);
    }
  } finally {
    await app.close();
  }
  const restarted = createCommentsServer({ ...config, database: db });
  await new Promise((resolve) =>
    restarted.server.listen(0, "127.0.0.1", resolve),
  );
  const nextBase = `http://127.0.0.1:${restarted.server.address().port}`;
  try {
    const latest = await (
      await fetch(`${nextBase}/v1/comments/messages?page=%2F`)
    ).json();
    assert.equal(latest.messages.length, 100);
    assert.equal(latest.hasMore, true);
    const older = await (
      await fetch(
        `${nextBase}/v1/comments/messages?page=%2F&before=${latest.messages[0].id}`,
      )
    ).json();
    assert.equal(older.messages.length, 5);
    assert.equal(older.hasMore, false);
    assert.equal(
      new Set([...older.messages, ...latest.messages].map((m) => m.id)).size,
      105,
    );
  } finally {
    await restarted.close();
    rmSync(dir, { recursive: true });
  }
});
