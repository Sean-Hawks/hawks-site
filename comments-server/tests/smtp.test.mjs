import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createMailDelivery } from "../src/mail-delivery.mjs";
import { readConfig, createCommentsServer } from "../src/server.mjs";

const settings = {
  COMMENTS_TURNSTILE_SECRET: "test-secret",
  COMMENTS_PUBLIC_API_URL: "https://comments.example",
  COMMENTS_MAIL_TRANSPORT: "smtp",
  COMMENTS_MAIL_FROM: "Hawks <comments@hawks.tw>",
};

test("self-hosted SMTP requires a sender and only accepts loopback addresses", () => {
  assert.equal(readConfig(settings).mailTransport, "smtp");
  assert.equal(readConfig(settings).resendApiKey, "");
  for (const changes of [
    { COMMENTS_MAIL_FROM: "" },
    { COMMENTS_SMTP_HOST: "smtp.example.com" },
    { COMMENTS_SMTP_LOCAL_ADDRESS: "192.168.1.1" },
    { COMMENTS_SMTP_PORT: "0" },
    { COMMENTS_MAIL_TRANSPORT: "other" },
  ])
    assert.throws(() => readConfig({ ...settings, ...changes }));
});

test("SMTP serializes UTF-8 mail, escapes dots, and keeps retry Message-ID and Date", async (t) => {
  const messages = [];
  const sockets = new Set();
  let rejectRecipient = false;
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.write("220 localhost test SMTP\r\n");
    let buffer = "";
    let body = null;
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      while (buffer.includes("\r\n")) {
        const position = buffer.indexOf("\r\n");
        const line = buffer.slice(0, position);
        buffer = buffer.slice(position + 2);
        if (body !== null) {
          if (line === ".") {
            messages.push(body.join("\r\n"));
            body = null;
            socket.write("250 queued\r\n");
          } else body.push(line.startsWith("..") ? line.slice(1) : line);
        } else if (line.startsWith("EHLO")) socket.write("250 localhost\r\n");
        else if (line.startsWith("MAIL FROM:")) {
          assert.match(line, /<comments@hawks\.tw>/);
          socket.write("250 sender OK\r\n");
        } else if (line.startsWith("RCPT TO:")) {
          assert.match(line, /<reader@example\.com>/);
          socket.write(
            rejectRecipient
              ? "550 recipient rejected\r\n"
              : "250 recipient OK\r\n",
          );
        } else if (line === "DATA") {
          body = [];
          socket.write("354 send data\r\n");
        } else if (line === "QUIT") socket.end("221 bye\r\n");
        else socket.write("250 OK\r\n");
      }
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise((resolve) => server.close(resolve));
  });
  const config = readConfig({
    ...settings,
    COMMENTS_SMTP_PORT: String(server.address().port),
    COMMENTS_SMTP_LOCAL_ADDRESS: "127.0.0.1",
  });
  const mail = createMailDelivery({
    config,
    fetchImpl: () => assert.fail("Resend must not be used"),
  });
  t.after(() => mail.close());
  const payload = {
    from: config.mailFrom,
    to: ["reader@example.com"],
    subject: "確認 Hawks 留言回覆通知",
    text: "hello\n.leading\n",
    headers: { "List-Unsubscribe": "<https://comments.example/unsubscribe>" },
  };
  const createdAt = Date.now();
  await mail.send(payload, "stable-key", createdAt);
  await mail.send(payload, "stable-key", createdAt);
  assert.equal(messages.length, 2);
  assert.match(messages[0], /Subject: =\?UTF-8\?[BQ]\?/i);
  assert.match(messages[0], /\r\n\.leading/);
  assert.match(
    messages[0],
    /List-Unsubscribe: <https:\/\/comments\.example\/unsubscribe>/,
  );
  for (const header of ["Message-ID", "Date"])
    assert.equal(
      messages[0]
        .replace(/\r\n[ \t]+/g, " ")
        .match(new RegExp(`${header}: (.+)`, "i"))[1],
      messages[1]
        .replace(/\r\n[ \t]+/g, " ")
        .match(new RegExp(`${header}: (.+)`, "i"))[1],
    );
  rejectRecipient = true;
  await assert.rejects(mail.send(payload, "rejected-key", createdAt));
  assert.equal(messages.length, 2);
});

test("SMTP rejection leaves the notification queued and retries the same message", async (t) => {
  let clock = Date.now();
  let reject = true;
  const deliveries = [];
  const directory = mkdtempSync(join(tmpdir(), "hawks-comments-smtp-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const config = {
    ...readConfig(settings),
    database: join(directory, "comments.sqlite"),
    secret: "",
    allowUnverified: true,
  };
  const app = createCommentsServer(config, {
    scheduleMail: false,
    now: () => clock,
    fetchImpl: () => assert.fail("Resend must not be used"),
    smtpTransport: {
      async sendMail(payload) {
        deliveries.push(payload);
        if (reject) throw new Error("SMTP temporarily unavailable");
        return { accepted: ["reader@example.com"], rejected: [] };
      },
    },
  });
  await new Promise((resolve) => app.server.listen(0, "127.0.0.1", resolve));
  t.after(() => app.close());
  const db = new DatabaseSync(config.database);
  t.after(() => db.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const response = await fetch(`${base}/v1/comments/messages?page=/`, {
    method: "POST",
    headers: { Origin: "https://hawks.tw", "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: randomUUID(),
      name: "讀者",
      body: "測試",
      email: "reader@example.com",
    }),
  });
  assert.equal(response.status, 201);
  await app.flushMail();
  assert.equal(
    db.prepare("SELECT status FROM mail_outbox").get().status,
    "pending",
  );
  reject = false;
  clock += 31_000;
  await app.flushMail();
  assert.equal(
    db.prepare("SELECT status FROM mail_outbox").get().status,
    "sent",
  );
  assert.equal(deliveries.length, 2);
  assert.equal(deliveries[0].messageId, deliveries[1].messageId);
  assert.equal(deliveries[0].date.getTime(), deliveries[1].date.getTime());
  assert.equal(
    db.prepare("SELECT payload FROM mail_outbox").get().payload,
    "{}",
  );
});
