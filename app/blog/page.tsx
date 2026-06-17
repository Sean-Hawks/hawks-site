import Link from "next/link";
import { ArrowRight, CalendarDays, FileText } from "lucide-react";
import { getAllTags, getSortedPostsData, tagToSlug } from "../lib/posts";
import ThemeStyles from "../components/ThemeStyles";
import Header from "../components/Header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Hawks 的文章、學習筆記、近況和一些有興趣才會寫下來的東西。",
  alternates: {
    canonical: "https://hawks.tw/blog/",
  },
  openGraph: {
    title: "Blog",
    description: "Hawks 的文章、學習筆記、近況和一些有興趣才會寫下來的東西。",
    url: "https://hawks.tw/blog/",
    images: ["/og/default.png"],
  },
};

export default function BlogPage() {
  const posts = getSortedPostsData();
  const tags = getAllTags();

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-10 py-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                Blog 目錄
              </h3>
              <nav className="space-y-1.5 border-l border-[rgb(var(--line)/0.10)] pl-4">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block truncate rounded-r-md py-1 text-sm leading-6 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
                  >
                    {post.title}
                  </Link>
                ))}
              </nav>

              <div className="pt-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/blog/tag/${tag.slug}`}
                      className="rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.72)] px-2.5 py-1 text-xs text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
                    >
                      {tag.tag}
                      <span className="ml-1 opacity-60">{tag.count}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-8 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.10)] sm:p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                <FileText className="h-3.5 w-3.5" />
                Writing
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Blog</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
                    筆記、近況與一些有興趣才會寫下來的東西。
                  </p>
                </div>
                <div className="rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel2))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
                  {posts.length} posts
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 lg:hidden">
                {tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/blog/tag/${tag.slug}`}
                    className="rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel2))] px-3 py-1.5 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
                  >
                    {tag.tag}
                    <span className="ml-1 opacity-60">{tag.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-4">
                {posts.map((post) => (
                        <article key={post.slug} className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.08)] transition-colors hover:border-[rgb(var(--accent)/0.28)] sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--line)/0.05)] px-2 py-1">
                                    <CalendarDays className="h-3.5 w-3.5" />
                                    <time>{post.date}</time>
                                </span>
                                {post.tags.map(tag => (
                                    <Link key={tag} href={`/blog/tag/${tagToSlug(tag)}`} className="rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-1 font-medium text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.16)]">
                                        {tag}
                                    </Link>
                                ))}
                            </div>

                            <Link href={`/blog/${post.slug}`} className="group flex gap-4">
                              <div className="flex-1">
                                <h2 className="text-xl font-bold leading-snug text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))] sm:text-2xl">
                                {post.title}
                                </h2>
                                <p className="mt-2 line-clamp-2 text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
                                  {post.desc}
                                </p>
                              </div>
                              <ArrowRight className="mt-1 hidden h-5 w-5 flex-shrink-0 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))] sm:block" />
                            </Link>
                        </article>
                ))}
            </div>
          </div>
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))] text-center">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
        </footer>
      </div>
    </div>
  );
}
