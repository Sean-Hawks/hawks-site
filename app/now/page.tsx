import type { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { getAllLibraryItems } from "../lib/library";
import { excerpt } from "../lib/content";

export const metadata: Metadata = {
  title: "Now",
  description: "Hawks 最近公開的文章、Library 評論、短筆記與分享紀錄。",
  alternates: {
    canonical: "https://hawks.tw/now/",
  },
  openGraph: {
    title: "Now",
    description: "Hawks 最近公開的文章、Library 評論、短筆記與分享紀錄。",
    url: "https://hawks.tw/now/",
    images: ["/og/default.png"],
  },
};

function toTimestamp(date: string) {
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function NowPage() {
  const posts = getSortedPostsData();
  const talks = getSortedTalksData();
  const libraryItems = getAllLibraryItems();
  const latestBlog = posts[0];
  const updates = [
    ...talks.map((talk) => ({
      id: `talk-${talk.id}`,
      kind: "Talk",
      type: talk.event || "Now",
      href: `/talk/${talk.id}`,
      title: talk.title,
      date: talk.date,
      desc: excerpt(talk.desc, 180),
    })),
    ...libraryItems
      .filter((item) => item.hasReview)
      .map((item) => ({
        id: `library-${item.slug}`,
        kind: "Library",
        type: "Library Review",
        href: `/library/${item.category}/${item.slug}`,
        title: `評論：${item.title}`,
        date: item.date,
        desc: item.note,
      })),
  ]
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
    .slice(0, 12);

  const lastUpdated = [latestBlog?.date, updates[0]?.date]
    .filter((date): date is string => Boolean(date))
    .sort((a, b) => toTimestamp(b) - toTimestamp(a))[0];

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_190px]">
          <article className="min-w-0 max-w-3xl">
            <header className="border-b border-[rgb(var(--line)/0.14)] pb-9">
              <div className="text-sm font-semibold tracking-[0.12em] text-[rgb(var(--accent))]">
                NOW
              </div>
              <h1 className="mt-2 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                最近更新
                <code className="ml-3 inline-block rounded-md border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.04)] px-2 py-1 align-middle font-mono text-base font-normal tracking-normal text-[rgb(var(--muted))] sm:text-lg">
                  /now
                </code>
              </h1>
              {lastUpdated && (
                <p className="mt-4 text-sm italic text-[rgb(var(--muted))]">
                  最後更新：{lastUpdated}
                </p>
              )}
              <p className="mt-6 max-w-2xl text-base leading-8 text-[rgb(var(--muted))] sm:text-[1.05rem]">
                文章、短筆記、作品評論，以及最近留在這個網站上的東西。這裡不追求完整，
                只是讓近況有一個不被演算法沖走的地方。
              </p>
            </header>

            {latestBlog && (
              <section id="latest-blog" className="scroll-mt-24 border-b border-[rgb(var(--line)/0.14)] py-10">
                <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                  📝 最近寫的長文
                </h2>
                <Link href={`/blog/${latestBlog.slug}`} className="group mt-6 block">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <span className="font-semibold text-[rgb(var(--accent))]">Blog</span>
                    <span aria-hidden>·</span>
                    <time>{latestBlog.date}</time>
                  </div>
                  <h3 className="mt-2 font-serif text-2xl font-bold leading-snug tracking-tight transition-colors group-hover:text-[rgb(var(--accent))] sm:text-3xl">
                    {latestBlog.title}
                  </h3>
                  {latestBlog.desc && (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
                      {latestBlog.desc}
                    </p>
                  )}
                  <span className="mt-4 inline-block border-b border-[rgb(var(--accent)/0.35)] pb-0.5 text-sm font-semibold text-[rgb(var(--accent))]">
                    Read article →
                  </span>
                </Link>
              </section>
            )}

            <section id="updates" className="scroll-mt-24 border-b border-[rgb(var(--line)/0.14)] py-10">
              <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                ✦ 最近留下的
              </h2>
              <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))]">
                短更新、活動紀錄和 Library 評論，依日期排列。
              </p>

              <div className="mt-6 divide-y divide-[rgb(var(--line)/0.12)] border-y border-[rgb(var(--line)/0.12)]">
                {updates.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group grid gap-2 py-6 transition-colors sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-6"
                  >
                    <div className="flex items-center gap-2 text-xs text-[rgb(var(--muted))] sm:block">
                      <time className="tabular-nums">{item.date}</time>
                      <div className="text-[rgb(var(--accent))] sm:mt-2">{item.kind}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold tracking-[0.06em] text-[rgb(var(--muted))]">
                        {item.type}
                      </div>
                      <h3 className="mt-1 text-lg font-bold leading-snug transition-colors group-hover:text-[rgb(var(--accent))] sm:text-xl">
                        {item.title}
                      </h3>
                      {item.desc && (
                        <p className="mt-2 line-clamp-3 text-sm leading-7 text-[rgb(var(--muted))]">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section id="archives" className="scroll-mt-24 py-10">
              <h2 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
                ↗ 繼續往下逛
              </h2>
              <ul className="mt-5 divide-y divide-[rgb(var(--line)/0.12)] border-y border-[rgb(var(--line)/0.12)]">
                {[
                  ["Blog", "完整文章與學習筆記", "/blog"],
                  ["Talk", "短更新與活動紀錄", "/talk"],
                  ["Library", "動畫、音樂、電影與遊戲收藏", "/library"],
                  ["Subscribe", "用 RSS 跟上網站更新", "/subscribe"],
                ].map(([label, description, href]) => (
                  <li key={href}>
                    <Link href={href} className="group flex items-center justify-between gap-5 py-4">
                      <span>
                        <strong className="font-serif text-lg">{label}</strong>
                        <span className="ml-3 text-sm text-[rgb(var(--muted))]">{description}</span>
                      </span>
                      <span className="text-[rgb(var(--muted))] transition-transform group-hover:translate-x-1 group-hover:text-[rgb(var(--accent))]">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <aside className="hidden border-l border-[rgb(var(--line)/0.12)] pl-6 text-sm lg:sticky lg:top-24 lg:block">
            <div className="font-serif text-base font-bold">On this page</div>
            <nav className="mt-4 grid gap-3 text-[rgb(var(--muted))]">
              <a href="#latest-blog" className="transition-colors hover:text-[rgb(var(--accent))]">📝 最近寫的長文</a>
              <a href="#updates" className="transition-colors hover:text-[rgb(var(--accent))]">✦ 最近留下的</a>
              <a href="#archives" className="transition-colors hover:text-[rgb(var(--accent))]">↗ 繼續往下逛</a>
            </nav>
          </aside>
        </div>
      </main>
    </div>
  );
}
