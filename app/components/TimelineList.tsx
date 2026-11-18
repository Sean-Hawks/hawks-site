"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import {
  timelineCategories,
  sortResumeItemsByDate,
  type ResumeItem,
  type TimelineCategory,
} from "../data/resume";

type TimelineFilter = "全部" | TimelineCategory;
const filters: TimelineFilter[] = ["全部", ...timelineCategories];
const unknownYear = "年份未記錄";

function yearAnchor(year: string) {
  return "timeline-year-" + (year === unknownYear ? "unknown" : year);
}

function byMonth(entries: ResumeItem[]) {
  const months = new Map<string, ResumeItem[]>();
  for (const item of entries) {
    const month = item.dateTime?.match(/^\d{4}-(0[1-9]|1[0-2])(?:-|$)/)?.[1] ?? "unknown";
    const existing = months.get(month);
    if (existing) existing.push(item);
    else months.set(month, [item]);
  }
  return [...months];
}

function TimelineEntry({ item, cue }: { item: ResumeItem; cue: TimelineFilter | null }) {
  const program = item.categories.includes("音樂發表") && item.title.startsWith("《");
  const format = item.cover ? "photo" : program ? "program" : "note";
  const [headline, ...subtitle] = format === "note" ? [item.title] : item.title.split("｜");

  return (
    <article className="timeline-entry" data-format={format}>
      <div className="timeline-entry-copy">
        <div className="timeline-entry-meta">
          {cue && <span aria-hidden="true" className="timeline-entry-cue"><span key={cue} className="timeline-filter-node print-hidden" /></span>}
          <time dateTime={item.dateTime}>{item.period}</time>
          <span className="timeline-entry-category">{item.categories.join(" · ")}</span>
        </div>
        <h5 aria-label={subtitle.length ? item.title : undefined}>
          <span className="timeline-entry-title" data-long={headline.length > 18 || undefined}>{headline}</span>
          {subtitle.length > 0 && <span className="timeline-entry-subtitle">{subtitle.join("｜")}</span>}
        </h5>
        {item.organization && <p className="timeline-entry-organization">{item.organization}</p>}
        <p className="timeline-entry-summary">{item.summary}</p>
        {item.links?.length ? (
          <div className="timeline-entry-links print-hidden">
            {item.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
              >
                {link.label}<ArrowUpRight size={14} aria-hidden="true" />
              </a>
            ))}
          </div>
        ) : null}
      </div>
      {item.cover && (
        <div className="timeline-entry-photo print-hidden">
          <Image src={item.cover.src} alt={item.cover.alt} fill sizes="(min-width: 1200px) 490px, (min-width: 600px) 46vw, calc(100vw - 48px)" />
        </div>
      )}
    </article>
  );
}

export default function TimelineList({ items }: { items: ResumeItem[] }) {
  const [selectedFilter, setSelectedFilter] = useState<TimelineFilter | null>(null);
  const [currentYear, setCurrentYear] = useState<string>();
  const archiveRef = useRef<HTMLElement>(null);
  const indexRef = useRef<HTMLElement>(null);
  const activeFilter = selectedFilter ?? "全部";
  const sorted = useMemo(() => sortResumeItemsByDate(items), [items]);
  const counts = useMemo(() => new Map(filters.map((filter) => [
    filter,
    filter === "全部" ? items.length : items.filter((item) => item.categories.includes(filter)).length,
  ])), [items]);

  const years = useMemo(() => {
    const grouped = new Map<string, ResumeItem[]>();
    for (const item of sorted) {
      if (activeFilter !== "全部" && !item.categories.includes(activeFilter)) continue;
      const year = item.dateTime?.match(/^\d{4}(?=-|$)/)?.[0] ?? unknownYear;
      const entries = grouped.get(year);
      if (entries) entries.push(item);
      else grouped.set(year, [item]);
    }
    return [...grouped];
  }, [activeFilter, sorted]);
  const firstYear = years[0]?.[0];
  const indexed = years.length > 1;

  useEffect(() => {
    const archive = archiveRef.current;
    if (!archive) return;
    const index = indexRef.current;
    const links = index?.querySelector<HTMLElement>(".timeline-year-links");
    const header = document.querySelector(".site-header");
    const headings = Array.from(archive.querySelectorAll<HTMLElement>(".timeline-year-heading h3"));
    let frame = 0;
    let readingLine = 0;
    let highlighted: string | undefined;

    const update = () => {
      frame = 0;
      let year = firstYear;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top > readingLine) break;
        year = heading.textContent ?? firstYear;
      }
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        const anchor = headings.find((heading) => "#" + heading.id === window.location.hash);
        const top = anchor?.getBoundingClientRect().top;
        const lastVisible = anchor && top !== undefined && top >= 0 && top < window.innerHeight ? anchor : headings.at(-1);
        year = lastVisible?.textContent ?? year;
      }
      if (year === highlighted) return;
      highlighted = year;
      setCurrentYear(year);

      if (!year || !links || links.scrollWidth <= links.clientWidth) return;
      const link = links.querySelector('a[href="#' + yearAnchor(year) + '"]');
      if (!link) return;
      const visible = links.getBoundingClientRect();
      const target = link.getBoundingClientRect();
      if (target.left < visible.left || target.right > visible.right) {
        links.scrollBy({ left: (target.left + target.right - visible.left - visible.right) / 2, behavior: "instant" });
      }
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const measure = () => {
      archive.style.setProperty("--timeline-header-height", (header?.getBoundingClientRect().height ?? 0) + "px");
      archive.style.setProperty("--timeline-index-height", (index?.getBoundingClientRect().height ?? 0) + "px");
      readingLine = (headings[0] ? Number.parseFloat(getComputedStyle(headings[0]).scrollMarginTop) || 0 : 0) + 8;
      schedule();
    };
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (header) resize?.observe(header);
    if (index) resize?.observe(index);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("hashchange", schedule);
    measure();

    return () => {
      window.cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.removeEventListener("hashchange", schedule);
    };
  }, [firstYear, years]);

  return (
    <section ref={archiveRef} className="timeline-archive" data-indexed={indexed || undefined} aria-labelledby="timeline-archive-heading">
      <h2 id="timeline-archive-heading" className="sr-only">完整經歷</h2>
      <noscript><style>{".timeline-filters { display: none; }"}</style></noscript>
      <div role="group" aria-label="篩選時間軸分類" className="timeline-filters print-hidden">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={filter === activeFilter}
            onClick={() => { if (filter !== activeFilter) setSelectedFilter(filter); }}
          >
            {filter}<span>{counts.get(filter)}</span>
          </button>
        ))}
      </div>

      <div className="timeline-archive-layout">
        {indexed && (
          <nav ref={indexRef} aria-label="跳到年份" className="timeline-year-nav print-hidden">
            <div className="timeline-year-links">
              {years.map(([year, entries]) => (
                <a
                  key={year}
                  href={"#" + yearAnchor(year)}
                  aria-current={currentYear === year ? "location" : undefined}
                >
                  {year}<span aria-hidden="true">{entries.length}</span>
                </a>
              ))}
            </div>
          </nav>
        )}
        <div className="timeline-years">
          {years.length === 0 && <p className="timeline-list-empty">這個分類目前沒有經歷。</p>}
          {years.map(([year, entries]) => {
            const anchor = yearAnchor(year);
            return (
              <section key={year} className="timeline-year" aria-labelledby={anchor}>
                <div className="timeline-year-heading">
                  <h3 id={anchor} tabIndex={-1}>{year}</h3>
                  <span>{entries.length} 筆</span>
                </div>
                {byMonth(entries).map(([month, records], position) => {
                  const cue = year === firstYear && position === 0 ? selectedFilter : null;
                  const monthAnchor = anchor + "-" + month;
                  return (
                    <section key={month} className="timeline-month" aria-labelledby={monthAnchor}>
                      <div className="timeline-month-heading">
                        <h4 id={monthAnchor} tabIndex={-1}>
                          {month === "unknown" ? "月份未記錄" : <><span>{month}</span> 月</>}
                        </h4>
                        {cue && <span aria-hidden="true" className="timeline-month-trace"><span key={cue} className="timeline-filter-trace print-hidden" /></span>}
                      </div>
                      <div className="timeline-month-stories">
                        {records.map((item, index) => (
                          <TimelineEntry key={item.period + "-" + item.title} item={item} cue={index === 0 ? cue : null} />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
