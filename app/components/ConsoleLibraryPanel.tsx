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
        <dl className="library-summary">
          <div><dt>已評分</dt><dd><strong>{ratedCount}</strong><span> / {items.length} 件</span></dd></div>
          {averageRating !== null && <div><dt>平均個人評分</dt><dd><strong>{averageRating.toFixed(1)}</strong><span> / 10</span></dd></div>}
          {activeCount > 0 && <div><dt className="status-ok">● 進行中</dt><dd><strong>{activeCount}</strong><span> 件</span></dd></div>}
          {plannedCount > 0 && <div><dt>待補</dt><dd><strong>{plannedCount}</strong><span> 件</span></dd></div>}
        </dl>
      )}
      <div className="collection-filters" role="group" aria-label="依分類篩選收藏">
        <button className="collection-filter" type="button" aria-pressed={category === "all"} onClick={() => select("all")} aria-controls="console-library-picks"><span>全部</span><strong>{items.length}</strong></button>
        {collection.map(({ category: channel, count }) => (
          <button className="collection-filter" type="button" key={channel} aria-pressed={category === channel} aria-controls="console-library-picks" onClick={() => select(channel)}><span>{categories[channel]}</span><strong>{count}</strong></button>
        ))}
      </div>
      <div className="library-picks" id="console-library-picks" key={`${category}-${preview.page}`}>
        {preview.items.map((item) => (
          <Link href={item.href} key={item.id} className="library-pick">
            <div className="pick-image"><Image src={item.image.src} alt={item.image.alt || item.title} fill sizes="72px" className={item.image.fit === "contain" ? "object-contain" : "object-cover"} /></div>
            <div className="pick-content">
              <div className="pick-meta"><span>{categories[item.category]}</span><span className={item.status === "watching" || item.status === "playing" ? "status-ok" : "secondary"}>{statuses[item.status]}</span></div>
              <h3>{item.title}</h3>
              {item.rating !== null && <div className="pick-rating"><span className="sr-only">個人評分：</span><span className="rating-value"><strong>{item.rating.toFixed(1)}</strong><small> / 10</small></span></div>}
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
      <div className="panel-source">收藏目錄 · 平均分數依全部已評分紀錄計算 · 個人評分，滿分 10</div>
    </section>
  );
}
