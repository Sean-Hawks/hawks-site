import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createCommentsServer, readConfig } from "../src/server.mjs";

const origin = "https://hawks.tw";
const publicApi = "https://hawks-comments.sean-hawks.workers.dev";
const hash = (value) => createHash("sha256").update(value).digest("base64url");
const configuration = {
  database: ":memory:",
  origins: [origin],
  proxy: "none",
  secret: "",
  allowUnverified: true,
  adminToken: "admin-secret",
  siteOrigin: origin,
  publicApi,
  githubClientId: "test-client",
  githubClientSecret: "private-oauth-secret",
  resendApiKey: "private-resend-key",
  mailFrom: "Hawks <comments@mail.hawks.tw>",
  mailDailyLimit: 100,
};
async function fixture(t, options = {}, ports = {}) {
  const deliveries = [];
  let clock = Date.now();
  const fetchImpl = async (url, init) => {
    if (url === "https://github.com/login/oauth/access_token") {
      assert.equal(
        init.body.get("client_secret"),
        configuration.githubClientSecret,
      );
      assert.ok(init.body.get("code_verifier"));
      return Response.json({ access_token: "private-github-access" });
    }
    if (url === "https://api.github.com/user")
      return Response.json({ id: 1234, login: "Hawks-test", name: "Hawks" });
    if (url === "https://api.resend.com/emails") {
      deliveries.push({ ...init, payload: JSON.parse(init.body) });
      return Response.json({ id: randomUUID() });
    }
    assert.fail(`unexpected external request: ${url}`);
  };
  const app = createCommentsServer(
    { ...configuration, ...options },
    { fetchImpl, now: () => clock, scheduleMail: false, ...ports },
  );
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const post = (path, body, token) =>
    fetch(base + path, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  const message = (payload = {}, token, page = "/blog/test/") =>
    post(
      `/v1/comments/messages?page=${encodeURIComponent(page)}`,
      { requestId: randomUUID(), name: "匿名", body: "留言", ...payload },
      token,
    );
  const login = async () => {
    const verifier = randomBytes(32).toString("base64url");
    const result = await (
      await post("/v1/comments/auth/github/start", {
        challenge: hash(verifier),
      })
    ).json();
    return { ...result, verifier };
  };
  const confirmUrl = (delivery) =>
    new URL(delivery.payload.text.match(/確認訂閱：(https:\/\/[^\s]+)/)[1]);
  const unsubUrl = (delivery) =>
    new URL(delivery.payload.headers["List-Unsubscribe"].slice(1, -1));
  const action = (url, method = "GET") =>
    fetch(base + url.pathname + url.search, { method });
  return {
    app,
    base,
    deliveries,
    post,
    message,
    login,
    confirmUrl,
    unsubUrl,
    action,
    advance(ms = 61_000) {
      clock += ms;
    },
  };
}

test("optional integration configuration is complete, HTTPS, and fail closed", () => {
  const base = { COMMENTS_TURNSTILE_SECRET: "secret" };
  assert.throws(
    () => readConfig({ ...base, COMMENTS_GITHUB_CLIENT_ID: "client" }),
    /一起/,
  );
  assert.throws(
    () => readConfig({ ...base, COMMENTS_RESEND_API_KEY: "key" }),
    /一起/,
  );
  assert.throws(
    () =>
      readConfig({
        ...base,
        COMMENTS_GITHUB_CLIENT_ID: "client",
        COMMENTS_GITHUB_CLIENT_SECRET: "secret",
      }),
    /PUBLIC_API/,
  );
  assert.throws(
    () =>
      readConfig({ ...base, COMMENTS_PUBLIC_API_URL: "http://public.example" }),
    /HTTPS/,
  );
  assert.throws(
    () => readConfig({ ...base, COMMENTS_MAIL_DAILY_LIMIT: "-1" }),
    /DAILY_LIMIT/,
  );
});

test("GitHub uses PKCE, one-use state and browser proof; identity and logout stay server verified", async (t) => {
  const f = await fixture(t);
  const login = await f.login();
  const authorize = new URL(login.authorizeUrl);
  assert.equal(authorize.origin, "https://github.com");
  assert.equal(
    authorize.searchParams.get("redirect_uri"),
    `${publicApi}/v1/comments/auth/github/callback`,
  );
  assert.equal(authorize.searchParams.get("scope"), "");
  assert.equal(authorize.searchParams.get("code_challenge_method"), "S256");
  const poll = () =>
    f.post("/v1/comments/auth/github/session", {
      state: login.state,
      verifier: login.verifier,
    });
  assert.equal((await (await poll()).json()).pending, true);
  const callback = `${f.base}/v1/comments/auth/github/callback?code=test&state=${login.state}`;
  assert.equal((await fetch(callback)).status, 200);
  assert.equal((await fetch(callback)).status, 400);
  assert.equal(
    (
      await f.post("/v1/comments/auth/github/session", {
        state: login.state,
        verifier: randomBytes(32).toString("base64url"),
      })
    ).status,
    403,
  );
  const session = await (await poll()).json();
  assert.equal(session.user.githubLogin, "Hawks-test");
  assert.match(session.token, /^hcs_/);
  assert.ok(!JSON.stringify(session).includes("private-github-access"));
  assert.equal((await poll()).status, 403);
  const response = await f.message(
    { githubId: 999, githubLogin: "forged" },
    session.token,
  );
  const message = (await response.json()).message;
  assert.equal(message.githubId, 1234);
  assert.equal(message.githubLogin, "Hawks-test");
  const anonymous = (
    await (await f.message({ githubId: 999, githubLogin: "forged" })).json()
  ).message;
  assert.equal(anonymous.githubId, null);
  assert.equal(
    (await f.post("/v1/comments/auth/logout", {}, session.token)).status,
    200,
  );
  assert.equal((await f.message({}, session.token)).status, 401);
});

test("declined, expired and forged OAuth states fail without creating a session", async (t) => {
  const f = await fixture(t);
  const login = await f.login();
  assert.equal(
    (
      await fetch(
        `${f.base}/v1/comments/auth/github/callback?state=${randomBytes(32).toString("base64url")}&code=bad`,
      )
    ).status,
    400,
  );
  await fetch(
    `${f.base}/v1/comments/auth/github/callback?state=${login.state}&error=access_denied`,
  );
  assert.equal(
    (
      await f.post("/v1/comments/auth/github/session", {
        state: login.state,
        verifier: login.verifier,
      })
    ).status,
    400,
  );
  const expired = await f.login();
  f.advance(11 * 60_000);
  assert.equal(
    (
      await f.post("/v1/comments/auth/github/session", {
        state: expired.state,
        verifier: expired.verifier,
      })
    ).status,
    403,
  );
});

test("double opt-in scopes notifications to one nested thread and never publishes email", async (t) => {
  const f = await fixture(t);
  const root = await (
    await f.message({ email: " Reader@Example.com " })
  ).json();
  assert.match(root.notice, /確認/);
  assert.ok(!JSON.stringify(root).includes("reader@example.com"));
  await f.app.flushMail();
  assert.equal(f.deliveries.length, 1);
  assert.equal(f.deliveries[0].payload.to[0], "reader@example.com");
  const confirmation = f.confirmUrl(f.deliveries[0]);
  assert.equal((await f.action(confirmation)).status, 200); // Scanner only visits GET.
  const firstReply = await (
    await f.message({ replyTo: root.message.id })
  ).json();
  await f.app.flushMail();
  assert.equal(f.deliveries.length, 1); // No notification before explicit confirmation.
  assert.equal((await f.action(confirmation, "POST")).status, 200);
  await f.message({ body: "巢狀回覆", replyTo: firstReply.message.id });
  await f.message({ body: "另一串" });
  await f.message({
    body: "同一人",
    email: "reader@example.com",
    replyTo: root.message.id,
  });
  await f.app.flushMail();
  assert.equal(f.deliveries.length, 2);
  assert.match(f.deliveries[1].payload.text, /巢狀回覆/);
  assert.match(
    f.deliveries[1].payload.text,
    /https:\/\/hawks.tw\/blog\/test\/#comment-/,
  );
  const history = await (
    await fetch(`${f.base}/v1/comments/messages?page=%2Fblog%2Ftest%2F`)
  ).json();
  assert.ok(!JSON.stringify(history).includes("example.com"));
  assert.ok(!JSON.stringify(history).includes("notificationEmail"));
});

test("notification retries reuse the exact idempotency key and durable payload", async (t) => {
  const attempts = [];
  const f = await fixture(
    t,
    {},
    {
      fetchImpl: async (url, init) => {
        assert.equal(url, "https://api.resend.com/emails");
        attempts.push({
          key: init.headers["Idempotency-Key"],
          body: init.body,
        });
        return Response.json({}, { status: attempts.length === 1 ? 503 : 200 });
      },
    },
  );
  await f.message({ email: "retry@example.com" });
  await Promise.all([f.app.flushMail(), f.app.flushMail()]);
  assert.equal(attempts.length, 1);
  f.advance(31_000);
  await f.app.flushMail();
  assert.equal(attempts.length, 2);
  assert.deepEqual(attempts[0], attempts[1]);
  await f.app.flushMail();
  assert.equal(attempts.length, 2);
});

test("comment retries cannot create duplicate subscriptions or disclose a stored email", async (t) => {
  const f = await fixture(t);
  const payload = { requestId: randomUUID(), email: "reader@example.com" };
  assert.equal((await f.message(payload)).status, 201);
  const repeated = await f.message(payload);
  assert.equal(repeated.status, 200);
  assert.ok(!(await repeated.text()).includes("reader@example.com"));
  assert.equal(
    (await f.message({ ...payload, email: "changed@example.com" })).status,
    409,
  );
  await f.app.flushMail();
  assert.equal(f.deliveries.length, 1);
});

test("deleted replies are removed from pending email notifications", async (t) => {
  const f = await fixture(t);
  const root = (await (await f.message({ email: "reader@example.com" })).json())
    .message;
  await f.app.flushMail();
  await f.action(f.confirmUrl(f.deliveries[0]), "POST");
  const reply = (
    await (await f.message({ replyTo: root.id, body: "待刪除內文" })).json()
  ).message;
  const deleted = await fetch(`${f.base}/v1/comments/messages/${reply.id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer admin-secret" },
  });
  assert.equal(deleted.status, 200);
  await f.app.flushMail();
  assert.equal(f.deliveries.length, 1);
});

test("unsubscribe is explicit, removes queued mail, and confirmation tokens expire", async (t) => {
  const f = await fixture(t);
  const root = (await (await f.message({ email: "reader@example.com" })).json())
    .message;
  await f.app.flushMail();
  const confirmation = f.confirmUrl(f.deliveries[0]);
  const unsubscribe = f.unsubUrl(f.deliveries[0]);
  await f.action(confirmation, "POST");
  await f.action(unsubscribe); // GET does not unsubscribe.
  await f.message({ replyTo: root.id });
  await f.app.flushMail();
  assert.equal(f.deliveries.length, 2);
  await f.message({ replyTo: root.id });
  await f.action(unsubscribe, "POST");
  await f.app.flushMail();
  assert.equal(f.deliveries.length, 2);
  await f.message({ email: "expire@example.com" });
  await f.app.flushMail();
  const expired = f.confirmUrl(f.deliveries[2]);
  f.advance(49 * 60 * 60_000);
  assert.equal((await f.action(expired, "POST")).status, 400);
});

test("outbox survives restart and mail attempts respect the rolling daily limit", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "hawks-notify-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const database = join(dir, "comments.sqlite");
  const f = await fixture(t, { database, mailDailyLimit: 1 });
  await f.message({ email: "first@example.com" });
  await f.message({ email: "second@example.com" });
  // Use an independent delivery process with the persisted queue after closing the first server.
  await f.app.close();
  const app = createCommentsServer(
    { ...configuration, database, mailDailyLimit: 1 },
    {
      scheduleMail: false,
      fetchImpl: async () => {
        f.deliveries.push({});
        return Response.json({ id: "delivered" });
      },
    },
  );
  await app.flushMail();
  await app.flushMail();
  assert.equal(f.deliveries.length, 1);
  await app.close();
});

test("email integration is opt-in and malformed addresses do not create public messages", async (t) => {
  const f = await fixture(t, {
    resendApiKey: "",
    mailFrom: "",
    githubClientId: "",
    githubClientSecret: "",
  });
  assert.deepEqual(await (await fetch(`${f.base}/v1/comments/config`)).json(), {
    githubEnabled: false,
    emailEnabled: false,
  });
  assert.equal((await f.message({ email: "victim@example.com" })).status, 503);
  assert.equal((await f.message({ email: "bad\r\n@example.com" })).status, 400);
  assert.equal((await f.message()).status, 201);
});
