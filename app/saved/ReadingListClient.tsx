"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { BookOpen, Check, Trash2, Undo2 } from "lucide-react";
import { useReadingList, updateReadingList } from "../lib/reading-store";
import type { ReadingEntry } from "../lib/reading-list";
import type { ReadingItem } from "../lib/reading-catalog";
export default function ReadingListClient({
  catalog,
}: {
  catalog: ReadingItem[];
}) {
  const { entries, persistent, ready } = useReadingList();
  const [filter, setFilter] = useState("unread");
  const [message, setMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);
  function announce(text: string) {
    setMessage(text);
    statusRef.current?.focus();
  }
  const [removed, setRemoved] = useState<ReadingEntry | null>(null);
  const rows = entries
    .map((entry) => ({
      entry,
      item: catalog.find((item) => item.id === entry.id),
    }))
    .sort((a, b) => b.entry.savedAt - a.entry.savedAt);
  const shown = rows.filter(
    ({ entry }) =>
      filter === "all" ||
      (filter === "read" ? entry.readAt !== null : entry.readAt === null),
  );
  const unread = rows.filter(({ entry }) => entry.readAt === null).length;
  const buttonClass =
    "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-[rgb(var(--muted))] hover:bg-[rgb(var(--line)/0.06)]";
  if (!ready)
    return (
      <p role="status" className="mt-8 text-sm text-[rgb(var(--muted))]">
        正在讀取此瀏覽器的清單…
      </p>
    );
  return (
    <section className="mt-8" aria-label="我的閱讀清單">
      {!persistent && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-[rgb(var(--accent)/0.3)] p-3 text-sm"
        >
          目前無法儲存在瀏覽器；清單只暫存於這次瀏覽，重新整理後可能消失。
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 border-b border-[rgb(var(--line)/0.12)] pb-4">
        {[
          ["unread", `未讀 ${unread}`],
          ["read", `已讀 ${rows.length - unread}`],
          ["all", `全部 ${rows.length}`],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`min-h-11 rounded-lg px-4 text-sm ${filter === value ? "bg-[rgb(var(--accent))] font-bold text-[rgb(var(--accent-foreground))]" : "bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="mt-3 text-sm text-[rgb(var(--muted))]"
      >
        {message}
      </div>
      {removed && (
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            const result = updateReadingList({
              type: "restore",
              entry: removed,
            });
            announce(result.message || "已復原移除的項目");
            if (result.applied) setRemoved(null);
          }}
        >
          <Undo2 className="h-4 w-4" />
          復原移除
        </button>
      )}
      {shown.length ? (
        <ul className="mt-4 space-y-3">
          {shown.map(({ entry, item }) => (
            <li
              key={entry.id}
              className="rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel)/0.8)] p-5"
            >
              {item ? (
                <>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {item.kind} · <time dateTime={item.date}>{item.date}</time>
                  </p>
                  <Link
                    href={item.href}
                    className="mt-2 block font-serif text-xl font-bold leading-snug hover:text-[rgb(var(--accent))]"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    {item.summary}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">
                  這篇內容目前不公開或已移除。你可以將它移出清單。
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    announce(
                      updateReadingList({
                        type: entry.readAt === null ? "read" : "unread",
                        id: entry.id,
                      }).message ||
                        (entry.readAt === null ? "已標為已讀" : "已標為未讀"),
                    )
                  }
                >
                  {entry.readAt === null ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                  {entry.readAt === null ? "標為已讀" : "標為未讀"}
                </button>
                <button
                  type="button"
                  aria-label={`移除${item ? `：${item.title}` : "已下架內容"}`}
                  className={buttonClass}
                  onClick={() => {
                    announce(
                      updateReadingList({ type: "remove", id: entry.id })
                        .message || "已移除，可按「復原移除」找回。",
                    );
                    setRemoved(entry);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  移除
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="my-10 rounded-xl border border-dashed border-[rgb(var(--line)/0.2)] p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-7 w-7 text-[rgb(var(--accent))]" />
          <h2 className="font-bold">
            {rows.length === 0
              ? "還沒有收藏，先找一篇喜歡的"
              : filter === "unread"
                ? "清單裡的內容都讀完了"
                : "這個分類目前沒有內容"}
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-[rgb(var(--accent))]">
            <Link href="/blog/">逛逛 Blog →</Link>
            <Link href="/search/">搜尋內容 →</Link>
          </div>
        </div>
      )}
    </section>
  );
}
