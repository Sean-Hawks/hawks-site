import type { Metadata } from "next";
import { ArrowUpRight, BookMarked, Users } from "lucide-react";
import Header from "../components/Header";
import SignalPageHeader from "../components/SignalPageHeader";
import ThemeStyles from "../components/ThemeStyles";
import { friendSites, recommendedBlogs } from "../data/blogroll";

const siteUrl = "https://hawks.tw";
const description = "部落卷：我推薦的個人部落格，以及朋友們的網站。";

export const metadata: Metadata = {
  title: "Blogroll",
  description,
  alternates: {
    canonical: `${siteUrl}/blogroll/`,
  },
  openGraph: {
    title: "Blogroll",
    description,
    url: `${siteUrl}/blogroll/`,
    images: ["/og/default.png"],
  },
};

function hostOf(href: string) {
  return new URL(href).hostname.replace(/^www\./, "");
}

export default function BlogrollPage() {
  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10 sm:px-3">
        <SignalPageHeader
          code="09 / NETWORK"
          title="部落卷"
          description="逛了很多人的部落格，整理出值得推薦的幾個，還有朋友們的網站。"
          statLabel="Links"
          statValue={String(recommendedBlogs.length + friendSites.length).padStart(2, "0")}
        />

        <section id="reads" aria-labelledby="reads-title" className="home-panel scroll-mt-24 p-5 sm:p-7">
          <div className="signal-section-title mb-2">
            <BookMarked className="h-3.5 w-3.5" />
            Recommended Blogs
          </div>
          <h2 id="reads-title" className="mb-5 text-2xl font-bold">推薦好文</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {recommendedBlogs.map(blog => (
              <li key={blog.href}>
                <a
                  href={blog.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.28)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold leading-snug group-hover:text-[rgb(var(--accent))]">{blog.name}</h3>
                    <ArrowUpRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[rgb(var(--muted))]" />
                  </div>
                  <div className="mt-1 font-mono text-xs text-[rgb(var(--muted))]">{hostOf(blog.href)}</div>
                  <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))]">{blog.note}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section id="friends" aria-labelledby="friends-title" className="home-panel mt-6 scroll-mt-24 p-5 sm:p-7">
          <div className="signal-section-title mb-2">
            <Users className="h-3.5 w-3.5" />
            Tomodachi
          </div>
          <h2 id="friends-title" className="mb-5 text-2xl font-bold">偷摸搭機</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {friendSites.map(site => (
              <li key={site.href}>
                <a
                  href={site.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] p-4 transition-colors hover:border-[rgb(var(--accent)/0.28)]"
                >
                  <div className="min-w-0">
                    <div className="font-bold group-hover:text-[rgb(var(--accent))]">{site.name}</div>
                    <div className="mt-0.5 truncate font-mono text-xs text-[rgb(var(--muted))]">{hostOf(site.href)}</div>
                  </div>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[rgb(var(--muted))]" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
