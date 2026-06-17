import Link from "next/link";
import { ArrowRight, BookOpenText, FileText, Mic2, Sparkles } from "lucide-react";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { getAllLibraryItems } from "../lib/library";
import { excerpt } from "../lib/content";
import type { Metadata } from "next";

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
  const latestItems = [
    ...talks.map((talk) => ({
      id: `talk-${talk.id}`,
      type: talk.event || "Now",
      href: `/talk/${talk.id}`,
      title: talk.title,
      date: talk.date,
      desc: excerpt(talk.desc, 140),
      Icon: Mic2,
    })),
    ...libraryItems
      .filter((item) => item.hasReview)
      .map((item) => ({
        id: `library-${item.slug}`,
        type: "Library Review",
        href: `/library/${item.category}/${item.slug}`,
        title: `評論：${item.title}`,
        date: item.date,
        desc: item.note,
        Icon: BookOpenText,
      })),
  ]
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
    .slice(0, 6);

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <section className="mb-8 rounded-2xl border border-[rgb(var(--accent)/0.16)] bg-gradient-to-br from-[rgb(var(--panel2)/0.92)] via-[rgb(var(--panel)/0.86)] to-[rgb(var(--accent)/0.07)] p-5 shadow-[0_24px_80px_rgba(90,76,55,0.16)] sm:p-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.26)] bg-[rgb(var(--accent)/0.12)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
            <Sparkles className="h-3.5 w-3.5" />
            Now
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">最近更新</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
              最近公開的文章、評論與分享紀錄。
            </p>
          </div>
        </section>

        {latestBlog && (
          <section className="mb-8 rounded-2xl border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--panel)/0.90)] p-5 shadow-[0_20px_64px_rgba(90,76,55,0.12)] sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                  <FileText className="h-3.5 w-3.5" />
                  Blog
                </div>
                <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">最新長文</h2>
              </div>
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]">
                Blog Archive
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <Link
              href={`/blog/${latestBlog.slug}`}
              className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-gradient-to-br from-[rgb(var(--panel2)/0.68)] to-[rgb(var(--accent)/0.06)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.30)] sm:p-6"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="rounded-md border border-[rgb(var(--accent)/0.16)] bg-[rgb(var(--accent)/0.08)] px-2 py-0.5 font-bold text-[rgb(var(--accent))]">
                  Longform
                </span>
                <span>·</span>
                <time>{latestBlog.date}</time>
              </div>
              <h3 className="text-xl font-bold leading-snug text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))] sm:text-2xl">
                {latestBlog.title}
              </h3>
              {latestBlog.desc && (
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
                  {latestBlog.desc}
                </p>
              )}
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[rgb(var(--accent))]">
                Read article
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </section>
        )}

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full border border-[rgb(var(--accent)/0.20)] bg-[rgb(var(--accent)/0.08)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                Latest Updates
              </div>
              <h2 className="mt-1 text-2xl font-bold">短更新與評論</h2>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href="/library" className="inline-flex items-center gap-1.5 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]">
                Library
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/talk" className="inline-flex items-center gap-1.5 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]">
                Archive
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {latestItems.map((item) => {
              const Icon = item.Icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group grid gap-3 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] p-5 shadow-[0_16px_48px_rgba(90,76,55,0.08)] transition-colors hover:border-[rgb(var(--accent)/0.30)] hover:bg-[rgb(var(--panel))] sm:grid-cols-[auto_1fr]"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-[rgb(var(--accent)/0.20)] bg-[rgb(var(--accent)/0.09)] text-[rgb(var(--accent))] transition-colors group-hover:bg-[rgb(var(--accent)/0.14)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                      <span className="rounded-md border border-[rgb(var(--accent)/0.16)] bg-[rgb(var(--accent)/0.08)] px-2 py-0.5 font-bold text-[rgb(var(--accent))]">
                        {item.type}
                      </span>
                      <span>·</span>
                      <time>{item.date}</time>
                    </div>
                    <h3 className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">{item.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
