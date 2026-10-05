"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Metric = { label: string; value: number; unit: string; href: string };
type Track = { left: number; top: number; width: number; height: number };
export default function ConsoleContentIndex({ metrics }: { metrics: Metric[] }) {
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
            <span>{metric.value}</span>
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
