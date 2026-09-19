"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, Shuffle } from "lucide-react";
import {
  drawExploreItem,
  filterExploreItems,
  type ExploreItem,
  type ExploreKind,
} from "../lib/explore";
const labels = { post: "文章", talk: "近況", library: "作品評論" };
export default function ExploreClient({ items }: { items: ExploreItem[] }) {
  const [minutes, setMinutes] = useState(5);
  const [kind, setKind] = useState<ExploreKind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const candidates = filterExploreItems(items, minutes, kind);
  const selected = candidates.find((item) => item.id === selectedId);
  function reset() {
    setSelectedId(null);
    setSeen([]);
    setMessage("");
  }
  function draw() {
    const result = drawExploreItem(candidates, seen);
    if (!result.item) return;
    setSelectedId(result.item.id);
    setSeen(result.seen);
    setRecent(
      [result.item.id, ...recent.filter((id) => id !== result.item!.id)].slice(
        0,
        5,
      ),
    );
    setMessage(
      `${result.newRound ? "這一輪都抽過了，開始新的一輪。" : ""}這次是「${result.item.title}」，約 ${result.item.minutes} 分鐘。`,
    );
  }
  return (
    <div className="mt-9">
      <div className="grid gap-5 rounded-2xl border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.75)] p-5 sm:grid-cols-[1fr_12rem] sm:p-6">
        <fieldset>
          <legend className="mb-3 text-sm font-bold">你有多少時間？</legend>
          <div className="flex flex-wrap gap-2">
            {[
              [5, "5 分鐘"],
              [15, "15 分鐘"],
              [0, "慢慢讀"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${minutes === value ? "border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--accent)/0.08)] text-[rgb(var(--accent))]" : "border-[rgb(var(--line)/0.14)] text-[rgb(var(--muted))]"}`}
              >
                <input
                  type="radio"
                  name="reading-time"
                  checked={minutes === value}
                  onChange={() => {
                    setMinutes(Number(value));
                    reset();
                  }}
                  className="accent-[rgb(var(--accent))]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="text-sm font-bold">
          今天想讀什麼？
          <select
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as ExploreKind | "all");
              reset();
            }}
            className="mt-3 block h-11 w-full rounded-lg border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--bg))] px-3 font-normal"
          >
            <option value="all">都可以</option>
            <option value="post">文章</option>
            <option value="talk">近況</option>
            <option value="library">作品評論</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs leading-6 text-[rgb(var(--muted))]">
        有 {candidates.length}{" "}
        篇符合條件。同一輪不重複，換個條件重新挑；時間僅依正文文字估算。
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={draw}
          disabled={
            !candidates.length || (candidates.length === 1 && Boolean(selected))
          }
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[rgb(var(--accent))] px-5 font-bold text-[rgb(var(--accent-foreground))] disabled:opacity-45"
        >
          <Shuffle className="h-4 w-4" />
          {selected ? "再挑一篇" : "幫我挑一篇"}
        </button>
        {candidates.length === 1 && selected && (
          <span className="text-xs text-[rgb(var(--muted))]">
            這個條件目前只有這一篇。
          </span>
        )}
        <Link
          href="/search/"
          className="inline-flex min-h-11 items-center text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]"
        >
          有想找的內容？用搜尋 →
        </Link>
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
      {selected ? (
        <section
          aria-label="這次的閱讀提案"
          className="mt-7 rounded-2xl border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--panel)/0.9)] p-6 shadow-[0_16px_50px_rgba(90,76,55,0.08)] sm:p-9"
        >
          <p className="flex flex-wrap items-center gap-3 text-xs text-[rgb(var(--muted))]">
            <span className="font-bold text-[rgb(var(--accent))]">
              {labels[selected.kind]}
            </span>
            <time dateTime={selected.date}>{selected.date}</time>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />約 {selected.minutes} 分鐘
            </span>
          </p>
          <h2 className="mt-4 font-serif text-2xl font-bold leading-snug sm:text-3xl">
            {selected.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[rgb(var(--muted))]">
            {selected.summary}
          </p>
          <Link
            href={selected.href}
            className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-[rgb(var(--accent))]"
          >
            就讀這篇
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </section>
      ) : !candidates.length ? (
        <p className="mt-7 rounded-xl border border-dashed border-[rgb(var(--line)/0.2)] p-6 text-sm leading-7">
          這個時間內還沒有符合的內容。試試「慢慢讀」，或換一種內容。
        </p>
      ) : (
        <section className="mt-8" aria-label="也可以直接選一篇">
          <h2 className="text-sm font-bold">也可以直接選一篇</h2>
          <ul className="mt-3 divide-y divide-[rgb(var(--line)/0.12)]">
            {candidates.slice(0, 3).map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex min-h-16 items-center justify-between gap-4 py-3 hover:text-[rgb(var(--accent))]"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="shrink-0 text-xs text-[rgb(var(--muted))]">
                    約 {item.minutes} 分鐘
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {recent.length > 0 && (
        <details className="mt-7 border-t border-[rgb(var(--line)/0.12)] pt-4">
          <summary className="min-h-11 cursor-pointer text-sm text-[rgb(var(--muted))]">
            剛剛挑過的 {recent.length} 篇
          </summary>
          <ul className="space-y-3">
            {recent
              .map((id) => items.find((item) => item.id === id))
              .filter((item): item is ExploreItem => Boolean(item))
              .map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="block text-sm text-[rgb(var(--accent))] hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
          </ul>
        </details>
      )}
      <noscript>
        <p className="mt-4 text-sm">
          隨機挑選需要 JavaScript；你可以直接開啟上方的文章連結。
        </p>
      </noscript>
    </div>
  );
}
