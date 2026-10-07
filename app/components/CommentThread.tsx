import { Github, Reply } from "lucide-react";
import type { CommentMessage } from "../lib/comments-client";
import CommentFeedback from "./CommentFeedback";

export default function CommentThread({
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
            <CommentFeedback
              tone="success"
              title={message.replyTo === null ? "留言已送出" : "回覆已送出"}
            >
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
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] disabled:opacity-50"
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
