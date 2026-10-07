"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, CheckCircle2, Github, Loader2, RefreshCw, Reply, Send, X } from "lucide-react";
import CommentVerification from "./CommentVerification";
import useCommentIdentity from "./useCommentIdentity";
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
  "w-full border border-[rgb(var(--line)/0.22)] bg-[rgb(var(--panel)/0.65)] px-4 py-3.5 text-base text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--accent))]";

function CommentFeedback({
  tone,
  title,
  children,
}: {
  tone: "success" | "error" | "pending";
  title: string;
  children?: React.ReactNode;
}) {
  const Icon = tone === "error" ? AlertCircle : tone === "pending" ? Loader2 : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-atomic="true"
      className={`flex items-start gap-3 border px-4 py-3 text-sm leading-6 ${
        tone === "error"
          ? "border-[rgb(var(--purple)/0.5)] bg-[rgb(var(--purple)/0.08)]"
          : "border-[rgb(var(--accent)/0.4)] bg-[rgb(var(--accent)/0.08)]"
      }`}
    >
      <Icon
        size={20}
        aria-hidden="true"
        className={`mt-0.5 shrink-0 ${tone === "pending" ? "animate-spin motion-reduce:animate-none" : ""}`}
      />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-[rgb(var(--muted))]">{children}</div>}
      </div>
    </div>
  );
}

function CommentThread({
  message,
  childrenByParent,
  byId,
  onReply,
  sent,
  busy,
  depth = 0,
}: {
  message: CommentMessage;
  childrenByParent: Map<number, CommentMessage[]>;
  byId: Map<number, CommentMessage>;
  onReply: (message: CommentMessage) => void;
  sent: { id: number; notice: string } | null;
  busy: boolean;
  depth?: number;
}) {
  return (
    <li
      id={`comment-${message.id}`}
      tabIndex={-1}
      className="scroll-mt-24 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--accent))]"
    >
      <article className="border-b border-[rgb(var(--line)/0.10)] py-5">
        {sent?.id === message.id && (
          <div className="mb-4">
            <CommentFeedback tone="success" title="已新增這則留言">
              {sent.notice}
            </CommentFeedback>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {message.githubId && !message.deleted ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://avatars.githubusercontent.com/u/${message.githubId}?v=4&s=64`}
              alt=""
              width={32}
              height={32}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--accent)/0.12)] text-sm font-bold text-[rgb(var(--accent))]"
            >
              {message.deleted ? "·" : [...message.name][0]}
            </span>
          )}
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
          {message.githubLogin && !message.deleted && (
            <a
              href={`https://github.com/${message.githubLogin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[rgb(var(--accent))]"
              aria-label={`GitHub 已驗證帳號 ${message.githubLogin}`}
            >
              <Github size={13} aria-hidden="true" />@{message.githubLogin}
            </a>
          )}
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
            disabled={busy}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] disabled:opacity-50"
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
              sent={sent}
              busy={busy}
              depth={depth + 1}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

function PageComments({ page }: { page: string }) {
  const identity = useCommentIdentity(api);
  const [messages, setMessages] = useState<CommentMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(Boolean(api));
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [sendError, setSendError] = useState("");
  const [sent, setSent] = useState<{ id: number; notice: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [subscribe, setSubscribe] = useState(false);
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
  const emailValue = email ?? identity.notificationEmail;
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

  useEffect(() => {
    if (!sent) return;
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(`comment-${sent.id}`);
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [sent]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !api ||
      loadInFlight.current ||
      sendInFlight.current ||
      identity.pending ||
      identity.signingOut ||
      identity.removingEmail ||
      (subscribe && !emailValue.trim()) ||
      !body.trim() ||
      (siteKey && !token)
    )
      return;
    sendInFlight.current = true;
    setSending(true);
    setSendError("");
    setSent(null);
    const payload = {
      name: name.trim() || identity.user?.name || "匿名",
      body: body.trim(),
      replyTo: replyTo?.id ?? null,
      email: subscribe ? emailValue.trim() : "",
    };
    const content = JSON.stringify({
      ...payload,
      githubId: identity.user?.githubId ?? null,
    });
    try {
      if (pending.current?.content !== content)
        pending.current = { content, id: crypto.randomUUID() };
      const data = await commentsRequest<{
        message: CommentMessage;
        notice?: string;
      }>(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(identity.token
            ? { Authorization: `Bearer ${identity.token}` }
            : {}),
        },
        body: JSON.stringify({
          ...payload,
          requestId: pending.current.id,
          token,
          website,
        }),
      });
      if (!mounted.current) return;
      setMessages((current) => mergeComments(current, [data.message]));
      setBody("");
      setReplyTo(null);
      pending.current = null;
      setSent({ id: data.message.id, notice: data.notice || "留言已送出。" });
      try {
        localStorage.setItem("hawks:comment-name", name.trim());
      } catch {
        /* Keep sending available without storage. */
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("登入已到期"))
        identity.invalidate();
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
    setSent(null);
    setSendError("");
    textarea.current?.focus();
  }
  const byId = new Map(messages.map((message) => [message.id, message]));
  const childrenByParent = new Map<number, CommentMessage[]>();
  const roots: CommentMessage[] = [];
  const submitGuidance =
    loading ? "正在讀取留言，完成後即可送出。" :
    identity.pending ? "請完成 GitHub 登入，或取消登入後匿名留言。" :
    identity.signingOut ? "正在登出，完成後即可匿名留言。" :
    identity.removingEmail ? "正在移除通知信箱，完成後即可送出。" :
    subscribe && !emailValue.trim() ? "請填寫接收回覆通知的 Email，或取消勾選通知。" :
    [...name.trim()].length > 24 ? "顯示名稱超過 24 字，請縮短後再送出。" :
    [...body.trim()].length > 1000 ? "留言超過 1,000 字，請縮短後再送出。" :
    !body.trim() ? "寫下留言後即可送出；名稱選填，回覆通知可自行開啟。" :
    siteKey && !token ? "請先完成安全驗證，即可送出留言。" : "";
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
      className="comments-panel relative mt-10 border-y border-[rgb(var(--line)/0.14)] px-5 py-8 sm:px-8 sm:py-12"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-sm tracking-widest text-[rgb(var(--muted))]">
            留言
          </p>
          <h2
            id="comments-title"
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            留言區
          </h2>
        </div>
        {api &&
          (identity.user ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <Github size={17} aria-hidden="true" />@
                {identity.user.githubLogin}
              </span>
              <button
                type="button"
                disabled={sending || identity.signingOut || identity.removingEmail}
                onClick={() => void identity.logout()}
                className="border border-[rgb(var(--accent)/0.7)] px-4 py-2 disabled:opacity-50"
              >
                {identity.signingOut ? "登出中…" : "登出，改用匿名"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void identity.login()}
              disabled={
                sending || identity.pending || !identity.features?.githubEnabled
              }
              className="inline-flex items-center gap-2 border border-[rgb(var(--accent)/0.75)] bg-[rgb(var(--bg)/0.7)] px-4 py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
            >
              {identity.pending ? (
                <Loader2 size={19} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
              ) : <Github size={19} aria-hidden="true" />}
              {identity.pending ? "等待 GitHub 授權…" :
                !identity.features && !identity.error ? "讀取登入設定…" : "GitHub 登入"}
            </button>
          ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[rgb(var(--muted))]">
          可匿名留言，或使用 GitHub 帳號顯示已驗證身分。
        </p>
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
      {api && identity.features && !identity.features.githubEnabled && (
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          GitHub 登入暫時無法使用，仍可匿名留言。
        </p>
      )}
      {identity.pending && (
        <div className="mt-4">
          <CommentFeedback tone="pending" title="正在等待 GitHub 授權">
            <p>請在登入視窗完成授權，這裡會自動更新登入狀態。</p>
            <p>若已關閉登入視窗，可取消後再試。</p>
            <button type="button" onClick={identity.cancel} className="mt-2 underline underline-offset-4">
              取消登入，改用匿名
            </button>
          </CommentFeedback>
        </div>
      )}
      {identity.error && (
        <div className="mt-4">
          <CommentFeedback tone="error" title="帳號操作未完成">
            <p>{identity.error}</p>
            {!identity.features && (
              <button type="button" onClick={identity.retryConfig} className="mt-2 underline underline-offset-4">
                重新讀取登入與通知設定
              </button>
            )}
          </CommentFeedback>
        </div>
      )}
      {identity.notice && (
        <div className="mt-4">
          <CommentFeedback tone="success" title={identity.noticeTitle}>
            {identity.notice}
          </CommentFeedback>
        </div>
      )}
      {!api ? (
        <p className="mt-5 text-sm text-[rgb(var(--muted))]">留言區準備中。</p>
      ) : (
        <>
          <form onSubmit={submit} aria-busy={sending} className="mt-8 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="comment-name" className="mb-1.5 block text-sm">
                  顯示名稱{" "}
                  <span className="text-xs text-[rgb(var(--muted))]">
                    {identity.user
                      ? "選填，留空使用帳號名稱"
                      : "選填，留空為匿名"}
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
                  placeholder={identity.user?.name || "匿名"}
                  aria-describedby="comment-name-guidance"
                  aria-invalid={[...name.trim()].length > 24}
                />
                <p
                  id="comment-name-guidance"
                  className="mt-1 text-xs text-[rgb(var(--muted))]"
                >
                  最多 24 字。
                </p>
              </div>
              <div>
                <label htmlFor="comment-subscribe" className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    id="comment-subscribe"
                    type="checkbox"
                    checked={subscribe}
                    onChange={(event) => setSubscribe(event.target.checked)}
                    disabled={sending || identity.removingEmail || !identity.features?.emailEnabled}
                    className="h-4 w-4 accent-[rgb(var(--accent))]"
                    aria-describedby="comment-email-guidance"
                  />
                  接收此討論串的回覆通知
                </label>
                {subscribe && <>
                  <label htmlFor="comment-email" className="mb-1.5 mt-2 block text-sm">通知信箱</label>
                  <input
                  id="comment-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={emailValue}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={sending || identity.removingEmail}
                  required
                  className={fieldClass}
                  placeholder="你的 Email，不會公開"
                  aria-describedby="comment-email-guidance"
                />
                </>}
                <p
                  id="comment-email-guidance"
                  className="mt-1.5 text-xs leading-5 text-[rgb(var(--muted))]"
                >
                  {identity.features?.emailEnabled
                    ? !subscribe ? "不勾選就不寄信；仍可正常留言。"
                      : identity.notificationEmail && emailValue.trim().toLowerCase() === identity.notificationEmail
                        ? "使用帳號已驗證的信箱，送出後即訂閱，不必再收確認信。"
                        : identity.user
                          ? "第一次需收信確認；同一 GitHub 帳號之後訂閱其他討論串不必再驗證。"
                          : "匿名訂閱需收信確認；登入 GitHub 可在驗證一次後沿用通知信箱。"
                    : "回覆通知暫時無法使用，留空仍可送出留言。"}
                </p>
                {identity.notificationEmail && (
                  <details className="mt-3 text-xs text-[rgb(var(--muted))]">
                    <summary className="min-h-8 cursor-pointer">管理通知信箱</summary>
                    <p className="mt-2 break-all">已驗證：{identity.notificationEmail}</p>
                    <p className="mt-1">移除後會取消這個 GitHub 帳號的所有討論串通知。</p>
                    <button
                      type="button"
                      disabled={sending || identity.signingOut || identity.removingEmail}
                      onClick={async () => {
                        if (await identity.unlinkEmail()) {
                          setSubscribe(false);
                          setEmail(null);
                        }
                      }}
                      className="mt-2 min-h-11 underline underline-offset-4 disabled:opacity-50"
                    >
                      {identity.removingEmail ? "移除中…" : "移除信箱並取消所有通知"}
                    </button>
                  </details>
                )}
              </div>
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
                rows={6}
                maxLength={2000}
                required
                aria-describedby="comment-guidance"
                aria-invalid={[...body.trim()].length > 1000}
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
              <div>
                <p className="mb-3 text-sm">安全驗證</p>
                <CommentVerification
                  siteKey={siteKey}
                  revision={verificationRevision}
                  onToken={setToken}
                />
              </div>
            )}
            {sendError && (
              <CommentFeedback tone="error" title="留言尚未確認送出">
                <p>{sendError}</p>
                <p className="mt-1">內容已保留，請依提示處理後再按送出。</p>
              </CommentFeedback>
            )}
            {sending && (
              <CommentFeedback tone="pending" title="正在送出留言">
                請稍候，確認結果後會顯示你的留言。
              </CommentFeedback>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={
                  loading ||
                  sending ||
                  identity.pending ||
                  identity.signingOut ||
                  identity.removingEmail ||
                  (subscribe && !emailValue.trim()) ||
                  !body.trim() ||
                  [...body.trim()].length > 1000 ||
                  [...name.trim()].length > 24 ||
                  Boolean(siteKey && !token)
                }
                aria-describedby="comment-submit-guidance"
                className="inline-flex items-center gap-2 border border-[rgb(var(--accent)/0.75)] bg-[rgb(var(--bg)/0.7)] px-5 py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                {sending ? <Loader2 size={15} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Send size={15} aria-hidden="true" />}
                {sending ? "送出中…" : "送出留言"}
              </button>
            </div>
            <p id="comment-submit-guidance" className="text-sm text-[rgb(var(--muted))]">
              {sending ? "" : submitGuidance}
            </p>
          </form>
          <div className="mt-6 border-t border-[rgb(var(--line)/0.12)] pt-5">
            {loading && (
              <p role="status" className="text-sm text-[rgb(var(--muted))]">
                讀取留言中…
              </p>
            )}
            {loadError && (
              <CommentFeedback tone="error" title="無法讀取留言">
                <p>{loadError}</p>
                <button
                  type="button"
                  disabled={loading || sending}
                  className="mt-2 underline underline-offset-4"
                  onClick={() => void load()}
                >
                  重新讀取留言
                </button>
              </CommentFeedback>
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
                  sent={sent}
                  busy={sending}
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
