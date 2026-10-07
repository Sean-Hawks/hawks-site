"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  readCommentDraft,
  type CommentDraft,
  type ReplyTarget,
} from "../lib/comment-draft";

export default function useCommentDraft(page: string) {
  const key = `hawks:comment-draft:${page}`;
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const attempt = useRef<CommentDraft["attempt"]>(null);
  const snapshot = useRef({ name, body, replyTo, subscribe, email });

  const save = useCallback(
    (draft: CommentDraft) => {
      try {
        if (draft.body || draft.replyTo || draft.attempt)
          sessionStorage.setItem(key, JSON.stringify(draft));
        else sessionStorage.removeItem(key);
      } catch {
        // Private browsing and full storage must not prevent a comment.
      }
    },
    [key],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const draft = readCommentDraft(sessionStorage.getItem(key));
        if (draft) {
          setBody(draft.body);
          setName(draft.name);
          setSubscribe(draft.subscribe);
          setEmail(draft.email);
          setReplyTo(draft.replyTo);
          attempt.current = draft.attempt;
          setRestored(Boolean(draft.body || draft.replyTo));
        } else setName(localStorage.getItem("hawks:comment-name") || "");
      } catch {
        // Saving a draft is optional.
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    snapshot.current = { name, body, replyTo, subscribe, email };
    const persist = () =>
      save({ ...snapshot.current, attempt: attempt.current });
    persist();
    window.addEventListener("pagehide", persist);
    return () => window.removeEventListener("pagehide", persist);
  }, [save, name, body, replyTo, subscribe, email, ready]);

  async function requestId(content: string) {
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(content),
    );
    const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, id: crypto.randomUUID() };
    save({ ...snapshot.current, attempt: attempt.current });
    return attempt.current.id;
  }

  function clear() {
    attempt.current = null;
    snapshot.current = { name, body: "", replyTo: null, subscribe, email };
    setBody("");
    setReplyTo(null);
    setRestored(false);
    save({ ...snapshot.current, attempt: null });
  }

  return {
    name,
    setName,
    body,
    setBody,
    replyTo,
    setReplyTo,
    subscribe,
    setSubscribe,
    email,
    setEmail,
    ready,
    restored,
    clear,
    requestId,
  };
}
