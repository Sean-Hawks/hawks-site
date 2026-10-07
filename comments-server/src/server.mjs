import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { isIP } from "node:net";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http.mjs";
import { createIdentity } from "./identity.mjs";
import { createNotifications, normalizeEmail } from "./notifications.mjs";

export function readConfig(env = process.env) {
  const origins = (env.COMMENTS_ORIGINS || "https://hawks.tw")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const origin of origins) {
    if (new URL(origin).origin !== origin)
      throw new Error(
        "COMMENTS_ORIGINS 必須是完整 origin，不能包含路徑或結尾斜線",
      );
  }
  const port = Number(env.COMMENTS_PORT || 8790);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("COMMENTS_PORT 無效");
  const proxy = env.COMMENTS_PROXY || "none";
  if (!["none", "cloudflare", "tailscale"].includes(proxy))
    throw new Error("COMMENTS_PROXY 必須為 none、cloudflare 或 tailscale");
  const secret = env.COMMENTS_TURNSTILE_SECRET || "";
  const allowUnverified = env.COMMENTS_ALLOW_UNVERIFIED === "true";
  if (
    allowUnverified &&
    !secret &&
    origins.some(
      (origin) =>
        !["localhost", "127.0.0.1", "[::1]"].includes(new URL(origin).hostname),
    )
  )
    throw new Error("未啟用驗證時 COMMENTS_ORIGINS 僅能允許 localhost");
  if (!secret && !allowUnverified)
    throw new Error(
      "請設定 COMMENTS_TURNSTILE_SECRET；本機測試可明確設定 COMMENTS_ALLOW_UNVERIFIED=true",
    );
  const hostnames = (env.COMMENTS_TURNSTILE_HOSTNAMES || "hawks.tw")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (secret && !hostnames.length)
    throw new Error("請設定 COMMENTS_TURNSTILE_HOSTNAMES");
  const githubClientId = env.COMMENTS_GITHUB_CLIENT_ID || "";
  const githubClientSecret = env.COMMENTS_GITHUB_CLIENT_SECRET || "";
  const resendApiKey = env.COMMENTS_RESEND_API_KEY || "";
  const mailFrom = env.COMMENTS_MAIL_FROM || "";
  if (Boolean(githubClientId) !== Boolean(githubClientSecret))
    throw new Error("GitHub Client ID 與 Secret 必須一起設定");
  if (Boolean(resendApiKey) !== Boolean(mailFrom))
    throw new Error("Resend API Key 與寄件者必須一起設定");
  if (mailFrom && (/[\r\n]/.test(mailFrom) || !mailFrom.includes("@")))
    throw new Error("COMMENTS_MAIL_FROM 無效");
  const publicApi = env.COMMENTS_PUBLIC_API_URL || "";
  const siteOrigin = env.COMMENTS_SITE_ORIGIN || origins[0];
  if (!origins.includes(siteOrigin))
    throw new Error("COMMENTS_SITE_ORIGIN 必須在允許的來源中");
  if (publicApi) {
    const parsed = new URL(publicApi);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (
      parsed.origin !== publicApi ||
      parsed.username ||
      parsed.password ||
      (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:"))
    )
      throw new Error("COMMENTS_PUBLIC_API_URL 必須是 HTTPS origin");
  }
  if ((githubClientId || resendApiKey) && !publicApi)
    throw new Error("請設定 COMMENTS_PUBLIC_API_URL");
  const mailDailyLimit = Number(env.COMMENTS_MAIL_DAILY_LIMIT || 100);
  if (
    !Number.isInteger(mailDailyLimit) ||
    mailDailyLimit < 1 ||
    mailDailyLimit > 10000
  )
    throw new Error("COMMENTS_MAIL_DAILY_LIMIT 無效");
  return {
    host: env.COMMENTS_HOST || "127.0.0.1",
    port,
    origins,
    proxy,
    secret,
    allowUnverified,
    hostnames,
    database: `${env.COMMENTS_DATA_DIR || ".data"}/comments.sqlite`,
    adminToken: env.COMMENTS_ADMIN_TOKEN || "",
    githubClientId,
    githubClientSecret,
    resendApiKey,
    mailFrom,
    publicApi,
    siteOrigin,
    mailDailyLimit,
  };
}

export function createCommentsServer(
  config,
  { fetchImpl = fetch, now = Date.now, scheduleMail = true } = {},
) {
  if (config.database !== ":memory:")
    mkdirSync(dirname(config.database), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(config.database);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id TEXT NOT NULL UNIQUE,
      page TEXT NOT NULL,
      name TEXT NOT NULL,
      body TEXT NOT NULL,
      reply_to INTEGER REFERENCES messages(id),
      created_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );`);
  db.exec("CREATE INDEX IF NOT EXISTS messages_page_id ON messages(page, id)");
  const columns = new Set(
    db
      .prepare("PRAGMA table_info(messages)")
      .all()
      .map((column) => column.name),
  );
  for (const [name, type] of [
    ["github_id", "INTEGER"],
    ["github_login", "TEXT"],
    ["notification_email", "TEXT"],
  ])
    if (!columns.has(name))
      db.exec(`ALTER TABLE messages ADD COLUMN ${name} ${type}`);
  const fields =
    "id, page, name, body, reply_to AS replyTo, created_at AS createdAt, deleted, github_id AS githubId, github_login AS githubLogin";
  const history = db.prepare(
    `SELECT ${fields} FROM messages WHERE page = ? AND id < ? ORDER BY id DESC LIMIT 101`,
  );
  const find = db.prepare(`SELECT ${fields} FROM messages WHERE id = ?`);
  const duplicate = db.prepare(
    `SELECT ${fields}, notification_email AS notificationEmailHash FROM messages WHERE request_id = ?`,
  );
  const insert = db.prepare(
    "INSERT INTO messages (request_id, page, name, body, reply_to, created_at, github_id, github_login, notification_email) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const identity = createIdentity({ db, config, fetchImpl, now });
  const notifications = createNotifications({ db, config, fetchImpl, now });
  const rates = new Map();
  const salt = randomUUID();

  function pageKey(url) {
    const page = url.searchParams.get("page");
    if (!page || page.length > 300 || !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(page))
      throw new HttpError(400, "頁面路徑無效。");
    return page;
  }
  function getHistory(page, before = Number.MAX_SAFE_INTEGER) {
    const rows = history.all(page, before);
    return {
      messages: rows.slice(0, 100).reverse(),
      hasMore: rows.length > 100,
    };
  }
  function rate(key, max, windowMs) {
    const time = now();
    const old = rates.get(key);
    const entry =
      old && old.until > time ? old : { count: 0, until: time + windowMs };
    if (++entry.count > max)
      throw new HttpError(429, "操作太頻繁，請稍後再試。");
    rates.set(key, entry);
  }
  function json(res, status, data) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(data));
  }
  async function readBody(req) {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 12 * 1024) throw new HttpError(413, "訊息太長。");
      chunks.push(chunk);
    }
    try {
      const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw new Error("invalid payload");
      return data;
    } catch {
      throw new HttpError(400, "無效的 JSON。");
    }
  }
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Vary", "Origin");
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/healthz" && req.method === "GET") {
        db.prepare("SELECT 1").get();
        return json(res, 200, { ok: true });
      }
      const origin = req.headers.origin;
      const notificationForm = [
        "/v1/comments/notifications/confirm",
        "/v1/comments/notifications/unsubscribe",
      ].includes(url.pathname);
      if (
        origin &&
        !config.origins.includes(origin) &&
        !(notificationForm && origin === config.publicApi)
      )
        throw new HttpError(403, "不允許此網站連線。");
      if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
      if (req.method === "OPTIONS") {
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, DELETE, OPTIONS",
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization",
        );
        res.writeHead(204);
        return res.end();
      }
      const deletion = /^\/v1\/comments\/messages\/([1-9]\d*)$/.exec(
        url.pathname,
      );
      if (deletion && req.method === "DELETE") {
        const supplied = req.headers.authorization || "";
        const expected = `Bearer ${config.adminToken}`;
        if (
          !config.adminToken ||
          Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
          !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
        )
          throw new HttpError(401, "需要管理員授權。");
        const id = Number(deletion[1]);
        if (!Number.isSafeInteger(id))
          throw new HttpError(400, "留言 ID 無效。");
        const existing = find.get(id);
        if (!existing || existing.deleted)
          throw new HttpError(404, "留言不存在。");
        db.prepare(
          "UPDATE messages SET deleted = 1, body = '', name = '已刪除', github_id=NULL, github_login=NULL, notification_email=NULL WHERE id = ?",
        ).run(id);
        return json(res, 200, { ok: true });
      }
      const ip =
        config.proxy === "cloudflare"
          ? req.headers["cf-connecting-ip"]
          : config.proxy === "tailscale"
            ? req.headers["x-forwarded-for"]
            : req.socket.remoteAddress;
      // Tailscale Serve replaces this header with the actual peer IP. Only
      // trust its local connection; do not parse client-supplied proxy chains.
      if (
        config.proxy === "tailscale" &&
        !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
          req.socket.remoteAddress,
        )
      )
        throw new HttpError(403, "代理必須從本機連線。");
      if (config.proxy !== "none" && (typeof ip !== "string" || !isIP(ip)))
        throw new HttpError(403, "缺少代理資訊。");
      const ipKey = createHash("sha256").update(`${salt}:${ip}`).digest("hex");
      rate(`request:${ipKey}`, 120, 60_000);
      const requireOrigin = () => {
        if (!origin || !config.origins.includes(origin))
          throw new HttpError(403, "缺少網站來源。");
        if (!req.headers["content-type"]?.startsWith("application/json"))
          throw new HttpError(415, "請使用 JSON。");
      };
      if (url.pathname === "/v1/comments/config" && req.method === "GET")
        return json(res, 200, {
          githubEnabled: identity.enabled,
          emailEnabled: notifications.enabled,
        });
      if (
        await identity.handle(req, res, url, {
          json,
          readBody,
          requireOrigin,
          rate,
          ipKey,
        })
      )
        return;
      if (await notifications.handle(req, res, url)) return;
      if (url.pathname === "/v1/comments/messages" && req.method === "GET") {
        const before = url.searchParams.get("before");
        if (
          before !== null &&
          (!/^[1-9]\d*$/.test(before) || !Number.isSafeInteger(Number(before)))
        )
          throw new HttpError(400, "留言分頁無效。");
        return json(
          res,
          200,
          getHistory(
            pageKey(url),
            before === null ? undefined : Number(before),
          ),
        );
      }
      if (url.pathname === "/v1/comments/messages" && req.method === "POST") {
        const page = pageKey(url);
        if (!origin) throw new HttpError(403, "缺少網站來源。");
        if (!req.headers["content-type"]?.startsWith("application/json"))
          throw new HttpError(415, "請使用 JSON。");
        rate(`send:${ipKey}`, 6, 60_000);
        const payload = await readBody(req);
        if (!payload || typeof payload !== "object" || Array.isArray(payload))
          throw new HttpError(400, "訊息格式錯誤。");
        const {
          requestId,
          name,
          body,
          replyTo = null,
          token,
          website,
        } = payload;
        const email = normalizeEmail(payload.email);
        // Only keep a digest for request deduplication. The actual address
        // belongs to the private subscription, which can be removed entirely.
        const emailHash = email
          ? createHash("sha256").update(email).digest("hex")
          : "";
        if (email && !notifications.enabled)
          throw new HttpError(
            503,
            "Email 回覆通知暫時無法使用，可清空信箱後送出。",
          );
        const author = identity.user(req.headers.authorization);
        if (website) throw new HttpError(400, "驗證失敗。");
        if (
          typeof requestId !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            requestId,
          )
        )
          throw new HttpError(400, "訊息識別碼錯誤。");
        if (
          typeof name !== "string" ||
          !name.trim() ||
          [...name.trim()].length > 24 ||
          /[\p{Cc}\p{Cf}]/u.test(name)
        )
          throw new HttpError(400, "暱稱需為 1–24 字。");
        if (
          typeof body !== "string" ||
          !body.trim() ||
          [...body.trim()].length > 1000 ||
          /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(body)
        )
          throw new HttpError(400, "訊息需為 1–1000 字。");
        const parent =
          replyTo === null
            ? null
            : Number.isSafeInteger(replyTo) && replyTo > 0
              ? find.get(replyTo)
              : null;
        if (
          replyTo !== null &&
          (!parent || parent.deleted || parent.page !== page)
        )
          throw new HttpError(400, "回覆的留言已不存在或不屬於這個頁面。");
        if (config.secret) {
          if (typeof token !== "string" || !token || token.length > 2048)
            throw new HttpError(400, "請先完成安全驗證。");
          let verification;
          try {
            const response = await fetchImpl(
              "https://challenges.cloudflare.com/turnstile/v0/siteverify",
              {
                method: "POST",
                body: new URLSearchParams({
                  secret: config.secret,
                  response: token,
                }),
                signal: AbortSignal.timeout(8000),
              },
            );
            if (!response.ok) throw new Error("verification unavailable");
            verification = await response.json();
          } catch {
            throw new HttpError(503, "驗證服務暫時無法使用，請稍後再試。");
          }
          if (
            !verification.success ||
            verification.action !== "comment" ||
            !config.hostnames.includes(verification.hostname)
          )
            throw new HttpError(400, "安全驗證已過期或無效，請重新驗證。");
        } else if (!config.allowUnverified)
          throw new HttpError(503, "留言服務尚未完成設定。");
        // Check again after asynchronous verification to prevent concurrent duplicate sends.
        const previous = duplicate.get(requestId);
        if (previous) {
          if (
            previous.deleted ||
            previous.page !== page ||
            previous.name !== name.trim() ||
            previous.body !== body.trim() ||
            previous.replyTo !== replyTo ||
            (previous.githubId ?? null) !== (author?.githubId ?? null) ||
            (previous.notificationEmailHash || "") !== emailHash
          )
            throw new HttpError(409, "訊息識別碼已使用。");
          return json(res, 200, { message: find.get(previous.id) });
        }
        if (replyTo !== null && find.get(replyTo)?.deleted)
          throw new HttpError(400, "回覆的留言已被刪除。");
        db.exec("BEGIN IMMEDIATE");
        let message;
        let notice;
        try {
          const result = insert.run(
            requestId,
            page,
            name.trim(),
            body.trim(),
            replyTo,
            new Date(now()).toISOString(),
            author?.githubId ?? null,
            author?.githubLogin ?? null,
            emailHash || null,
          );
          message = find.get(Number(result.lastInsertRowid));
          notice = notifications.posted(message, email);
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        return json(res, 201, { message, ...(notice ? { notice } : {}) });
      }
      throw new HttpError(404, "找不到此 API。");
    } catch (error) {
      if (!res.headersSent && !res.destroyed)
        json(res, error instanceof HttpError ? error.status : 500, {
          error:
            error instanceof HttpError
              ? error.message
              : "留言服務暫時無法使用。",
        });
      else res.destroy();
    }
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  const cleanup = setInterval(() => {
    for (const [key, value] of rates)
      if (value.until <= now()) rates.delete(key);
    identity.cleanup();
    notifications.cleanup();
  }, 20_000);
  cleanup.unref();
  const mailTimer =
    scheduleMail && notifications.enabled
      ? setInterval(() => {
          void notifications
            .flush()
            .catch(() => console.error("Comments mail dispatcher unavailable"));
        }, 15_000)
      : null;
  mailTimer?.unref();
  let closing;
  return {
    server,
    flushMail: notifications.flush,
    close() {
      return (closing ??= (async () => {
        clearInterval(cleanup);
        if (mailTimer) clearInterval(mailTimer);
        await notifications.stop();
        if (server.listening)
          await new Promise((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
        db.close();
      })());
    },
  };
}
