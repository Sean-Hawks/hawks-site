import { createHash } from "node:crypto";
import nodemailer from "nodemailer";

export function createMailDelivery({ config, fetchImpl, smtpTransport }) {
  const smtp = config.mailTransport === "smtp";
  const enabled = Boolean(config.mailFrom && (smtp || config.resendApiKey));
  const transport =
    enabled && smtp
      ? smtpTransport ||
        nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          localAddress: config.smtpLocalAddress,
          name: new URL(config.siteOrigin).hostname,
          // This transport is restricted to loopback by readConfig. Postfix
          // handles TLS when delivering to the recipient's external MX.
          ignoreTLS: true,
          connectionTimeout: 4000,
          greetingTimeout: 4000,
          socketTimeout: 8000,
          disableFileAccess: true,
          disableUrlAccess: true,
          maxRecipients: 1,
          logger: false,
          debug: false,
        })
      : null;
  async function send(payload, key, createdAt) {
    if (!enabled) throw new Error("mail disabled");
    if (smtp) {
      const messageId = createHash("sha256").update(key).digest("hex");
      const domain = new URL(config.siteOrigin).hostname;
      const result = await transport.sendMail({
        from: payload.from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        headers: payload.headers,
        messageId: `<${messageId}@${domain}>`,
        date: new Date(createdAt),
      });
      if (result.accepted?.length !== 1 || result.rejected?.length)
        throw new Error("mail not accepted");
      return;
    }
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("mail unavailable");
  }
  return { enabled, send, close: () => transport?.close?.() };
}
