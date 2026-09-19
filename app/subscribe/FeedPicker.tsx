"use client";
import { useState } from "react";
import { Copy, Rss, ArrowUpRight } from "lucide-react";
import { feedChannels, type FeedChannel } from "../lib/feed-channels";

export default function FeedPicker({
  counts,
}: {
  counts: Record<FeedChannel, number>;
}) {
  const [channel, setChannel] = useState<FeedChannel>("all");
  const [message, setMessage] = useState("");
  const selected = feedChannels.find((feed) => feed.id === channel)!;
  const url = `https://hawks.tw${selected.path}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("已複製訂閱網址");
    } catch {
      setMessage("無法自動複製，請選取下方網址後複製。");
    }
  }
  return (
    <div className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Rss className="h-5 w-5 text-[rgb(var(--accent))]" />
        選擇想收到的內容
      </h2>
      <fieldset className="mt-4 grid grid-cols-2 gap-2">
        <legend className="sr-only">RSS 訂閱分類</legend>
        {feedChannels.map((feed) => (
          <label
            key={feed.id}
            className={`cursor-pointer rounded-xl border p-3 ${channel === feed.id ? "border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--accent)/0.08)]" : "border-[rgb(var(--line)/0.12)]"}`}
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <input
                type="radio"
                name="feed"
                value={feed.id}
                checked={channel === feed.id}
                onChange={() => {
                  setChannel(feed.id);
                  setMessage("");
                }}
                className="accent-[rgb(var(--accent))]"
              />
              {feed.title}
            </span>
            <span className="mt-1 block text-xs leading-5 text-[rgb(var(--muted))]">
              {feed.description}
            </span>
          </label>
        ))}
      </fieldset>
      <p className="mt-4 text-xs text-[rgb(var(--muted))]">
        目前 {counts[channel]} 筆公開內容；訂閱提供最近{" "}
        {Math.min(50, counts[channel])} 筆。
      </p>
      <label className="mt-3 block text-xs font-bold" htmlFor="feed-url">
        訂閱網址
      </label>
      <input
        id="feed-url"
        readOnly
        value={url}
        onFocus={(event) => event.currentTarget.select()}
        className="mt-1 w-full rounded-lg border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel))] p-2 font-mono text-xs"
      />
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-3 font-bold text-[rgb(var(--accent-foreground))]"
        >
          <Copy className="h-4 w-4" />
          複製網址
        </button>
        <a
          href={selected.path}
          className="inline-flex min-h-11 items-center gap-1 text-[rgb(var(--accent))]"
        >
          預覽 RSS
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
      <p
        role="status"
        className="min-h-6 py-1 text-xs text-[rgb(var(--muted))]"
      >
        {message}
      </p>
      <div className="flex flex-wrap gap-4 text-xs text-[rgb(var(--muted))]">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://feedly.com/i/subscription/feed/${encodeURIComponent(url)}`}
        >
          加入 Feedly ↗
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={`https://www.inoreader.com/search/feeds/${encodeURIComponent(url)}`}
        >
          加入 Inoreader ↗
        </a>
      </div>
      <noscript>
        <p className="mt-3 text-sm">分類訂閱網址：</p>
        {feedChannels.slice(1).map((feed) => (
          <a key={feed.id} href={feed.path} className="mr-3 underline">
            {feed.title}
          </a>
        ))}
      </noscript>
    </div>
  );
}
