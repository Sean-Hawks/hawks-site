"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, RefreshCw, Reply, Send, X } from "lucide-react";
import CommentVerification from "./CommentVerification";
import {
  commentPageKey,
  commentsRequest,
  mergeComments,
  type CommentHistory,
  type CommentMessage,
} from "../lib/comments-client";

import { commentsConfig } from "../lib/comments-config";

const { apiOrigin: api, siteKey } = commentsConfig;
const fieldClass =
  "w-full rounded-lg border border-[rgb(var(--line)/0.18)] bg-[rgb(var(--bg)/0.6)] px-3 py-2.5 text-sm text-[rgb(var(--text))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]";

function CommentThread({
  message,
  childrenByParent,
  byId,
  onReply,
  depth = 0,
}: {
  message: CommentMessage;
  childrenByParent: Map<number, CommentMessage[]>;
  byId: Map<number, CommentMessage>;
  onReply: (message: CommentMessage) => void;
  depth?: number;
}) {
  return (
    <li id={`comment-${message.id}`} className="scroll-mt-24">
      <article className="border-b border-[rgb(var(--line)/0.10)] py-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent)/0.12)] text-sm font-bold text-[rgb(var(--accent))]"
          >
            {message.deleted ? "·" : [...message.name][0]}
          </span>
          <span className="break-all text-sm font-semibold">
            {message.deleted ? "留言已刪除" : message.name}
          </span>
          <time
            dateTime={message.createdAt}
            className="text-xs text-[rgb(var(--muted))]"
          >
            {new Date(message.createdAt).toLocaleString("zh-TW", {
              timeZone: "Asia/Taipei",
              hour12: false,
            })}
          </time>
          <span className="text-xs text-[rgb(var(--muted))]">
            #{message.id}
          </span>
        </div>
        {message.replyTo !== null && (
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            回覆{" "}
            <a
              className="underline underline-offset-4"
              href={`#comment-${message.replyTo}`}
            >
              #{message.replyTo}
              {byId.get(message.replyTo)
                ? ` · ${byId.get(message.replyTo)?.name}`
                : "（可載入更早留言）"}
            </a>
          </p>
        )}
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 [overflow-wrap:anywhere]">
          {message.deleted ? "這則留言已由管理員刪除。" : message.body}
        </p>
        {!message.deleted && (
          <button
            type="button"
            onClick={() => onReply(message)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]"
          >
            <Reply size={14} aria-hidden="true" />
            回覆
          </button>
        )}
      </article>
      {Boolean(childrenByParent.get(message.id)?.length) && (
        <ol
          className={
            depth < 3
              ? "ml-3 border-l border-[rgb(var(--line)/0.12)] pl-3 sm:ml-5 sm:pl-5"
              : ""
          }
        >
          {childrenByParent.get(message.id)?.map((child) => (
            <CommentThread
              key={child.id}
              message={child}
              childrenByParent={childrenByParent}
              byId={byId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

function PageComments({ page }: { page: string }) {
  const [messages, setMessages] = useState<CommentMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(Boolean(api));
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [notice, setNotice] = useState("");
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [replyTo, setReplyTo] = useState<CommentMessage | null>(null);
  const [token, setToken] = useState("");
  const [verificationRevision, setVerificationRevision] = useState(0);
  const pending = useRef<{ content: string; id: string } | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true);
  const loadInFlight = useRef(false);
  const sendInFlight = useRef(false);
  const endpoint = `${api}/v1/comments/messages?page=${encodeURIComponent(page)}`;
  const load = useCallback(
    async (before?: number) => {
      if (!api || loadInFlight.current || sendInFlight.current) return;
      loadInFlight.current = true;
      setLoading(true);
      setLoadError("");
      try {
        const data = await commentsRequest<CommentHistory>(
          `${api}/v1/comments/messages?page=${encodeURIComponent(page)}${before ? `&before=${before}` : ""}`,
        );
        if (!mounted.current) return;
        setMessages((current) =>
          before ? mergeComments(current, data.messages) : data.messages,
        );
        setHasMore(data.hasMore);
      } catch (error) {
        if (mounted.current)
          setLoadError(
            error instanceof Error &&
              error.name !== "TimeoutError" &&
              error.name !== "TypeError"
              ? error.message
              : "無法讀取留言，請稍後再試。",
          );
      } finally {
        loadInFlight.current = false;
        if (mounted.current) setLoading(false);
      }
    },
    [page],
  );
  useEffect(() => {
    mounted.current = true;
    const timer = window.setTimeout(() => {
      void load();
      try {
        setName(localStorage.getItem("hawks:comment-name") || "");
      } catch {
        /* Nickname storage is optional. */
      }
    }, 0);
    return () => {
      mounted.current = false;
      window.clearTimeout(timer);
    };
  }, [load]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !api ||
      loadInFlight.current ||
      sendInFlight.current ||
      !body.trim() ||
      (siteKey && !token)
    )
      return;
    sendInFlight.current = true;
    setSending(true);
    setSendError("");
    setNotice("");
    const payload = {
      name: name.trim() || "匿名",
      body: body.trim(),
      replyTo: replyTo?.id ?? null,
    };
    const content = JSON.stringify(payload);
    try {
      if (pending.current?.content !== content)
        pending.current = { content, id: crypto.randomUUID() };
      const data = await commentsRequest<{ message: CommentMessage }>(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            requestId: pending.current.id,
            token,
            website,
          }),
        },
      );
      if (!mounted.current) return;
      setMessages((current) => mergeComments(current, [data.message]));
      setBody("");
      setReplyTo(null);
      pending.current = null;
      setNotice("留言已送出。");
      try {
        localStorage.setItem("hawks:comment-name", name.trim());
      } catch {
        /* Keep sending available without storage. */
      }
    } catch (error) {
      if (mounted.current)
        setSendError(
          error instanceof Error &&
            error.name !== "TimeoutError" &&
            error.name !== "TypeError"
            ? error.message
            : "送出結果尚未確認，內容已保留，可重新驗證後再試。",
        );
    } finally {
      sendInFlight.current = false;
      if (mounted.current) {
        setSending(false);
        setToken("");
        setVerificationRevision((value) => value + 1);
      }
    }
  }
  function reply(message: CommentMessage) {
    setReplyTo(message);
    setNotice("");
    textarea.current?.focus();
  }
  const byId = new Map(messages.map((message) => [message.id, message]));
  const childrenByParent = new Map<number, CommentMessage[]>();
  const roots: CommentMessage[] = [];
  for (const message of messages) {
    if (message.replyTo !== null && byId.has(message.replyTo)) {
      const siblings = childrenByParent.get(message.replyTo) || [];
      siblings.push(message);
      childrenByParent.set(message.replyTo, siblings);
    } else roots.push(message);
  }
  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="home-panel mt-8 rounded-2xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.86)] p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-4">
        <h2
          id="comments-title"
          className="flex items-center gap-2 text-xl font-bold"
        >
          <MessageSquare size={20} aria-hidden="true" />
          留言區
        </h2>
        {api && (
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || sending}
            className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--muted))] disabled:opacity-50"
          >
            <RefreshCw size={14} aria-hidden="true" />
            重新整理
          </button>
        )}
      </div>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        有想法、問題或想打個招呼，都可以留在這裡。免登入，暱稱會公開顯示。
      </p>
      {!api ? (
        <p className="mt-5 text-sm text-[rgb(var(--muted))]">留言區準備中。</p>
      ) : (
        <>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="max-w-sm">
              <label htmlFor="comment-name" className="mb-1.5 block text-sm">
                顯示名稱{" "}
                <span className="text-xs text-[rgb(var(--muted))]">
                  選填，留空為匿名
                </span>
              </label>
              <input
                id="comment-name"
                autoComplete="nickname"
                maxLength={48}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={sending}
                className={fieldClass}
                placeholder="匿名"
                aria-describedby="comment-name-guidance"
              />
              <p
                id="comment-name-guidance"
                className="mt-1 text-xs text-[rgb(var(--muted))]"
              >
                最多 24 字。
              </p>
            </div>
            {replyTo && (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-[rgb(var(--accent)/0.25)] bg-[rgb(var(--accent)/0.06)] px-3 py-2 text-sm">
                <div>
                  <span className="font-semibold">
                    回覆 {replyTo.name} · #{replyTo.id}
                  </span>
                  <p className="mt-1 line-clamp-2 break-all text-xs text-[rgb(var(--muted))]">
                    {replyTo.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  disabled={sending}
                  aria-label="取消回覆"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div>
              <label htmlFor="comment-body" className="mb-1.5 block text-sm">
                留言
              </label>
              <textarea
                ref={textarea}
                id="comment-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                disabled={sending}
                rows={4}
                maxLength={2000}
                required
                aria-describedby="comment-guidance"
                className={`${fieldClass} resize-y`}
                placeholder="寫下你的想法…"
              />
              <p
                id="comment-guidance"
                className="mt-1.5 flex justify-between gap-3 text-xs text-[rgb(var(--muted))]"
              >
                <span>純文字，最多 1,000 字。請勿留下私密資料。</span>
                <span>{[...body].length} / 1,000</span>
              </p>
            </div>
            <div
              className="absolute h-px w-px overflow-hidden opacity-0"
              aria-hidden="true"
            >
              <label htmlFor="comment-website">Website</label>
              <input
                id="comment-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>
            {siteKey && (
              <CommentVerification
                siteKey={siteKey}
                revision={verificationRevision}
                onToken={setToken}
              />
            )}
            {sendError && (
              <p role="alert" className="text-sm text-[rgb(var(--purple))]">
                {sendError}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={
                  loading ||
                  sending ||
                  !body.trim() ||
                  [...body.trim()].length > 1000 ||
                  [...name.trim()].length > 24 ||
                  Boolean(siteKey && !token)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--accent-foreground))] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Send size={15} aria-hidden="true" />
                {sending ? "送出中…" : "送出留言"}
              </button>
              <span role="status" className="text-sm text-[rgb(var(--muted))]">
                {notice}
              </span>
            </div>
          </form>
          <div className="mt-6 border-t border-[rgb(var(--line)/0.12)] pt-5">
            {loading && (
              <p role="status" className="text-sm text-[rgb(var(--muted))]">
                讀取留言中…
              </p>
            )}
            {loadError && (
              <p role="alert" className="text-sm text-[rgb(var(--purple))]">
                {loadError}{" "}
                <button
                  type="button"
                  disabled={loading || sending}
                  className="underline underline-offset-4"
                  onClick={() => void load()}
                >
                  重試
                </button>
              </p>
            )}
            {!loading && !loadError && messages.length === 0 && (
              <p className="py-4 text-sm text-[rgb(var(--muted))]">
                還沒有留言，來留下第一則吧。
              </p>
            )}
            {hasMore && (
              <button
                type="button"
                disabled={loading || sending}
                onClick={() => void load(messages[0]?.id)}
                className="mb-3 text-sm text-[rgb(var(--accent))] disabled:opacity-50"
              >
                載入更早留言
              </button>
            )}
            <ol aria-label="留言與回覆">
              {roots.map((message) => (
                <CommentThread
                  key={message.id}
                  message={message}
                  childrenByParent={childrenByParent}
                  byId={byId}
                  onReply={reply}
                />
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}
export default function Comments() {
  const page = commentPageKey(usePathname());
  return <PageComments key={page} page={page} />;
}
