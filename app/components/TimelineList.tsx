"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  timelineCategories,
  type ResumeItem,
  type TimelineCategory,
} from "../data/resume";

type TimelineFilter = "全部" | TimelineCategory;

export default function TimelineList({ items }: { items: ResumeItem[] }) {
  const [activeFilter, setActiveFilter] = useState<TimelineFilter>("全部");
  const filters: TimelineFilter[] = ["全部", ...timelineCategories];

  const counts = useMemo(() => {
    const categoryCounts = Object.fromEntries(
      timelineCategories.map((category) => [
        category,
        items.filter((item) => item.categories.includes(category)).length,
      ])
    ) as Record<TimelineCategory, number>;

    return { 全部: items.length, ...categoryCounts };
  }, [items]);

  const visibleItems =
    activeFilter === "全部"
      ? items
      : items.filter((item) => item.categories.includes(activeFilter));

  return (
    <>
      <div
        className="print-hidden mt-10 border-y border-[rgb(var(--line)/0.09)] py-4"
        aria-label="篩選時間軸分類"
      >
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Filter
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = filter === activeFilter;

            return (
              <button
                key={filter}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(filter)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "border-[rgb(var(--accent)/0.32)] bg-[rgb(var(--accent)/0.14)] text-[rgb(var(--accent))]"
                    : "border-[rgb(var(--line)/0.09)] bg-[rgb(var(--line)/0.03)] text-[rgb(var(--muted))] hover:border-[rgb(var(--accent)/0.22)] hover:text-[rgb(var(--text))]",
                ].join(" ")}
              >
                {filter}
                <span className="font-mono text-[10px] opacity-55">
                  {counts[filter]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="resume-timeline relative mt-7" aria-label="履歷時間軸">
        <div className="resume-timeline-line absolute bottom-4 left-2 top-2 w-px -translate-x-1/2 bg-[rgb(var(--accent)/0.28)] md:left-[9.25rem]" />

        {visibleItems.map((item, index) => (
          <article
            key={`${item.period}-${item.title}`}
            className="resume-timeline-item relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-4 pb-3 md:grid-cols-[7.5rem_1.25rem_minmax(0,1fr)] md:gap-x-5 md:pb-4"
          >
            <time
              dateTime={item.dateTime}
              className="resume-period-desktop hidden pt-0.5 text-right font-mono text-xs leading-6 text-[rgb(var(--muted))] md:block"
            >
              {item.period}
            </time>

            <div className="relative z-10 mt-1 grid h-4 w-4 place-items-center rounded-full border border-[rgb(var(--accent)/0.45)] bg-[rgb(var(--bg))] shadow-[0_0_0_6px_rgb(var(--accent)/0.07)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
            </div>

            <div
              className={[
                "pb-5 md:pb-6",
                index < visibleItems.length - 1
                  ? "border-b border-[rgb(var(--line)/0.09)]"
                  : "",
              ].join(" ")}
            >
              <time
                dateTime={item.dateTime}
                className="resume-period-mobile mb-2 block font-mono text-xs text-[rgb(var(--muted))] md:hidden"
              >
                {item.period}
              </time>
              <div className="flex flex-wrap gap-1.5">
                {item.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-[rgb(var(--accent)/0.20)] bg-[rgb(var(--accent)/0.08)] px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] text-[rgb(var(--accent))]"
                  >
                    {category}
                  </span>
                ))}
              </div>
              <h2 className="mt-1.5 font-serif text-xl font-bold leading-snug tracking-tight sm:text-2xl">
                {item.title}
              </h2>
              {item.organization && (
                <div className="mt-0.5 text-xs font-medium leading-5 text-[rgb(var(--muted))] sm:text-sm">
                  {item.organization}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="hidden rounded-md border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.035)] px-2 py-1 text-[11px] text-[rgb(var(--muted))] sm:inline-flex"
                  >
                    {tag}
                  </span>
                ))}
                {item.links?.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="print-hidden ml-1 inline-flex items-center gap-1 text-xs font-bold text-[rgb(var(--accent))] transition-opacity hover:opacity-70"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
