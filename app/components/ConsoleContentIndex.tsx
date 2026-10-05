"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LibraryCategory } from "../data/library";

type Metric = { label: string; value: number; unit: string; href: string };
type Track = { left: number; top: number; width: number; height: number };
type Collection = Array<{ category: LibraryCategory; count: number }>;
const labels = { anime: "動畫", movie: "電影", artist: "音樂", game: "遊戲" };

function CollectionDial({ collection }: { collection: Collection }) {
  const total = collection.reduce((sum, item) => sum + item.count, 0);
  if (!total) return null;
  return (
    <svg className="index-collection-dial" viewBox="0 0 96 96" role="img" aria-labelledby="index-dial-title index-dial-description">
      <title id="index-dial-title">收藏分類占比</title>
      <desc id="index-dial-description">{collection.map((item) => `${labels[item.category]} ${item.count} 件`).join("；")}</desc>
      {collection.map((item, categoryIndex) => {
        const from = collection.slice(0, categoryIndex).reduce((sum, previous) => sum + previous.count, 0);
        const first = Math.round(from / total * 48);
        const end = Math.round((from + item.count) / total * 48);
        return (
          <g key={item.category}>
            <title>{`${labels[item.category]} · ${item.count} 件`}</title>
            {Array.from({ length: Math.max(0, end - first - 1) }, (_, index) => {
              const angle = ((first + index) / 48 * 360 - 90) * Math.PI / 180;
              return <circle key={index} cx={48 + Math.cos(angle) * 40} cy={48 + Math.sin(angle) * 40} r="1.5" />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

export default function ConsoleContentIndex({ metrics, collection }: { metrics: Metric[]; collection: Collection }) {
  const nav = useRef<HTMLElement>(null);
  const active = useRef<HTMLAnchorElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const measure = useCallback((link: HTMLAnchorElement) => {
    if (!nav.current) return;
    const parent = nav.current.getBoundingClientRect();
    const bounds = link.getBoundingClientRect();
    setTrack({
      left: bounds.left - parent.left - nav.current.clientLeft,
      top: bounds.top - parent.top - nav.current.clientTop,
      width: bounds.width,
      height: bounds.height,
    });
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => { if (active.current) measure(active.current); });
    if (nav.current) observer.observe(nav.current);
    return () => observer.disconnect();
  }, [measure]);

  function show(link: HTMLAnchorElement) {
    active.current = link;
    measure(link);
  }
  function restoreFocus() {
    const focused = document.activeElement;
    if (focused instanceof HTMLAnchorElement && nav.current?.contains(focused)) {
      show(focused);
    } else {
      active.current = null;
      setTrack(null);
    }
  }

  return (
    <nav
      ref={nav}
      className="content-index content-index-mechanical"
      aria-label="站內內容索引"
      onPointerLeave={restoreFocus}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          active.current = null;
          setTrack(null);
        }
      }}
    >
      <div className="console-title-row"><h2>內容總覽</h2><span>站內索引</span></div>
      {metrics.map((metric) => (
        <Link key={metric.label} href={metric.href} onFocus={(event) => show(event.currentTarget)} onPointerEnter={(event) => { if (event.pointerType === "mouse") show(event.currentTarget); }}>
          <span className="index-label">{metric.label}</span>
          <span className="index-value">
            <span className={metric.label === "收藏" && metric.value ? "index-readout index-readout-dial" : "index-readout"}>
              {metric.label === "收藏" && metric.value > 0 && <CollectionDial collection={collection} />}
              <span>{metric.value}</span>
            </span>
            <small>{metric.unit}</small>
          </span>
          <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      ))}
      <div className="index-tracking-frame" aria-hidden="true" data-visible={Boolean(track)} style={track ?? undefined} />
      <div className="panel-source">文章 / 近況 / 收藏 / 專案目錄</div>
    </nav>
  );
}
