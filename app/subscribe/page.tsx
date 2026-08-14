import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowUpRight,
  BookOpenText,
  Mail,
  Radio,
  Rss,
  Sparkles,
} from "lucide-react";
import Header from "../components/Header";
import SignalPageHeader from "../components/SignalPageHeader";
import ThemeStyles from "../components/ThemeStyles";

const siteUrl = "https://hawks.tw";
const feedUrl = `${siteUrl}/rss.xml`;
const followItAction =
  "https://api.follow.it/subscription-form/Vi81UUVRZnlrNys0RTZCcTZyTExTVHBwRUZjOXVxZCtVN2ZQYm9vcE1yZ2ttYjVWcWthekk1SUMzaE5qYm5lUXpWaXdLYmtKY09VaXdxVWxJVGN0OFhmRC9XMU1mbFZjenNyRU9pNmUvWGZ1K2dIYWJGQjJkYW4rY2h2bXlCRjF8M0VCWXY1c294cE5uN3N3V0FZVHdlWlovNVNSNXltRGRzRVRsMGRxejIyaz0=/8";

export const metadata: Metadata = {
  title: "Subscribe",
  description: "訂閱 hawks.tw 的 Blog、Talk 和 Library Review 更新。",
  alternates: {
    canonical: `${siteUrl}/subscribe/`,
  },
  openGraph: {
    title: "Subscribe",
    description: "訂閱 hawks.tw 的 Blog、Talk 和 Library Review 更新。",
    url: `${siteUrl}/subscribe/`,
    images: ["/og/default.png"],
  },
};

const readerLinks = [
  {
    name: "Feedly",
    href: `https://feedly.com/i/subscription/feed/${encodeURIComponent(feedUrl)}`,
  },
  {
    name: "Inoreader",
    href: `https://www.inoreader.com/search/feeds/${encodeURIComponent(feedUrl)}`,
  },
];

export default function SubscribePage() {
  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-3">
        <SignalPageHeader
          code="05 / BROADCAST"
          title="訂閱 hawks.tw"
          description="用 RSS reader 追蹤 Blog、Talk 和 Library Review；也可以直接訂閱 email 更新。"
          statLabel="Feeds"
          statValue="02"
        />

        <section className="home-panel p-5 sm:p-7">
          <div className="signal-section-title mb-5">
            <Rss className="h-3.5 w-3.5" />
            Choose a channel
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <a
              href="/rss.xml"
              className="group rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--line)/0.055)]"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.62)] text-[rgb(var(--accent))]">
                <Radio className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold transition-colors group-hover:text-[rgb(var(--accent))]">
                  RSS Feed
                </h2>
                <ArrowUpRight className="h-4 w-4 text-[rgb(var(--muted))]" />
              </div>
              <p className="mt-2 text-sm leading-7 text-[rgb(var(--muted))]">
                把 feed URL 加到 RSS reader，就會自動看到新的公開內容。
              </p>
              <code className="mt-4 block overflow-hidden text-ellipsis rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.70)] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                {feedUrl}
              </code>
            </a>

            <div className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] p-5">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.62)] text-[rgb(var(--accent))]">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold">
                  Email Updates
                </h2>
              </div>
              <p className="mt-2 text-sm leading-7 text-[rgb(var(--muted))]">
                輸入 email 後會交給 Follow.it 處理確認信與之後的更新通知。
              </p>
              <form
                action={followItAction}
                method="post"
                target="_blank"
                className="mt-4 grid gap-2"
              >
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter your email"
                  spellCheck={false}
                  className="h-11 w-full rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--bg)/0.55)] px-3 text-center text-sm text-[rgb(var(--text))] outline-none transition-colors placeholder:text-[rgb(var(--muted))] focus:border-[rgb(var(--accent)/0.36)]"
                />
                <button
                  type="submit"
                  className="h-11 rounded-xl bg-[rgb(var(--accent))] px-4 text-sm font-bold text-[#111114] transition-opacity hover:opacity-90"
                >
                  Subscribe
                </button>
              </form>
              <a
                href="https://follow.it"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--text))]"
              >
                Powered by follow.it
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              <BookOpenText className="h-3.5 w-3.5 text-[rgb(var(--accent))]" />
              What you get
            </div>
            <ul className="space-y-2 text-sm leading-7 text-[rgb(var(--muted))]">
              <li>Blog 文章</li>
              <li>Talk / 近況短筆記</li>
              <li>有寫正文的 Library Review</li>
              <li>依日期排序的最近 50 筆更新</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--accent))]" />
              Open in reader
            </div>
            <div className="grid gap-2">
              {readerLinks.map((reader) => (
                <a
                  key={reader.name}
                  href={reader.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] px-3 py-2 text-sm text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.22)] hover:text-[rgb(var(--text))]"
                >
                  <span>{reader.name}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ))}
              <Link
                href="/rss.xml"
                className="flex items-center justify-between rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] px-3 py-2 text-sm text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.22)] hover:text-[rgb(var(--text))]"
              >
                <span>Raw RSS</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
