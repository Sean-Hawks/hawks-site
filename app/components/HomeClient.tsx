import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Clapperboard, FileText, NotebookText, Search, Star } from "lucide-react";
import { rolesTop } from "../data/roles";
import ProfileSidebar from "./ProfileSidebar";
import ReadmeSection from "./ReadmeSection";
import ProjectsSection from "./ProjectsSection";
import { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import Header from "./Header";
import ThemeStyles from "./ThemeStyles";
import { tagToSlug } from "../lib/posts";

interface HomeClientProps {
  posts: Post[];
  talks: Talk[];
  libraryItems: LibraryItem[];
}

type ActivityItem = {
  key: string;
  label: string;
  title: string;
  desc: string;
  date: string;
  tags: string[];
  href: string;
};

function excerpt(value = "", length = 120) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

const libraryCategoryLabels: Record<LibraryItem["category"], string> = {
  anime: "Anime",
  movie: "Movie",
  artist: "Artist",
  game: "Game",
};

function ratingValue(item: LibraryItem) {
  return item.rating ?? -1;
}

function formatRating(rating: LibraryItem["rating"]) {
  return rating === null ? "N/A" : rating.toFixed(1);
}

function libraryHref(item: LibraryItem) {
  return item.hasReview || item.recommendedWorks.length > 0
    ? `/library/${item.category}/${item.slug}`
    : `/library/${item.category}`;
}

function getFeaturedLibraryItems(items: LibraryItem[]) {
  const curated = items.filter((item) => item.featured);
  const source = curated.length > 0 ? curated : items;

  return [...source]
    .sort(
      (a, b) =>
        (a.featuredOrder ?? Number.POSITIVE_INFINITY) -
          (b.featuredOrder ?? Number.POSITIVE_INFINITY) ||
        ratingValue(b) - ratingValue(a) ||
        a.title.localeCompare(b.title)
    )
    .slice(0, 6);
}

function getRecentActivity({
  posts,
  talks,
  libraryItems,
}: HomeClientProps): ActivityItem[] {
  return [
    ...posts.map((post) => ({
      key: `post-${post.slug}`,
      label: "Post",
      title: post.title,
      desc: post.desc,
      date: post.date,
      tags: post.tags,
      href: `/blog/${post.slug}`,
    })),
    ...talks.map((talk) => ({
      key: `talk-${talk.id}`,
      label: "Talk",
      title: talk.title,
      desc: excerpt(talk.desc),
      date: talk.date,
      tags: [],
      href: `/talk/${talk.id}`,
    })),
    ...libraryItems
      .filter((item) => item.hasReview)
      .map((item) => ({
        key: `library-${item.slug}`,
        label: "Library",
        title: `評論：${item.title}`,
        desc: item.note || excerpt(item.content),
        date: item.date,
        tags: item.tags,
        href: `/library/${item.category}/${item.slug}`,
      })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);
}

function LibraryShowcase({ items }: { items: LibraryItem[] }) {
  const [spotlight, ...supportingItems] = items;
  if (!spotlight) return null;

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] shadow-[0_22px_70px_rgba(90,76,55,0.10)]">
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Link
          href={libraryHref(spotlight)}
          className="group relative min-h-[360px] overflow-hidden border-b border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] lg:border-b-0 lg:border-r"
        >
          {spotlight.image.src ? (
            <Image
              src={spotlight.image.src}
              alt={spotlight.image.alt}
              fill
              priority={false}
              sizes="(min-width: 1024px) 56vw, 100vw"
              className={[
                "transition-transform duration-500 group-hover:scale-[1.035]",
                spotlight.image.fit === "contain" ? "object-contain p-8" : "object-cover",
              ].join(" ")}
            />
          ) : (
            <div className="grid h-full place-items-center text-[rgb(var(--accent))]">
              <Clapperboard className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-black/8" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/14 bg-white/12 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {libraryCategoryLabels[spotlight.category]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200/20 bg-yellow-200/16 px-3 py-1 text-xs font-bold text-yellow-100 backdrop-blur">
                <Star className="h-3.5 w-3.5 fill-yellow-200" />
                {formatRating(spotlight.rating)}
              </span>
            </div>
            <h3 className="max-w-xl text-2xl font-bold leading-tight text-white transition-colors group-hover:text-yellow-100 sm:text-3xl">
              {spotlight.title}
            </h3>
            {spotlight.subtitle && (
              <p className="mt-1 text-sm text-white/72">{spotlight.subtitle}</p>
            )}
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/78">
              {spotlight.note}
            </p>
          </div>
        </Link>

        <div className="flex flex-col">
          <div className="border-b border-[rgb(var(--line)/0.08)] p-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
              Curated Picks
            </div>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              不是排行榜，是比較能代表我品味和記憶點的作品。
            </p>
          </div>
          <div className="divide-y divide-[rgb(var(--line)/0.08)]">
            {supportingItems.slice(0, 4).map((item) => (
              <Link
                key={item.id}
                href={libraryHref(item)}
                className="group grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 p-4 transition-colors hover:bg-[rgb(var(--line)/0.035)]"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[rgb(var(--line)/0.05)]">
                  {item.image.src ? (
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes="72px"
                      className={[
                        "transition-transform duration-300 group-hover:scale-[1.04]",
                        item.image.fit === "contain" ? "object-contain p-2" : "object-cover",
                      ].join(" ")}
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[rgb(var(--accent))]">
                      <Clapperboard className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <span>{libraryCategoryLabels[item.category]}</span>
                    <span className="opacity-40">/</span>
                    <span className="inline-flex items-center gap-1 text-[rgb(var(--accent))]">
                      <Star className="h-3 w-3 fill-[rgb(var(--accent))]" />
                      {formatRating(item.rating)}
                    </span>
                  </div>
                  <h3 className="truncate text-sm font-bold text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-xs text-[rgb(var(--muted))]">
                    {item.note}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))]" />
              </Link>
            ))}
          </div>
          <Link
            href="/library"
            className="mt-auto flex items-center justify-between border-t border-[rgb(var(--line)/0.08)] p-4 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
          >
            進入完整 Library
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
  href,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-2xl font-bold leading-tight text-[rgb(var(--text))] sm:text-3xl">{title}</h2>
        {desc && <p className="mt-1 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">{desc}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export default function HomeClient({ posts, talks, libraryItems }: HomeClientProps) {
  const latestPosts = posts.slice(0, 4);
  const latestTalks = talks.slice(0, 3);
  const featuredLibraryItems = getFeaturedLibraryItems(libraryItems);
  const recentActivity = getRecentActivity({ posts, talks, libraryItems });

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main>
        <section className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:px-3 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          <aside className="overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.90)] shadow-[0_20px_70px_rgba(90,76,55,0.10)] lg:sticky lg:top-20">
            <ProfileSidebar roles={rolesTop} />
          </aside>

          <section className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] p-5 shadow-[0_20px_70px_rgba(90,76,55,0.08)] sm:p-6">
            <ReadmeSection activityItems={recentActivity} />
          </section>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-4 pt-6 sm:px-3">
          <div className="mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/search"
              className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5 shadow-[0_18px_60px_rgb(var(--line)/0.06)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
            >
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--accent))]">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">搜尋全站</div>
                <div className="text-sm leading-6 text-[rgb(var(--muted))]">文章、Talk、Library、tag 和內文都可以搜尋。</div>
              </div>
            </Link>
            <Link
              href="/library"
              className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5 shadow-[0_18px_60px_rgb(var(--line)/0.06)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
            >
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--accent))]">
                <Clapperboard className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">Library</div>
                <div className="text-sm leading-6 text-[rgb(var(--muted))]">動畫、電影和音樂推薦收藏。</div>
              </div>
            </Link>
            <Link
              href="/now"
              className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--accent)/0.16)] bg-[rgb(var(--panel)/0.82)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.10)] transition-colors hover:border-[rgb(var(--accent)/0.30)] hover:bg-[rgb(var(--panel))]"
            >
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-[rgb(var(--accent)/0.20)] bg-[rgb(var(--accent)/0.09)] text-[rgb(var(--accent))]">
                <NotebookText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">Now</div>
                <div className="text-sm leading-6 text-[rgb(var(--muted))]">最近更新、短筆記和一些分享紀錄。</div>
              </div>
            </Link>
          </div>

          <SectionHeader
            eyebrow="Hawks Library"
            title="看過、聽過、玩過的收藏"
            desc="這裡是網站目前的主軸：動畫、音樂、電影、遊戲，依照我的喜好整理成可以慢慢逛的收藏。"
            href="/library"
          />
          <LibraryShowcase items={featuredLibraryItems} />

          <SectionHeader
            eyebrow="Latest Blog"
            title="部落格"
            desc="通常相對於 Talk 會是比較完整的文章，可能是技術分享、讀書心得或是一些想法。"
            href="/blog"
          />
          <div className="grid gap-3 md:grid-cols-2">
            {latestPosts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.08)] transition-colors hover:border-[rgb(var(--accent)/0.28)]"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                  <FileText className="h-3.5 w-3.5" />
                  <time>{post.date}</time>
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tagToSlug(tag)}`}
                      className="rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-0.5 text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.16)]"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <h3 className="text-lg font-bold leading-snug text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))] sm:text-xl">
                    {post.title}
                  </h3>
                </Link>
                <p className="mt-2 line-clamp-2 text-sm leading-7 text-[rgb(var(--muted))]">
                  {post.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8 sm:px-3">
          <SectionHeader
            eyebrow="Now"
            title="近況與分享"
            desc="比較隨性的隨筆，以天為單位的更新，紀錄一些想法、生活瑣事或是一些不成體系的分享。"
            href="/now"
          />
          <div className="grid gap-3 lg:grid-cols-3">
            {latestTalks.map((talk) => (
              <Link
                key={talk.id}
                href={`/talk/${talk.id}`}
                className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.08)] transition-colors hover:border-[rgb(var(--accent)/0.30)] hover:bg-[rgb(var(--panel))]"
              >
                <div className="mb-3 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--accent)/0.16)] bg-[rgb(var(--accent)/0.08)] px-2 py-1 font-bold text-[rgb(var(--accent))]">
                    <NotebookText className="h-3.5 w-3.5" />
                    Now
                  </span>
                  <time>{talk.date}</time>
                </div>
                <h3 className="text-lg font-bold leading-snug text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
                  {talk.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[rgb(var(--muted))]">
                  {excerpt(talk.desc)}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-3">
          <SectionHeader
            eyebrow="Projects"
            title="正在做和做過的東西"
            desc="開源在 GitHub 上的專案，或是一些不公開的 side project，還有一些過去做過但已經不維護的作品。"
            href="/project"
          />
          <ProjectsSection showTitle={false} />
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-[rgb(var(--muted))] sm:px-3">
        <div className="opacity-70">© {new Date().getFullYear()} Hawks • made to feel like a profile, not a resume.</div>
      </footer>
    </div>
  );
}
