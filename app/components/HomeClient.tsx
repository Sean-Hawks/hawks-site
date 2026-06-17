import Link from "next/link";
import { ArrowRight, Clapperboard, FileText, NotebookText, Search } from "lucide-react";
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

function excerpt(value = "", length = 120) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
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
            <ReadmeSection posts={posts} talks={talks} libraryItems={libraryItems} />
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
              className="group flex items-center gap-4 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5 shadow-[0_18px_60px_rgb(var(--line)/0.06)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
            >
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--accent))]">
                <NotebookText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">Now</div>
                <div className="text-sm leading-6 text-[rgb(var(--muted))]">最近更新、短筆記和一些分享紀錄。</div>
              </div>
            </Link>
          </div>

          <SectionHeader
            eyebrow="Latest Blog"
            title="最近寫下來的東西"
            desc="把近況、筆記和想到的東西整理成比較能回頭看的樣子。"
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
            desc="比較像狀態更新，也放一些演講、教學和生活碎片。"
            href="/now"
          />
          <div className="grid gap-3 lg:grid-cols-3">
            {latestTalks.map((talk) => (
              <Link
                key={talk.id}
                href={`/talk/${talk.id}`}
                className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.82)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.07)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
              >
                <div className="mb-3 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
                  <NotebookText className="h-3.5 w-3.5" />
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
            desc="目前先保留簡潔列表，之後可以慢慢補完整案例頁。"
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
