import Link from "next/link";
import { ArrowRight, FileText, Mic2, Sparkles } from "lucide-react";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { excerpt } from "../lib/content";

export const metadata = {
  title: "Now",
  description: "Hawks 最近更新的文章與分享紀錄。",
};

function toTimestamp(date: string) {
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function NowPage() {
  const posts = getSortedPostsData();
  const talks = getSortedTalksData();
  const latestItems = [
    ...posts.map((post) => ({
      id: `post-${post.slug}`,
      type: "Blog",
      href: `/blog/${post.slug}`,
      title: post.title,
      date: post.date,
      desc: post.desc,
      Icon: FileText,
    })),
    ...talks.map((talk) => ({
      id: `talk-${talk.id}`,
      type: talk.event || "Now",
      href: `/talk/${talk.id}`,
      title: talk.title,
      date: talk.date,
      desc: excerpt(talk.desc, 140),
      Icon: Mic2,
    })),
  ]
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date))
    .slice(0, 8);

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
              自動整理最近公開的文章與分享紀錄。這頁不用特別維護，寫新內容就會跟著更新。
            </p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">Latest Updates</div>
              <h2 className="mt-1 text-2xl font-bold">最新公開的內容</h2>
            </div>
            <div className="flex gap-4 text-sm">
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]">
                Blog
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
                  className="group grid gap-3 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))] sm:grid-cols-[auto_1fr]"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--accent))]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                      <span>{item.type}</span>
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
