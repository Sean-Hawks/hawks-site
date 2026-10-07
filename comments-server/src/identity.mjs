import { createHash, randomBytes } from "node:crypto";
import { HttpError, html } from "./http.mjs";

const hash = (value) => createHash("sha256").update(value).digest("base64url");
const random = () => randomBytes(32).toString("base64url");
const opaque = /^[A-Za-z0-9_-]{43}$/;

export function createIdentity({ db, config, fetchImpl, now }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS github_users (
      id INTEGER PRIMARY KEY, login TEXT NOT NULL, name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS login_states (
      state_hash TEXT PRIMARY KEY, verifier TEXT NOT NULL, browser_challenge TEXT NOT NULL,
      expires INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
      user_id INTEGER REFERENCES github_users(id)
    );
    CREATE TABLE IF NOT EXISTS login_sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES github_users(id), expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notification_emails (
      user_id INTEGER NOT NULL REFERENCES github_users(id), email TEXT NOT NULL,
      verified_at INTEGER NOT NULL, PRIMARY KEY(user_id,email)
    );`);
  const enabled = Boolean(config.githubClientId && config.githubClientSecret);
  function publicUser(user) {
    return {
      githubId: user.id,
      githubLogin: user.login,
      name: user.name,
      avatarUrl: `https://avatars.githubusercontent.com/u/${user.id}?v=4`,
    };
  }
  function user(authorization) {
    if (!authorization) return null;
    const match = /^Bearer hcs_([A-Za-z0-9_-]{43})$/.exec(authorization);
    const record =
      match &&
      db
        .prepare(
          `SELECT u.* FROM login_sessions s JOIN github_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?`,
        )
        .get(hash(match[1]), now());
    if (!record)
      throw new HttpError(401, "登入已到期，請重新登入或改用匿名留言。");
    return publicUser(record);
  }
  function notificationEmail(userId) {
    return db.prepare(
      "SELECT email FROM notification_emails WHERE user_id=? ORDER BY verified_at DESC,email LIMIT 1",
    ).get(userId)?.email || "";
  }
  async function handle(
    req,
    res,
    url,
    { json, readBody, requireOrigin, rate, ipKey },
  ) {
    const path = url.pathname;
    if (!path.startsWith("/v1/comments/auth/")) return false;
    if (path === "/v1/comments/auth/me" && req.method === "GET") {
      const account = user(req.headers.authorization);
      json(res, 200, {
        user: account,
        notificationEmail: account ? notificationEmail(account.githubId) : "",
      });
      return true;
    }
    if (path === "/v1/comments/auth/email/unlink" && req.method === "POST") {
      requireOrigin();
      const account = user(req.headers.authorization);
      if (!account) throw new HttpError(401, "請先登入 GitHub。");
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("DELETE FROM notification_emails WHERE user_id=?").run(account.githubId);
        db.prepare("DELETE FROM subscriptions WHERE github_id=?").run(account.githubId);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      json(res, 200, { ok: true });
      return true;
    }
    if (path === "/v1/comments/auth/logout" && req.method === "POST") {
      requireOrigin();
      // Logout must still succeed after expiry or a previous revocation so the
      // browser can clear its session and return to anonymous commenting.
      const match = /^Bearer hcs_([A-Za-z0-9_-]{43})$/.exec(
        req.headers.authorization || "",
      );
      if (req.headers.authorization && !match)
        throw new HttpError(401, "登入驗證資料無效。");
      if (match)
        db.prepare("DELETE FROM login_sessions WHERE token_hash=?").run(
          hash(match[1]),
        );
      json(res, 200, { ok: true });
      return true;
    }
    if (!enabled) throw new HttpError(503, "GitHub 登入暫時無法使用。");
    if (path === "/v1/comments/auth/github/start" && req.method === "POST") {
      requireOrigin();
      rate(`login:${ipKey}`, 5, 60_000);
      const { challenge } = await readBody(req);
      if (typeof challenge !== "string" || !opaque.test(challenge))
        throw new HttpError(400, "登入驗證資料無效。");
      const state = random();
      const verifier = random();
      db.prepare(
        "INSERT INTO login_states (state_hash, verifier, browser_challenge, expires) VALUES (?, ?, ?, ?)",
      ).run(hash(state), verifier, challenge, now() + 10 * 60_000);
      const target = new URL("https://github.com/login/oauth/authorize");
      target.search = new URLSearchParams({
        client_id: config.githubClientId,
        redirect_uri: `${config.publicApi}/v1/comments/auth/github/callback`,
        state,
        scope: "",
        code_challenge: hash(verifier),
        code_challenge_method: "S256",
      }).toString();
      json(res, 200, { authorizeUrl: target.href, state });
      return true;
    }
    if (path === "/v1/comments/auth/github/callback" && req.method === "GET") {
      const state = url.searchParams.get("state");
      const record =
        state &&
        opaque.test(state) &&
        db
          .prepare(
            "SELECT * FROM login_states WHERE state_hash=? AND expires>? AND status='pending'",
          )
          .get(hash(state), now());
      if (!record) throw new HttpError(400, "登入連結已失效，請重新登入。");
      // Claim this state before any asynchronous work: a callback is single-use.
      db.prepare(
        "UPDATE login_states SET status='processing' WHERE state_hash=?",
      ).run(hash(state));
      try {
        const code = url.searchParams.get("code");
        if (url.searchParams.has("error") || !code || code.length > 512)
          throw new Error("authorization declined");
        const tokenResponse = await fetchImpl(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: config.githubClientId,
              client_secret: config.githubClientSecret,
              code,
              code_verifier: record.verifier,
              redirect_uri: `${config.publicApi}/v1/comments/auth/github/callback`,
            }),
            signal: AbortSignal.timeout(5000),
          },
        );
        if (!tokenResponse.ok) throw new Error("token unavailable");
        const token = await tokenResponse.json();
        if (typeof token.access_token !== "string" || token.error)
          throw new Error("token invalid");
        const profileResponse = await fetchImpl("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "hawks-comments",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          signal: AbortSignal.timeout(5000),
        });
        if (!profileResponse.ok) throw new Error("profile unavailable");
        const profile = await profileResponse.json();
        if (
          !Number.isSafeInteger(profile.id) ||
          profile.id <= 0 ||
          typeof profile.login !== "string" ||
          !/^[A-Za-z0-9-]{1,39}$/.test(profile.login)
        )
          throw new Error("profile invalid");
        const name =
          [
            ...String(profile.name || profile.login)
              .replace(/[\p{Cc}\p{Cf}]/gu, "")
              .trim(),
          ]
            .slice(0, 24)
            .join("") || profile.login;
        db.prepare(
          "INSERT INTO github_users (id,login,name) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET login=excluded.login,name=excluded.name",
        ).run(profile.id, profile.login, name);
        db.prepare(
          "UPDATE login_states SET status='ready', user_id=?, verifier='' WHERE state_hash=?",
        ).run(profile.id, hash(state));
        // GitHub access tokens are never persisted or returned to the browser.
        html(
          res,
          "GitHub 登入成功",
          "<p>請返回原本的留言頁面。登入視窗可關閉。</p>",
        );
      } catch {
        db.prepare(
          "UPDATE login_states SET status='failed', verifier='' WHERE state_hash=?",
        ).run(hash(state));
        html(
          res,
          "GitHub 登入未完成",
          "<p>授權已取消或登入服務暫時無法使用。請返回留言頁面重試。</p>",
        );
      }
      return true;
    }
    if (path === "/v1/comments/auth/github/session" && req.method === "POST") {
      requireOrigin();
      const { state, verifier } = await readBody(req);
      if (
        typeof state !== "string" ||
        !opaque.test(state) ||
        typeof verifier !== "string" ||
        !opaque.test(verifier)
      )
        throw new HttpError(400, "登入驗證資料無效。");
      const record = db
        .prepare("SELECT * FROM login_states WHERE state_hash=? AND expires>?")
        .get(hash(state), now());
      if (!record || record.browser_challenge !== hash(verifier))
        throw new HttpError(403, "登入連結已失效，請重新登入。");
      if (record.status === "failed") {
        db.prepare("DELETE FROM login_states WHERE state_hash=?").run(
          hash(state),
        );
        throw new HttpError(400, "GitHub 授權未完成，請重新登入。");
      }
      if (record.status !== "ready") {
        json(res, 200, { pending: true });
        return true;
      }
      const token = random();
      const expires = now() + 7 * 24 * 60 * 60_000;
      db.prepare(
        "INSERT INTO login_sessions (token_hash,user_id,expires) VALUES (?,?,?)",
      ).run(hash(token), record.user_id, expires);
      db.prepare("DELETE FROM login_states WHERE state_hash=?").run(
        hash(state),
      );
      json(res, 200, {
        token: `hcs_${token}`,
        user: publicUser(
          db
            .prepare("SELECT * FROM github_users WHERE id=?")
            .get(record.user_id),
        ),
        notificationEmail: notificationEmail(record.user_id),
        expiresAt: new Date(expires).toISOString(),
      });
      return true;
    }
    throw new HttpError(404, "找不到此 API。");
  }
  function cleanup() {
    db.prepare("DELETE FROM login_states WHERE expires<=?").run(now());
    db.prepare("DELETE FROM login_sessions WHERE expires<=?").run(now());
  }
  return { enabled, user, handle, cleanup };
}
