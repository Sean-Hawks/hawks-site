"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { SearchItem } from "../lib/search";
import type { SiteTag } from "../lib/site-tags";

type SearchType = "all" | SearchItem["type"];

export default function SearchClient({
  items,
  tags,
}: {
  items: SearchItem[];
  tags: SiteTag[];
}) {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState<SearchType>("all");

  const filteredItems = React.useMemo(() => {
    const terms = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return items
      .filter((item) => type === "all" || item.type === type)
      .filter((item) => terms.every((term) => item.haystack.includes(term)))
      .slice(0, 24);
  }, [items, query, type]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] p-4 shadow-[0_18px_60px_rgb(var(--line)/0.08)]">
        <label className="flex items-center gap-3 rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-4 py-3">
          <Search className="h-5 w-5 flex-shrink-0 text-[rgb(var(--muted))]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋文章、Talk、Library、tag、內文..."
            className="w-full bg-transparent text-base text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
            autoFocus
          />
          {query && (
            <button
              type="button"
              aria-label="清除搜尋"
              onClick={() => setQuery("")}
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-[rgb(var(--muted))] transition-colors hover:bg-[rgb(var(--line)/0.06)] hover:text-[rgb(var(--text))]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "All", value: "all" },
            { label: "Blog", value: "post" },
            { label: "Talk", value: "talk" },
            { label: "Library", value: "library" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value as SearchType)}
              className={[
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                type === option.value
                  ? "border-[rgb(var(--accent)/0.28)] bg-[rgb(var(--accent)/0.14)] text-[rgb(var(--accent))]"
                  : "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 border-t border-[rgb(var(--line)/0.08)] pt-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 28).map((tag) => (
              <button
                key={tag.slug}
                type="button"
                onClick={() => {
                  setQuery(tag.tag);
                  setType("all");
                }}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  query.trim().toLowerCase() === tag.tag.toLowerCase()
                    ? "border-[rgb(var(--accent)/0.28)] bg-[rgb(var(--accent)/0.14)] text-[rgb(var(--accent))]"
                    : "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]",
                ].join(" ")}
              >
                {tag.tag}
                <span className="ml-1 opacity-60">{tag.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-sm text-[rgb(var(--muted))]">
        {filteredItems.length} result{filteredItems.length === 1 ? "" : "s"}
      </div>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 shadow-[0_18px_60px_rgb(var(--line)/0.07)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
              <span className="rounded-md bg-[rgb(var(--line)/0.06)] px-2 py-1 uppercase">
                {item.type}
              </span>
              <time>{item.date}</time>
              {item.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-1 text-[rgb(var(--accent))]">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold leading-snug transition-colors group-hover:text-[rgb(var(--accent))]">
                  {item.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-[rgb(var(--muted))]">
                  {item.desc}
                </p>
              </div>
              <ArrowRight className="mt-1 hidden h-5 w-5 flex-shrink-0 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))] sm:block" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
