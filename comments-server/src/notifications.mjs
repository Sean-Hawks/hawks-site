import { createHash, randomBytes } from "node:crypto";
import { HttpError, html, escapeHtml } from "./http.mjs";
import { createMailDelivery } from "./mail-delivery.mjs";

const random = () => randomBytes(32).toString("base64url");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const opaque = /^[A-Za-z0-9_-]{43}$/;
export function normalizeEmail(value) {
  if (value === undefined || value === "") return "";
  if (typeof value !== "string") throw new HttpError(400, "Email 格式無效。");
  const email = value.trim().toLowerCase();
  if (!email) return "";
  if (
    email.length > 254 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(
      email,
    ) ||
    email.includes("..")
  )
    throw new HttpError(400, "Email 格式無效。");
  return email;
}

export function createNotifications({
  db,
  config,
  fetchImpl,
  now,
  smtpTransport,
}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY, page TEXT NOT NULL, root_id INTEGER NOT NULL REFERENCES messages(id),
      email TEXT NOT NULL, github_id INTEGER, verified INTEGER NOT NULL DEFAULT 0,
      verify_hash TEXT UNIQUE, verify_expires INTEGER, unsubscribe_token TEXT NOT NULL,
      created_at INTEGER NOT NULL, UNIQUE(root_id,email)
    );
    CREATE TABLE IF NOT EXISTS mail_outbox (
      id INTEGER PRIMARY KEY, subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      message_id INTEGER REFERENCES messages(id), kind TEXT NOT NULL,
      payload TEXT NOT NULL, recipient_hash TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL, next_attempt INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending'
    );
    CREATE INDEX IF NOT EXISTS mail_outbox_pending ON mail_outbox(status,next_attempt);
    CREATE TABLE IF NOT EXISTS mail_attempts (attempted_at INTEGER NOT NULL);
  `);
  const delivery = createMailDelivery({ config, fetchImpl, smtpTransport });
  const enabled = delivery.enabled;
  let dispatchPromise = null;
  let stopping = false;
  function queue(subscription, kind, message, text) {
    db.prepare(
      "INSERT INTO mail_outbox (subscription_id,message_id,kind,payload,recipient_hash,idempotency_key,created_at,next_attempt) VALUES (?,?,?,?,?,?,?,?)",
    ).run(
      subscription.id,
      message?.id ?? null,
      kind,
      JSON.stringify({
        from: config.mailFrom,
        to: [subscription.email],
        subject:
          kind === "confirm"
            ? "確認 Hawks 留言回覆通知"
            : "你的 Hawks 討論串有新回覆",
        text,
        headers: {
          "List-Unsubscribe": `<${config.publicApi}/v1/comments/notifications/unsubscribe?token=${subscription.unsubscribe_token}>`,
        },
      }),
      hash(subscription.email),
      `hawks-comments/${kind}/${random()}`,
      now(),
      now(),
    );
  }
  function rootOf(message) {
    let current = message;
    while (current.replyTo !== null) {
      const parent = db
        .prepare("SELECT id,reply_to AS replyTo FROM messages WHERE id=?")
        .get(current.replyTo);
      if (!parent || parent.id >= current.id) throw new Error("invalid thread");
      current = parent;
    }
    return current.id;
  }
  function posted(message, email) {
    if (!enabled) return "";
    const root = rootOf(message);
    const subscribers = db
      .prepare("SELECT * FROM subscriptions WHERE root_id=? AND verified=1")
      .all(root);
    for (const sub of subscribers) {
      if (
        sub.email === email ||
        (message.githubId && sub.github_id === message.githubId)
      )
        continue;
      queue(
        sub,
        "reply",
        message,
        `${message.name} 在你訂閱的討論串留言：\n\n${message.body}\n\n查看與回覆：${config.siteOrigin}${message.page}#comment-${message.id}\n\n取消此討論串通知：${config.publicApi}/v1/comments/notifications/unsubscribe?token=${sub.unsubscribe_token}`,
      );
    }
    if (!email) return "";
    const existing = db
      .prepare("SELECT * FROM subscriptions WHERE root_id=? AND email=?")
      .get(root, email);
    const verifiedForAccount = Boolean(
      message.githubId &&
        db
          .prepare(
            "SELECT 1 FROM notification_emails WHERE user_id=? AND email=?",
          )
          .get(message.githubId, email),
    );
    if (existing) {
      if (!existing.verified && verifiedForAccount) {
        db.prepare(
          "UPDATE subscriptions SET verified=1,github_id=?,verify_hash=NULL,verify_expires=NULL WHERE id=?",
        ).run(message.githubId, existing.id);
        db.prepare(
          "UPDATE mail_outbox SET status='cancelled',payload='{}' WHERE subscription_id=? AND kind='confirm' AND status='pending'",
        ).run(existing.id);
        return "已開啟此討論串的回覆通知。";
      }
      return existing.verified
        ? "已訂閱此討論串的回覆通知。"
        : "請至信箱確認訂閱；驗證信可能在垃圾郵件匣。";
    }
    const confirmations = db
      .prepare(
        "SELECT COUNT(*) AS count FROM mail_outbox WHERE kind='confirm' AND created_at>? AND recipient_hash=?",
      )
      .get(now() - 60 * 60_000, hash(email)).count;
    if (!verifiedForAccount && confirmations >= 3)
      return "通知尚未開啟：此信箱的確認信寄送次數已達上限，請稍後再訂閱。";
    const token = verifiedForAccount ? null : random();
    const unsub = random();
    const result = db
      .prepare(
        "INSERT INTO subscriptions (page,root_id,email,github_id,verified,verify_hash,verify_expires,unsubscribe_token,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      )
      .run(
        message.page,
        root,
        email,
        message.githubId ?? null,
        verifiedForAccount ? 1 : 0,
        token ? hash(token) : null,
        token ? now() + 48 * 60 * 60_000 : null,
        unsub,
        now(),
      );
    if (verifiedForAccount) return "已開啟回覆通知，不需再次收信確認。";
    const sub = db
      .prepare("SELECT * FROM subscriptions WHERE id=?")
      .get(result.lastInsertRowid);
    queue(
      sub,
      "confirm",
      null,
      `你在 Hawks 留言區填寫了這個信箱，並要求接收此討論串的新回覆。${message.githubId ? `\n\n確認後，這個信箱也會成為 GitHub @${message.githubLogin} 的通知信箱；同一帳號訂閱其他討論串時，不必再驗證。如果這不是你的 GitHub 帳號，請勿確認。` : ""}\n\n請在 48 小時內確認訂閱：${config.publicApi}/v1/comments/notifications/confirm?token=${token}\n\n討論串：${config.siteOrigin}${message.page}#comment-${root}\n\n如果不是你提出的要求，不必確認。你也可以取消：${config.publicApi}/v1/comments/notifications/unsubscribe?token=${unsub}`,
    );
    return "請至信箱確認回覆通知，確認信可能在垃圾郵件匣。";
  }
  async function handle(req, res, url) {
    const confirm = url.pathname === "/v1/comments/notifications/confirm";
    const unsubscribe =
      url.pathname === "/v1/comments/notifications/unsubscribe";
    if (!confirm && !unsubscribe) return false;
    if (!["GET", "POST"].includes(req.method))
      throw new HttpError(405, "不支援此操作。");
    const token = url.searchParams.get("token");
    if (!token || !opaque.test(token)) {
      html(
        res,
        "通知連結無效",
        `<p>請重新開啟信中的完整連結。</p><a href="${config.siteOrigin}">返回 Hawks</a>`,
        400,
      );
      return true;
    }
    const sub = confirm
      ? db
          .prepare(
            "SELECT * FROM subscriptions WHERE verify_hash=? AND verify_expires>?",
          )
          .get(hash(token), now())
      : db
          .prepare("SELECT * FROM subscriptions WHERE unsubscribe_token=?")
          .get(token);
    if (!sub) {
      html(
        res,
        "通知連結已失效",
        `<p>連結可能已逾期，或這個訂閱已確認或取消。若先前已確認，通知設定不受影響。</p><a href="${config.siteOrigin}">返回 Hawks</a>`,
        400,
      );
      return true;
    }
    const confirmed = () =>
      html(
        res,
        "已確認訂閱",
        `<p>這個討論串有新回覆時會寄信通知你。</p>${sub.github_id ? "<p>已驗證帳號的通知信箱，之後訂閱其他討論串不必再次收確認信。</p>" : ""}<a href="${config.siteOrigin}${sub.page}#comment-${sub.root_id}">返回討論串</a>`,
      );
    // Reopening a confirmed link is harmless; only the first POST changes state.
    // Retain its hash until the original expiry so reloads have a clear result.
    if (confirm && sub.verified) {
      confirmed();
      return true;
    }
    if (req.method === "GET") {
      const account =
        confirm && sub.github_id
          ? db
              .prepare("SELECT login FROM github_users WHERE id=?")
              .get(sub.github_id)
          : null;
      // Email link scanners can visit GET links without changing a preference.
      html(
        res,
        confirm ? "確認回覆通知" : "取消回覆通知",
        `<p>${confirm ? "確認後，有人回覆此討論串時會寄信通知你。" : "取消後，此討論串的新回覆不會再寄信通知你。"}</p>${account ? `<p>通知信箱：${escapeHtml(sub.email)}<br>GitHub 帳號：<strong>@${escapeHtml(account.login)}</strong></p><p>這也會驗證此帳號的通知信箱；之後用同一帳號訂閱其他討論串，不必再次收確認信。如果不是你的帳號或你沒有提出這個要求，請勿確認。</p>` : ""}<form method="post"><button type="submit">${confirm ? "確認訂閱" : "取消訂閱"}</button></form>`,
      );
    } else if (confirm) {
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("UPDATE subscriptions SET verified=1 WHERE id=?").run(
          sub.id,
        );
        if (sub.github_id)
          db.prepare(
            "INSERT INTO notification_emails (user_id,email,verified_at) VALUES (?,?,?) ON CONFLICT(user_id,email) DO UPDATE SET verified_at=excluded.verified_at",
          ).run(sub.github_id, sub.email, now());
        db.prepare(
          "UPDATE mail_outbox SET status='cancelled',payload='{}' WHERE subscription_id=? AND kind='confirm' AND status='pending'",
        ).run(sub.id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      confirmed();
    } else {
      db.prepare("DELETE FROM subscriptions WHERE id=?").run(sub.id);
      html(
        res,
        "已取消通知",
        `<p>這個討論串不會再寄信通知你，其他訂閱不受影響。</p><a href="${config.siteOrigin}${sub.page}#comment-${sub.root_id}">返回討論串</a>`,
      );
    }
    return true;
  }
  async function dispatch() {
    const items = db
      .prepare(
        "SELECT * FROM mail_outbox WHERE status='pending' AND next_attempt<=? ORDER BY id LIMIT 5",
      )
      .all(now());
    for (const item of items) {
      if (stopping) break;
      if (now() - item.created_at >= 23 * 60 * 60_000 || item.attempts >= 8) {
        db.prepare(
          "UPDATE mail_outbox SET status='failed',payload='{}' WHERE id=?",
        ).run(item.id);
        continue;
      }
      const sub = db
        .prepare("SELECT verified FROM subscriptions WHERE id=?")
        .get(item.subscription_id);
      const deleted =
        item.message_id &&
        db
          .prepare("SELECT deleted FROM messages WHERE id=?")
          .get(item.message_id)?.deleted;
      if (
        !sub ||
        (item.kind === "confirm" && sub.verified) ||
        (item.kind === "reply" && (!sub.verified || deleted))
      ) {
        db.prepare(
          "UPDATE mail_outbox SET status='cancelled',payload='{}' WHERE id=?",
        ).run(item.id);
        continue;
      }
      const attempts = db
        .prepare(
          "SELECT COUNT(*) AS count FROM mail_attempts WHERE attempted_at>?",
        )
        .get(now() - 24 * 60 * 60_000).count;
      if (attempts >= (config.mailDailyLimit || 100)) break;
      db.prepare("INSERT INTO mail_attempts (attempted_at) VALUES (?)").run(
        now(),
      );
      try {
        await delivery.send(
          JSON.parse(item.payload),
          item.idempotency_key,
          item.created_at,
        );
        db.prepare(
          "UPDATE mail_outbox SET status='sent',payload='{}',attempts=attempts+1 WHERE id=?",
        ).run(item.id);
      } catch {
        db.prepare(
          "UPDATE mail_outbox SET attempts=attempts+1,next_attempt=? WHERE id=?",
        ).run(
          now() + Math.min(60 * 60_000, 30_000 * 2 ** item.attempts),
          item.id,
        );
      }
    }
  }
  function flush() {
    if (!enabled || stopping) return Promise.resolve();
    if (!dispatchPromise)
      dispatchPromise = dispatch().finally(() => {
        dispatchPromise = null;
      });
    return dispatchPromise;
  }
  async function stop() {
    stopping = true;
    await dispatchPromise;
    delivery.close();
  }
  function cleanup() {
    db.prepare(
      "DELETE FROM subscriptions WHERE verified=0 AND verify_expires<=?",
    ).run(now());
    db.prepare(
      "DELETE FROM mail_outbox WHERE status!='pending' AND created_at<?",
    ).run(now() - 7 * 24 * 60 * 60_000);
    db.prepare("DELETE FROM mail_attempts WHERE attempted_at<?").run(
      now() - 24 * 60 * 60_000,
    );
  }
  return { enabled, posted, handle, flush, cleanup, stop };
}
