"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { LibraryCategory, LibraryItem } from "../data/library";
import { consoleLibraryPage } from "../lib/console-interactions";

export type ConsoleLibraryItem = Pick<LibraryItem, "id" | "title" | "category" | "status" | "rating" | "featured" | "featuredOrder"> & {
  href: string;
  image: Pick<LibraryItem["image"], "src" | "alt" | "fit">;
};
const categories = { anime: "動畫", movie: "電影", artist: "音樂", game: "遊戲" };
const statuses = { watched: "已看完", listened: "已聽過", watching: "● 觀看中", playing: "● 遊玩中", played: "已玩過", planned: "○ 待補", recommended: "推薦" };

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <span className="monitor-meter" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} / ${max} 件`}>
      {Array.from({ length: 24 }, (_, index) => (
        <span key={index} className={index < Math.round(value / max * 24) ? "meter-used" : undefined} aria-hidden="true">━</span>
      ))}
    </span>
  );
}

export default function ConsoleLibraryPanel({ items, collection, averageRating, ratedCount, activeCount, plannedCount }: {
  items: ConsoleLibraryItem[];
  collection: Array<{ category: LibraryCategory; count: number }>;
  averageRating: number | null;
  ratedCount: number;
  activeCount: number;
  plannedCount: number;
}) {
  const [category, setCategory] = useState<LibraryCategory | "all">("all");
  const [page, setPage] = useState(0);
  const preview = consoleLibraryPage(items, category, page);
  const label = category === "all" ? "全部分類" : categories[category];

  function select(next: LibraryCategory | "all") {
    setCategory(next);
    setPage(0);
  }

  return (
    <section id="console-library" className="home-library" aria-labelledby="library-title">
      <div className="panel-heading">
        <h2 id="library-title">喜歡的作品</h2>
        <Link href="/library/">全部收藏<ArrowUpRight size={13} aria-hidden="true" /></Link>
      </div>
      {items.length > 0 && (
        <>
          <div className="library-monitor">
            <div>
              <div className="monitor-heading">
                <span>評分紀錄</span><span><strong>{ratedCount}</strong><small> / {items.length} 件已評分</small></span>
              </div>
              <Meter value={ratedCount} max={items.length} label="收藏評分紀錄" />
            </div>
            <div className="monitor-status">
              {averageRating !== null && <span>平均個人評分<strong>{averageRating.toFixed(1)}</strong> / 10</span>}
              <span><span className={activeCount ? "status-ok" : "secondary"}>{activeCount ? "●" : "○"} 進行中</span><strong>{activeCount}</strong> 件</span>
              <span>○ 待補<strong>{plannedCount}</strong> 件</span>
            </div>
          </div>
          <div className="collection-distribution" role="group" aria-label="選擇收藏分類">
            {collection.map(({ category: channel, count }) => (
              <button type="button" key={channel} className="collection-channel" aria-pressed={category === channel} aria-controls="console-library-picks" onClick={() => select(category === channel ? "all" : channel)}>
                <span className="collection-channel-heading"><span>{category === channel ? "●" : "○"} {categories[channel]}</span><span><strong>{count}</strong> {channel === "artist" ? "位 / 組" : channel === "game" ? "款" : "部"}</span></span>
                <Meter value={count} max={items.length} label={`${categories[channel]}占全部收藏`} />
              </button>
            ))}
          </div>
        </>
      )}
      <div className="collection-selection-row">
        <button type="button" aria-pressed={category === "all"} onClick={() => select("all")} aria-controls="console-library-picks">全部分類</button>
        <span>點量表切換分類</span>
      </div>
      <div className="library-picks" id="console-library-picks" key={`${category}-${preview.page}`}>
        {preview.items.map((item) => (
          <Link href={item.href} key={item.id} className="library-pick">
            <div className="pick-image"><Image src={item.image.src} alt={item.image.alt || item.title} fill sizes="72px" className={item.image.fit === "contain" ? "object-contain" : "object-cover"} /></div>
            <div className="pick-content">
              <div className="pick-meta"><span>{categories[item.category]}</span><span className={item.status === "watching" || item.status === "playing" ? "status-ok" : "secondary"}>{statuses[item.status]}</span></div>
              <h3>{item.title}</h3>
              {item.rating !== null && <div className="pick-rating"><span className="rating-value"><strong>{item.rating.toFixed(1)}</strong><small> / 10</small></span><span className="rating-meter" aria-hidden="true"><span>{"━".repeat(Math.round(item.rating))}</span><span>{"━".repeat(10 - Math.round(item.rating))}</span></span></div>}
            </div>
          </Link>
        ))}
        {!preview.items.length && <p className="empty-copy">這個分類還沒有公開的收藏。</p>}
      </div>
      <div className="collection-pager">
        <p role="status" aria-live="polite" aria-atomic="true">{label} · {preview.total ? `${preview.from}–${preview.to} / ${preview.total} 件` : "0 件"}</p>
        <div>
          <button type="button" aria-label="上一組收藏" aria-controls="console-library-picks" disabled={preview.page === 0} onClick={() => setPage(preview.page - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>
          <button type="button" aria-label="下一組收藏" aria-controls="console-library-picks" disabled={preview.page >= preview.pageCount - 1} onClick={() => setPage(preview.page + 1)}><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="panel-source">收藏目錄 · 分類量表與平均評分依全部紀錄計算 · 滿分 10</div>
    </section>
  );
}
