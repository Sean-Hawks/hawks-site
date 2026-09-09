import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Feather, Heart } from "lucide-react";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { getPostDescription, getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { getAllLibraryItems } from "../lib/library";
import type { LibraryItem } from "../data/library";
import type { Metadata } from "next";

type BlogEntry = {
  id: string;
  kind: "note" | "post";
  href: string;
  title: string;
  date: string;
  summary: string;
  image: string;
  tags: string[];
};

export const metadata: Metadata = {
  title: "部落格",
  description: "Hawks 最近寫下來的文章、近況與短更新。",
  alternates: { canonical: "https://hawks.tw/blog/" },
  openGraph: {
    title: "部落格",
    description: "Hawks 最近寫下來的文章、近況與短更新。",
    url: "https://hawks.tw/blog/",
    images: ["/og/default.png"],
  },
};

function longDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${year}.${month}.${day}`;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return month && day ? `${month}.${day}` : date;
}

function firstContentImage(content = "", banner = "") {
  if (banner) return banner;
  const obsidianImage = content.match(/!\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/);
  if (obsidianImage) return `/images/${obsidianImage[1]}`;
  const markdownImage = content.match(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)/);
  return markdownImage?.[1]?.startsWith("/") ? markdownImage[1] : "";
}

function plainText(content = "", length = 210) {
  const text = content
    .replace(/!\[\[[^\]]+\]\]/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

function libraryHref(item: LibraryItem) {
  return item.hasReview || item.recommendedWorks.length > 0
    ? `/library/${item.category}/${item.slug}`
    : `/library/${item.category}`;
}

function favoriteLibraryItems(items: LibraryItem[]) {
  const featured = items.filter((item) => item.featured);
  return [...(featured.length ? featured : items)]
    .sort(
      (a, b) =>
        (a.featuredOrder ?? Number.POSITIVE_INFINITY) -
          (b.featuredOrder ?? Number.POSITIVE_INFINITY) ||
        (b.rating ?? -1) - (a.rating ?? -1),
    )
    .slice(0, 4);
}

export default function BlogPage() {
  const talks = getSortedTalksData();
  const posts = getSortedPostsData();
  const favorites = favoriteLibraryItems(getAllLibraryItems());

  const notes: BlogEntry[] = talks.map((talk) => ({
    id: `note-${talk.id}`,
    kind: "note",
    href: `/talk/${talk.id}`,
    title: talk.titleGenerated || talk.title.trim() === "雜談" ? "一則近況" : talk.title,
    date: talk.date,
    summary: plainText(talk.desc, 260),
    image: firstContentImage(talk.desc, talk.banner),
    tags: talk.tags ?? [],
  }));

  const essays: BlogEntry[] = posts.map((post) => ({
    id: `post-${post.slug}`,
    kind: "post",
    href: `/blog/${post.slug}`,
    title: post.title,
    date: post.date,
    summary: plainText(getPostDescription(post, 360), 300),
    image: firstContentImage(post.content, post.banner),
    tags: post.tags,
  }));

  const latestNote = notes[0];
  const latestEssay = essays[0];
  const recent = [...notes, ...essays].sort((a, b) => b.date.localeCompare(a.date));
  const recentYears = Array.from(new Set(recent.map((entry) => entry.date.slice(0, 4))));

  return (
    <div className="now-desk min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <header className="now-desk-hero">
          <div className="md:col-span-2">
            <div className="now-desk-kicker">01 / WRITING</div>
            <h1 className="now-desk-title mt-5 font-serif font-bold tracking-[-0.06em]">
              部落格
            </h1>
          </div>
        </header>

        <section className="mt-12 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]" aria-label="最新內容">
          {latestNote && (
            <Link href={latestNote.href} className="now-desk-feature now-desk-feature-note group">
              <div className="flex items-center justify-between gap-4">
                <span className="now-desk-label"><Feather className="h-3.5 w-3.5" />最新近況</span>
                <time className="now-desk-date" dateTime={latestNote.date}>{longDate(latestNote.date)}</time>
              </div>
              <div className="relative mt-auto pt-16 sm:pt-24">
                <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight transition-colors group-hover:text-[rgb(var(--accent))] sm:text-4xl">
                  {latestNote.title}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-[rgb(var(--text)/0.72)]">
                  {latestNote.summary}
                </p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[rgb(var(--accent))]">
                  繼續讀 <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}

          {latestEssay && (
            <Link href={latestEssay.href} className="now-desk-feature now-desk-feature-essay group">
              {latestEssay.image && (
                <Image
                  src={latestEssay.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 500px, 100vw"
                  className="object-cover opacity-35 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-45"
                  priority
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--panel))] via-[rgb(var(--panel)/0.82)] to-[rgb(var(--panel)/0.25)]" />
              <div className="relative flex h-full flex-col">
                <div className="flex items-center justify-between gap-4">
                  <span className="now-desk-label"><BookOpen className="h-3.5 w-3.5" />最近文章</span>
                  <time className="now-desk-date" dateTime={latestEssay.date}>{longDate(latestEssay.date)}</time>
                </div>
                <div className="mt-auto pt-16 sm:pt-24">
                  <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight transition-colors group-hover:text-[rgb(var(--accent))] sm:text-4xl">
                    {latestEssay.title}
                  </h2>
                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-[rgb(var(--text)/0.7)]">
                    {latestEssay.summary}
                  </p>
                  <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[rgb(var(--accent))]">
                    閱讀文章 <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          )}
        </section>

        <div className="mt-20 grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-20">
          <section aria-labelledby="recent-heading">
            <div className="now-desk-section-heading">
              <div>
                <div className="now-desk-kicker">NOTES &amp; POSTS</div>
                <h2 id="recent-heading" className="mt-3 font-serif text-3xl font-bold tracking-tight">最近寫下來的</h2>
              </div>
            </div>

            <div>
              {recentYears.map((year) => {
                const yearEntries = recent.filter((entry) => entry.date.startsWith(year));
                return (
                  <section key={year} className="now-desk-year-group" aria-label={`${year} 年內容`}>
                    <div className="now-desk-year-heading">
                      <span>{year}</span>
                      <span>{String(yearEntries.length).padStart(2, "0")}</span>
                    </div>
                    <div className="now-desk-list">
                      {yearEntries.map((entry) => {
                        const showImage = entry.kind === "post" && entry.image;
                        return (
                          <Link
                            key={entry.id}
                            href={entry.href}
                            className={showImage ? "now-desk-row now-desk-row-with-image group" : "now-desk-row group"}
                          >
                            <time className="now-desk-row-date" dateTime={entry.date}>{shortDate(entry.date)}</time>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={entry.kind === "note" ? "now-desk-type" : "now-desk-type now-desk-type-post"}>
                                  {entry.kind === "note" ? "近況" : "文章"}
                                </span>
                                {entry.tags.slice(0, 2).map((tag) => <span key={tag} className="text-[10px] text-[rgb(var(--muted))]">{tag}</span>)}
                              </div>
                              <h3 className="mt-2 font-serif text-xl font-bold leading-snug transition-colors group-hover:text-[rgb(var(--accent))]">
                                {entry.title}
                              </h3>
                              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[rgb(var(--muted))]">{entry.summary}</p>
                            </div>
                            {showImage && (
                              <div className="now-desk-row-image">
                                <Image src={entry.image} alt="" fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                              </div>
                            )}
                            <ArrowRight className="mt-1 h-4 w-4 text-[rgb(var(--muted))] transition group-hover:translate-x-1 group-hover:text-[rgb(var(--accent))]" />
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>

          <aside className="space-y-10">
            <section>
              <div className="now-desk-kicker flex items-center gap-2"><Heart className="h-3.5 w-3.5" />最近喜歡</div>
              <div className="mt-5 border-t border-[rgb(var(--line)/0.12)]">
                {favorites.map((item) => (
                  <Link key={item.id} href={libraryHref(item)} className="now-desk-favorite">
                    <span className="min-w-0">
                      <span className="block truncate font-serif font-bold">{item.title}</span>
                      <span className="mt-1 block font-mono text-[9px] uppercase tracking-wider text-[rgb(var(--muted))]">{item.category}</span>
                    </span>
                    {item.rating != null && <span className="font-mono text-xs text-[rgb(var(--accent))]">{item.rating}</span>}
                  </Link>
                ))}
              </div>
              <Link href="/library" className="now-desk-small-link">去 Library 看全部 →</Link>
            </section>

            <section className="now-desk-archive">
              <div className="now-desk-kicker">ARCHIVES</div>
              <p className="mt-4 text-sm leading-6 text-[rgb(var(--muted))]">想只看某一種內容，舊入口還留著。</p>
              <div className="mt-5 space-y-3 text-sm font-bold">
                <Link href="/talk" className="block hover:text-[rgb(var(--accent))]">{String(notes.length).padStart(2, "0")} 則近況 →</Link>
                <a href="#recent-heading" className="block hover:text-[rgb(var(--accent))]">{String(essays.length).padStart(2, "0")} 篇文章收在這裡 ↑</a>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <footer className="border-t border-[rgb(var(--line)/0.10)] py-8">
        <div className="mx-auto flex max-w-6xl justify-between px-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[rgb(var(--muted))] sm:px-6">
          <span>© {new Date().getFullYear()} Hawks</span>
          <span>Updated whenever</span>
        </div>
      </footer>
    </div>
  );
}
