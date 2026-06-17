import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Clapperboard,
  Disc3,
  Film,
  Gamepad2,
  PlayCircle,
  Star,
  Tv,
} from "lucide-react";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import {
  libraryCategories,
  type LibraryCategory,
  type LibraryItem,
} from "../data/library";
import { getAllLibraryItems } from "../lib/library";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Library",
  description: "Hawks 的動畫、電影、音樂和遊戲推薦收藏入口。",
  alternates: {
    canonical: "https://hawks.tw/library/",
  },
  openGraph: {
    title: "Library",
    description: "Hawks 的動畫、電影、音樂和遊戲推薦收藏入口。",
    url: "https://hawks.tw/library/",
    images: ["/og/default.png"],
  },
};

const categoryIcons: Record<LibraryCategory, typeof Tv> = {
  anime: Tv,
  movie: Film,
  music: Disc3,
  game: Gamepad2,
};

const categoryLabels: Record<LibraryCategory, string> = {
  anime: "Anime",
  movie: "Movie",
  music: "Music",
  game: "Game",
};

const statusLabels: Record<LibraryItem["status"], string> = {
  watched: "Watched",
  listened: "Listened",
  watching: "Watching",
  playing: "Playing",
  played: "Played",
  planned: "Planned",
  recommended: "Recommended",
};

function getItemHref(item: LibraryItem) {
  return item.hasReview ? `/library/${item.category}/${item.slug}` : undefined;
}

function getCategoryStats(items: LibraryItem[], category: LibraryCategory) {
  const categoryItems = items.filter((item) => item.category === category);
  const average =
    categoryItems.length > 0
      ? categoryItems.reduce((sum, item) => sum + item.rating, 0) /
        categoryItems.length
      : 0;

  return {
    count: categoryItems.length,
    average,
    top: [...categoryItems].sort((a, b) => b.rating - a.rating)[0],
  };
}

function getTopPicks(items: LibraryItem[]) {
  return [...items]
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        (b.year ?? "").localeCompare(a.year ?? "") ||
        a.title.localeCompare(b.title)
    )
    .slice(0, 6);
}

function getCategoryTopPicks(items: LibraryItem[], category: LibraryCategory) {
  return items
    .filter((item) => item.category === category)
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        (b.year ?? "").localeCompare(a.year ?? "") ||
        a.title.localeCompare(b.title)
    )
    .slice(0, 3);
}

function getLibraryStats(items: LibraryItem[]) {
  const reviews = items.filter((item) => item.hasReview).length;
  const active = items.filter((item) =>
    ["watching", "playing"].includes(item.status)
  ).length;
  const topScore =
    items.length > 0 ? Math.max(...items.map((item) => item.rating)) : 0;

  return [
    { label: "Collections", value: items.length.toString() },
    { label: "Reviews", value: reviews.toString() },
    { label: "Watching / Playing", value: active.toString() },
    { label: "TOP SCORE", value: topScore.toFixed(1) },
  ];
}

function StatusBadge({ item }: { item: LibraryItem }) {
  const isWatching = item.status === "watching";
  const isPlaying = item.status === "playing";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        isWatching
          ? "border-amber-300/55 bg-amber-300/16 text-amber-700 shadow-[0_0_18px_rgba(251,191,36,0.14)] dark:text-amber-200"
          : isPlaying
            ? "border-emerald-300/55 bg-emerald-300/16 text-emerald-700 shadow-[0_0_18px_rgba(52,211,153,0.14)] dark:text-emerald-200"
          : "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
      ].join(" ")}
    >
      {(isWatching || isPlaying) && <PlayCircle className="h-3.5 w-3.5" />}
      {statusLabels[item.status]}
    </span>
  );
}

function ItemImage({
  item,
  className,
  sizes,
}: {
  item: LibraryItem;
  className?: string;
  sizes: string;
}) {
  const CategoryIcon = categoryIcons[item.category];

  return (
    <div
      className={[
        "relative overflow-hidden bg-[rgb(var(--line)/0.05)]",
        className ?? "",
      ].join(" ")}
    >
      {item.image.src ? (
        <Image
          src={item.image.src}
          alt={item.image.alt}
          fill
          sizes={sizes}
          className={[
            "transition-transform duration-300 group-hover:scale-[1.03]",
            item.image.fit === "contain" ? "object-contain p-4" : "object-cover",
          ].join(" ")}
        />
      ) : (
        <div className="grid h-full place-items-center text-[rgb(var(--accent))]">
          <CategoryIcon className="h-8 w-8" />
        </div>
      )}
    </div>
  );
}

function SpotlightCard({ item }: { item: LibraryItem }) {
  const CategoryIcon = categoryIcons[item.category];
  const href = getItemHref(item);
  const body = (
    <div className="grid gap-0 sm:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)]">
      <ItemImage
        item={item}
        className="aspect-[16/10] sm:aspect-auto sm:min-h-64"
        sizes="(min-width: 1024px) 280px, (min-width: 640px) 220px, calc(100vw - 32px)"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent)/0.10)] px-2.5 py-1 text-xs font-medium text-[rgb(var(--accent))]">
            <CategoryIcon className="h-3.5 w-3.5" />
            {categoryLabels[item.category]}
          </span>
          <StatusBadge item={item} />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
          精選
        </p>
        <h2 className="mt-2 text-2xl font-bold leading-tight text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
          {item.hasReview ? `評論：${item.title}` : item.title}
        </h2>
        {item.subtitle && (
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            {item.subtitle}
          </p>
        )}
        <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))]">
          {item.note}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[rgb(var(--accent)/0.12)] px-3 py-2 text-sm font-bold text-[rgb(var(--accent))]">
            <Star className="h-4 w-4 fill-[rgb(var(--accent))]" />
            {item.rating.toFixed(1)}
          </span>
          {href && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-3 py-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors group-hover:border-[rgb(var(--accent)/0.28)] group-hover:text-[rgb(var(--accent))]">
              閱讀
              <ArrowUpRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const className =
    "group block overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] shadow-[0_22px_70px_rgba(90,76,55,0.12)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}

function CategoryPickCard({ item, index }: { item: LibraryItem; index: number }) {
  const CategoryIcon = categoryIcons[item.category];
  const href = getItemHref(item);
  const body = (
    <>
      <ItemImage
        item={item}
        className="h-28 rounded-xl"
        sizes="96px"
      />
      <div className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[11px] font-bold text-white">
        #{index + 1}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent)/0.10)] px-2.5 py-1 text-xs font-medium text-[rgb(var(--accent))]">
            <CategoryIcon className="h-3.5 w-3.5" />
            {categoryLabels[item.category]}
          </span>
          <StatusBadge item={item} />
        </div>

        <h3 className="truncate text-base font-bold leading-snug text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
          {item.hasReview ? `評論：${item.title}` : item.title}
        </h3>
        {item.subtitle && (
          <p className="mt-1 truncate text-sm text-[rgb(var(--muted))]">
            {item.subtitle}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--accent)/0.12)] px-2 py-1 text-sm font-bold text-[rgb(var(--accent))]">
            <Star className="h-4 w-4 fill-[rgb(var(--accent))]" />
            {item.rating.toFixed(1)}
          </span>
          {href && (
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))] transition-colors group-hover:border-[rgb(var(--accent)/0.28)] group-hover:text-[rgb(var(--accent))]">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className =
    "group relative grid grid-cols-[96px_minmax(0,1fr)] gap-3 rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.025)] p-3 transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--line)/0.045)]";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <article className={className}>{body}</article>
  );
}

function WatchingCard({ item }: { item: LibraryItem }) {
  const CategoryIcon = categoryIcons[item.category];
  const href = `/library/${item.category}`;

  return (
    <Link
      href={href}
      className="group grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-2xl border border-amber-300/28 bg-amber-300/8 p-3 shadow-[0_18px_60px_rgba(251,191,36,0.08)] transition-colors hover:border-amber-300/50 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center"
    >
      <ItemImage
        item={item}
        className="aspect-[3/4] rounded-xl"
        sizes="(min-width: 640px) 88px, 72px"
      />
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatusBadge item={item} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
            <CategoryIcon className="h-3.5 w-3.5" />
            {categoryLabels[item.category]}
          </span>
        </div>
        <h3 className="truncate text-lg font-bold text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">
          {item.note}
        </p>
      </div>
      <div className="col-start-2 inline-flex flex-shrink-0 items-center gap-1.5 self-start rounded-lg bg-[rgb(var(--accent)/0.12)] px-3 py-2 text-sm font-bold text-[rgb(var(--accent))] sm:col-start-auto sm:self-auto">
        <Star className="h-4 w-4 fill-[rgb(var(--accent))]" />
        {item.rating.toFixed(1)}
      </div>
    </Link>
  );
}

function CategoryTopSection({
  category,
  items,
}: {
  category: (typeof libraryCategories)[number];
  items: LibraryItem[];
}) {
  const Icon = categoryIcons[category.id];

  return (
    <section className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.82)] p-4 shadow-[0_18px_60px_rgba(90,76,55,0.07)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent)/0.10)] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--accent))]">
            <Icon className="h-3.5 w-3.5" />
            {category.label}
          </div>
          <h3 className="mt-2 text-xl font-bold leading-tight">
            {category.title}
          </h3>
        </div>
        <Link
          href={category.href}
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:text-[rgb(var(--accent))]"
          aria-label={`Open ${category.label}`}
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <CategoryPickCard key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

export default function LibraryPage() {
  const libraryItems = getAllLibraryItems();
  const topPicks = getTopPicks(libraryItems);
  const spotlight = topPicks[0];
  const categoryTopPicks = libraryCategories.map((category) => ({
    category,
    items: getCategoryTopPicks(libraryItems, category.id),
  }));
  const activeItems = libraryItems
    .filter((item) => item.status === "watching" || item.status === "playing")
    .sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
  const stats = getLibraryStats(libraryItems);

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <section className="space-y-5">
          <div className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] p-5 shadow-[0_22px_70px_rgb(var(--line)/0.10)] sm:p-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
              <Clapperboard className="h-3.5 w-3.5" />
              Hawks Library
            </div>
            <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
              看過，聽過，玩過
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
              關於我對 ACGM 以及藝術的品味。
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] p-3"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold text-[rgb(var(--text))]">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/library/anime"
                className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.28)] bg-[rgb(var(--accent)/0.12)] px-4 py-2 text-sm font-medium text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.16)]"
              >
                動畫
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#watching"
                className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-4 py-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
              >
                <PlayCircle className="h-4 w-4" />
                Watching / Playing
              </Link>
            </div>
          </div>

          {spotlight && <SpotlightCard item={spotlight} />}
        </section>

        {activeItems.length > 0 && (
          <section id="watching" className="mt-8">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                  <PlayCircle className="h-3.5 w-3.5" />
                  Now
                </div>
                <h2 className="mt-1 text-2xl font-bold leading-tight">
                  Watching / Playing
                </h2>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {activeItems.map((item) => (
                <WatchingCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                Picks
              </div>
              <h2 className="mt-1 text-2xl font-bold leading-tight">
                分類精選
              </h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {categoryTopPicks.map(({ category, items }) => (
              <CategoryTopSection
                key={category.id}
                category={category}
                items={items}
              />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                Library
              </div>
              <h2 className="mt-1 text-2xl font-bold leading-tight">
                分類
              </h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {libraryCategories.map((category) => {
              const Icon = categoryIcons[category.id];
              const stats = getCategoryStats(libraryItems, category.id);

              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className="group flex min-h-[260px] flex-col rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.07)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--accent))]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))]" />
                  </div>

                  <div className="mt-5">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                      {category.label}
                    </div>
                    <h2 className="mt-1 text-2xl font-bold leading-tight">
                      {category.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[rgb(var(--muted))]">
                      {category.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-5">
                    <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                      <span className="rounded-md bg-[rgb(var(--line)/0.06)] px-2 py-1">
                        {stats.count} collections
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-1 text-[rgb(var(--accent))]">
                        <Star className="h-3 w-3 fill-[rgb(var(--accent))]" />
                        {stats.average.toFixed(1)} avg
                      </span>
                    </div>
                    {stats.top && (
                      <div className="mt-3 text-sm text-[rgb(var(--muted))]">
                        最高分：{" "}
                        <span className="font-medium text-[rgb(var(--text))]">
                          {stats.top.title}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-[rgb(var(--muted))] sm:px-3">
        <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
      </footer>
    </div>
  );
}
