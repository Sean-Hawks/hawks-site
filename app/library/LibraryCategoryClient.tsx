"use client";

import React from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Disc3,
  Film,
  Gamepad2,
  Heart,
  PlayCircle,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Tags,
  Tv,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type {
  LibraryCategory,
  LibraryCategoryInfo,
  LibraryItem,
  LibraryRecommendation,
  LibraryStatus,
} from "../data/library";

type StatusFilter = "all" | LibraryStatus;
type RecommendationFilter = "all" | LibraryRecommendation;
type SortMode = "rating" | "year" | "title";

const recommendationOptions: Array<{
  label: string;
  value: RecommendationFilter;
}> = [
  { label: "All", value: "all" },
  { label: "Brilliant", value: "brilliant" },
  { label: "Favorite", value: "favorite" },
  { label: "Recommended", value: "recommended" },
  { label: "Casual", value: "casual" },
];

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Watched", value: "watched" },
  { label: "Listened", value: "listened" },
  { label: "Watching", value: "watching" },
  { label: "Playing", value: "playing" },
  { label: "Played", value: "played" },
  { label: "Planned", value: "planned" },
  { label: "Recommended", value: "recommended" },
];

const sortOptions: Array<{ label: string; value: SortMode }> = [
  { label: "Rating", value: "rating" },
  { label: "Year", value: "year" },
  { label: "Title", value: "title" },
];

const categoryMeta: Record<
  LibraryCategory,
  { label: string; Icon: typeof Tv; tone: string }
> = {
  anime: {
    label: "Anime",
    Icon: Tv,
    tone: "border-violet-400/25 bg-violet-400/10",
  },
  movie: {
    label: "Movie",
    Icon: Film,
    tone: "border-sky-400/25 bg-sky-400/10",
  },
  music: {
    label: "Music",
    Icon: Disc3,
    tone: "border-emerald-400/25 bg-emerald-400/10",
  },
  game: {
    label: "Game",
    Icon: Gamepad2,
    tone: "border-rose-400/25 bg-rose-400/10",
  },
};

const recommendationMeta: Record<
  LibraryRecommendation,
  { label: string; Icon: typeof Star }
> = {
  brilliant: { label: "Brilliant", Icon: Award },
  favorite: { label: "Favorite", Icon: Heart },
  recommended: { label: "Recommended", Icon: Star },
  casual: { label: "Casual", Icon: Sparkles },
};

const statusMeta: Record<
  LibraryStatus,
  { label: string; className: string; Icon?: typeof PlayCircle }
> = {
  watched: {
    label: "Watched",
    className:
      "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
  },
  listened: {
    label: "Listened",
    className:
      "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
  },
  watching: {
    label: "Watching",
    Icon: PlayCircle,
    className:
      "border-amber-300/55 bg-amber-300/16 text-amber-700 shadow-[0_0_0_1px_rgba(251,191,36,0.18),0_0_24px_rgba(251,191,36,0.16)] dark:text-amber-200",
  },
  playing: {
    label: "Playing",
    Icon: PlayCircle,
    className:
      "border-emerald-300/55 bg-emerald-300/16 text-emerald-700 shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_24px_rgba(52,211,153,0.14)] dark:text-emerald-200",
  },
  played: {
    label: "Played",
    className:
      "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
  },
  planned: {
    label: "Planned",
    className:
      "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
  },
  recommended: {
    label: "Recommended",
    className:
      "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
  },
};

function includesTerm(item: LibraryItem, terms: string[]) {
  const haystack = [
    item.title,
    item.subtitle,
    item.year,
    item.status,
    item.recommendation,
    item.rating.toString(),
    item.note,
    item.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
}

function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {label}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              value === option.value
                ? "border-[rgb(var(--accent)/0.28)] bg-[rgb(var(--accent)/0.14)] text-[rgb(var(--accent))]"
                : "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]",
            ].join(" ")}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Rating({ rating }: { rating: number }) {
  const filledStars = Math.max(0, Math.min(5, Math.round(rating / 2)));

  return (
    <div className="flex items-center gap-2">
      <div className="flex" aria-label={`Rating ${rating.toFixed(1)} out of 10`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={[
              "h-4 w-4",
              index < filledStars
                ? "fill-[rgb(var(--accent))] text-[rgb(var(--accent))]"
                : "text-[rgb(var(--line)/0.25)]",
            ].join(" ")}
          />
        ))}
      </div>
      <span className="rounded-md bg-[rgb(var(--accent)/0.12)] px-2 py-1 text-xs font-bold text-[rgb(var(--accent))]">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function LibraryCard({ item }: { item: LibraryItem }) {
  const category = categoryMeta[item.category];
  const recommendation = recommendationMeta[item.recommendation];
  const CategoryIcon = category.Icon;
  const RecommendationIcon = recommendation.Icon;
  const hasReview = item.hasReview;
  const status = statusMeta[item.status];
  const StatusIcon = status.Icon;
  const imageBlock = (
    <div className="group relative block h-72 overflow-hidden bg-[rgb(var(--line)/0.05)] sm:h-full sm:min-h-[300px]">
      {item.image.src ? (
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          sizes="(min-width: 640px) 180px, calc(100vw - 32px)"
          className={[
            "transition-transform duration-300 group-hover:scale-[1.03]",
            item.image.fit === "contain" ? "object-contain p-4" : "object-cover",
          ].join(" ")}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-[rgb(var(--line)/0.025)] p-5 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--accent))]">
            <CategoryIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
              No cover yet
            </div>
            <div className="mt-1 text-sm text-[rgb(var(--muted))]">
              {item.title}
            </div>
          </div>
        </div>
      )}
      {item.image.credit && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-[11px] leading-4 text-white/78">
          {item.image.credit}
        </div>
      )}
    </div>
  );
  const contentClassName = [
    "flex min-h-full flex-col p-5",
    hasReview ? "group/review" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const textContent = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-[rgb(var(--text))]",
            category.tone,
          ].join(" ")}
        >
          <CategoryIcon className="h-3.5 w-3.5" />
          {category.label}
        </span>
        {item.year && (
          <span className="rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
            {item.year}
          </span>
        )}
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
            status.className,
          ].join(" ")}
        >
          {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
          {status.label}
        </span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          {hasReview && (
            <div className="mb-2 inline-flex rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-1 text-xs font-bold text-[rgb(var(--accent))]">
              評論
            </div>
          )}
          <h2
            className={[
              "text-xl font-bold leading-snug text-[rgb(var(--text))] transition-colors",
              hasReview ? "group-hover/review:text-[rgb(var(--accent))]" : "",
            ].join(" ")}
          >
            {hasReview ? `評論：${item.title}` : item.title}
          </h2>
          {item.subtitle && (
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              {item.subtitle}
            </p>
          )}
        </div>
        {hasReview && (
          <div
            aria-hidden="true"
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))] transition-colors group-hover/review:border-[rgb(var(--accent)/0.28)] group-hover/review:text-[rgb(var(--accent))]"
          >
            <ArrowUpRight className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Rating rating={item.rating} />
        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--accent))]">
          <RecommendationIcon className="h-4 w-4" />
          {recommendation.label}
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-[rgb(var(--muted))]">
        {item.note}
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-[rgb(var(--line)/0.06)] px-2 py-1 text-xs text-[rgb(var(--muted))]"
          >
            <Tags className="h-3 w-3" />
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] shadow-[0_18px_60px_rgba(90,76,55,0.07)] transition-colors",
        hasReview
          ? "hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
          : "",
      ].join(" ")}
    >
      <div className="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
        {item.image.source ? (
          <a
            href={item.image.source}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open image source for ${item.title}`}
          >
            {imageBlock}
          </a>
        ) : (
          imageBlock
        )}

        {hasReview ? (
          <Link
            href={`/library/${item.category}/${item.slug}`}
            className={contentClassName}
          >
            {textContent}
          </Link>
        ) : (
          <div className={contentClassName}>{textContent}</div>
        )}
      </div>
    </article>
  );
}

export default function LibraryCategoryClient({
  category,
  items,
}: {
  category: LibraryCategoryInfo;
  items: LibraryItem[];
}) {
  const [query, setQuery] = React.useState("");
  const [recommendation, setRecommendation] =
    React.useState<RecommendationFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<SortMode>("rating");
  const CategoryIcon = categoryMeta[category.id].Icon;

  const filteredItems = React.useMemo(() => {
    const terms = query
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    return [...items]
      .filter((item) => {
        if (recommendation !== "all" && item.recommendation !== recommendation) {
          return false;
        }
        if (status !== "all" && item.status !== status) return false;
        return includesTerm(item, terms);
      })
      .sort((a, b) => {
        if (sort === "rating") return b.rating - a.rating;
        if (sort === "year") return (b.year ?? "").localeCompare(a.year ?? "");
        return a.title.localeCompare(b.title);
      });
  }, [items, query, recommendation, sort, status]);

  const resetFilters = () => {
    setQuery("");
    setRecommendation("all");
    setStatus("all");
    setSort("rating");
  };
  const hasActiveFilters =
    query.trim() !== "" ||
    recommendation !== "all" ||
    status !== "all" ||
    sort !== "rating";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] p-5 shadow-[0_22px_70px_rgb(var(--line)/0.10)] sm:p-7">
        <Link
          href="/library"
          className="mb-5 inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
          <CategoryIcon className="h-3.5 w-3.5" />
          {category.label}
        </div>
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
          {category.title}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
          {category.description}
        </p>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-4 shadow-[0_18px_60px_rgb(var(--line)/0.08)] sm:p-5">
        <label className="flex items-center gap-3 rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-4 py-3">
          <Search className="h-5 w-5 flex-shrink-0 text-[rgb(var(--muted))]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜尋標題、tag 或一句心得..."
            className="w-full bg-transparent text-base text-[rgb(var(--text))] outline-none placeholder:text-[rgb(var(--muted))]"
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

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <FilterGroup
            label="Recommendation"
            options={recommendationOptions}
            value={recommendation}
            onChange={setRecommendation}
          />
          <FilterGroup
            label="Status"
            options={statusOptions}
            value={status}
            onChange={setStatus}
          />
          <FilterGroup
            label="Sort"
            options={sortOptions}
            value={sort}
            onChange={setSort}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-[rgb(var(--muted))]">
          {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 self-start rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-3 py-1.5 text-sm text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:text-[rgb(var(--accent))] sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            清除篩選
          </button>
        )}
      </div>

      {filteredItems.length > 0 ? (
        <section className="grid gap-4">
          {filteredItems.map((item) => (
            <LibraryCard key={item.id} item={item} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.82)] p-8 text-center shadow-[0_18px_60px_rgba(90,76,55,0.07)]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--accent))]">
            <Search className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold">沒有符合的收藏</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-[rgb(var(--muted))]">
            換個關鍵字或清除篩選，就能重新看到這個分類的清單。
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.12)] px-4 py-2 text-sm font-medium text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.16)]"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </button>
        </section>
      )}
    </div>
  );
}
