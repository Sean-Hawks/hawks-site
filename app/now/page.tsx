import Link from "next/link";
import { ArrowRight, FileText, Mic2, Sparkles } from "lucide-react";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import ProjectsSection from "../components/ProjectsSection";
import { getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { excerpt } from "../lib/content";

export const metadata = {
  title: "Now",
  description: "Hawks 最近更新的文章、分享與作品。",
};

export default function NowPage() {
  const posts = getSortedPostsData();
  const talks = getSortedTalksData();
  const latestPosts = posts.slice(0, 3);
  const latestTalks = talks.slice(0, 3);

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <section className="mb-8 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] p-5 shadow-[0_22px_70px_rgb(var(--line)/0.10)] sm:p-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
            <Sparkles className="h-3.5 w-3.5" />
            Now
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">最近更新</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
              自動整理最近的文章、分享紀錄和 projects。這頁不用特別維護，寫新內容就會跟著更新。
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">Latest Blog</div>
                <h2 className="mt-1 text-2xl font-bold">最近寫下來的東西</h2>
              </div>
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]">
                Blog
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {latestPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <FileText className="h-3.5 w-3.5" />
                    <time>{post.date}</time>
                  </div>
                  <h3 className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">{post.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">{post.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">Talk Archive</div>
                <h2 className="mt-1 text-2xl font-bold">分享與紀錄</h2>
              </div>
              <Link href="/talk" className="inline-flex items-center gap-1.5 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]">
                Archive
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {latestTalks.map((talk) => (
                <Link
                  key={talk.id}
                  href={`/talk/${talk.id}`}
                  className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <Mic2 className="h-3.5 w-3.5" />
                    <time>{talk.date}</time>
                    {talk.event && <span>{talk.event}</span>}
                  </div>
                  <h3 className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">{talk.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">{excerpt(talk.desc, 110)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <ProjectsSection showTitle />
        </section>
      </main>
    </div>
  );
}
