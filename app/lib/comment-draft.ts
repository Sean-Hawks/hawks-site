import type { CommentMessage } from "./comments-client";

export type ReplyTarget = Pick<CommentMessage, "id" | "name" | "body">;
export type CommentDraft = {
  name: string;
  body: string;
  subscribe: boolean;
  email: string | null;
  replyTo: ReplyTarget | null;
  attempt: { fingerprint: string; id: string } | null;
};

// Drafts stay in this tab, including explicit notification choices. Login tokens
// never belong in a draft; retry fingerprints contain only a digest of the payload.
export function readCommentDraft(raw: string | null): CommentDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    if (typeof draft.body !== "string" || draft.body.length > 2000) return null;
    if (
      draft.name !== undefined &&
      (typeof draft.name !== "string" || draft.name.length > 48)
    )
      return null;
    if (
      draft.email !== undefined &&
      draft.email !== null &&
      (typeof draft.email !== "string" || draft.email.length > 254)
    )
      return null;
    const reply = draft.replyTo;
    if (
      reply !== null &&
      (!reply ||
        !Number.isSafeInteger(reply.id) ||
        reply.id < 1 ||
        typeof reply.name !== "string" ||
        reply.name.length > 48 ||
        typeof reply.body !== "string" ||
        reply.body.length > 2000)
    )
      return null;
    const attempt = draft.attempt;
    return {
      name: draft.name || "",
      body: draft.body,
      subscribe: draft.subscribe === true,
      email: draft.email ?? null,
      replyTo: reply
        ? { id: reply.id, name: reply.name, body: reply.body }
        : null,
      attempt:
        attempt &&
        /^[a-f0-9]{64}$/.test(attempt.fingerprint) &&
        /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(attempt.id)
          ? { fingerprint: attempt.fingerprint, id: attempt.id }
          : null,
    };
  } catch {
    return null;
  }
}
