"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Shuffle } from "lucide-react";
import { drawExploreItem, type ExploreItem } from "../lib/explore";
import type { consoleStatistics } from "../lib/console-stats";

const labels = { post: "文章", talk: "近況", library: "作品評論" };

export default function ConsoleReadingInventory({ summary, items }: {
  summary: ReturnType<typeof consoleStatistics>["reading"];
  items: ExploreItem[];
}) {
  const [draw, setDraw] = useState<{ id?: string; seen: string[]; newRound: boolean }>({ seen: [], newRound: false });
  const candidates = items.filter((item) => item.minutes <= 5);
  const selected = candidates.find((item) => item.id === draw.id);
  if (!summary.count) return null;

  function pick() {
    const result = drawExploreItem(candidates, draw.seen);
    setDraw({ id: result.item?.id, seen: result.seen, newRound: result.newRound });
  }

  return (
    <section className="reading-inventory" aria-labelledby="inventory-title">
      <div className="console-title-row">
        <h2 id="inventory-title">閱讀存量</h2><span>{summary.count} 篇正文</span>
      </div>
      <div className="inventory-body">
        <p className="inventory-label">全部讀完，預估需要</p>
        <div className="inventory-total"><strong>{summary.minutes}</strong><small>分鐘</small></div>
        <dl className="inventory-breakdown">
          {summary.breakdown.map((item) => (
            <div key={item.kind}><dt>{labels[item.kind]}</dt><dd><strong>{item.minutes}</strong> 分鐘</dd></div>
          ))}
        </dl>
        <Link href="/explore/" className="inventory-short-link">
          <span>五分鐘內可讀完 <strong>{summary.shortCount}</strong> 篇</span>
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
        <button type="button" className="console-draw-button" onClick={pick} disabled={!candidates.length} aria-controls="inventory-draw-result">
          <Shuffle size={16} aria-hidden="true" />
          {candidates.length ? selected ? "再抽一篇" : "抽一篇短讀" : "暫無五分鐘內的文章"}
        </button>
        <div id="inventory-draw-result" aria-live="polite" aria-atomic="true">
          {selected && (
            <div className="inventory-draw-card" key={selected.id}>
              <div className="inventory-draw-meta"><span>{labels[selected.kind]} · 約 {selected.minutes} 分鐘</span><time dateTime={selected.date}>{selected.date}</time></div>
              <Link href={selected.href}><span>{selected.title}</span><ArrowUpRight size={16} aria-hidden="true" /></Link>
              <p>{draw.newRound ? "這一輪都抽過了，開始新的一輪。" : "同一輪不重複，點標題就能開始讀。"}</p>
            </div>
          )}
        </div>
      </div>
      <div className="panel-source">公開正文 · 依文字估算，圖片與程式碼不計</div>
    </section>
  );
}
