import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText, Presentation, Rss, Video } from "lucide-react";
import { getSortedTalksData } from "../../lib/talks";
import { getSortedPostsData } from "../../lib/posts";
import ThemeStyles from "../../components/ThemeStyles";
import Header from "../../components/Header";
import MarkdownContent from "../../components/MarkdownContent";
import type { Metadata } from "next";
import { getRelatedPostsForTalk } from "../../lib/related";

export async function generateStaticParams() {
  const talks = getSortedTalksData();
  return talks.map((talk) => ({
    slug: talk.id,
  }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const talk = getSortedTalksData().find((t) => t.id === slug);
  const title = talk ? `${talk.title} | Hawks Talks` : "Talk 未找到 | Hawks";
  const descriptionSource = talk?.subtitle || talk?.desc;
  const description = descriptionSource ? descriptionSource.replace(/\s+/g, " ").slice(0, 150) : "Hawks 的分享與紀錄";
  const url = talk ? `https://hawks.tw/talk/${talk.id}/` : "https://hawks.tw/talk/";
  const image = talk?.ogImage || (talk ? `/og/talk-${talk.id}.png` : "/og/default.png");

  return {
    metadataBase: new URL("https://hawks.tw"),
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "hawks.tw",
      publishedTime: talk?.date,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    icons: [{ rel: "icon", url: "/avatar.jpg" }],
  };
}

export default async function TalkDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const talks = getSortedTalksData();
  const posts = getSortedPostsData();
  const talk = talks.find((t) => t.id === slug);
  const content = talk?.desc;
  const relatedPosts = talk ? getRelatedPostsForTalk(talk, posts) : [];

  if (!talk) {
    return (
      <div className="site-shell min-h-screen text-[rgb(var(--text))]">
        <ThemeStyles />
        <Header />
        <main className="p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Talk 未找到</h1>
          <Link href="/talk" className="mt-4 text-[rgb(var(--accent))] hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            回到 Talks
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-6">
        <main className="mx-auto max-w-[900px] py-10 sm:py-16">
          <Link 
            href="/talk"
            className="group mb-10 inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
          >
            <div className="grid h-8 w-8 place-items-center rounded-full border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.035)] transition-colors group-hover:border-[rgb(var(--accent)/0.32)] group-hover:bg-[rgb(var(--accent)/0.08)]">
              <ArrowLeft className="h-4 w-4" />
            </div>
            <span>回到 Talk Archive</span>
          </Link>

          <article className="talk-article-shell overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(90,76,55,0.16)]">
            {talk.banner && (
              <div className="overflow-hidden border-b border-[rgb(var(--line)/0.10)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={talk.banner}
                  alt={talk.title}
                  className="max-h-[500px] w-full object-cover"
                />
              </div>
            )}

            <header className="talk-article-header border-b border-[rgb(var(--line)/0.10)] p-6 sm:p-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.12)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
                <FileText className="h-3.5 w-3.5" />
                Note
              </div>

              {talk.tags && talk.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {talk.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-[rgb(var(--accent)/0.10)] px-2.5 py-1 text-xs font-medium text-[rgb(var(--accent))]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl font-bold leading-tight text-[rgb(var(--text))] sm:text-4xl">
                {talk.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--muted))]">
                <time className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--muted))] opacity-50" />
                  {talk.date}
                </time>
                {talk.event && (
                  <span>{talk.event}</span>
                )}
              </div>

              {talk.subtitle && (
                <MarkdownContent
                  content={talk.subtitle}
                  variant="talk"
                  className="mt-7 [&>div]:my-0 [&>div]:text-xl [&>div]:font-medium [&>div]:leading-10 [&>div]:text-[rgb(var(--text)/0.92)] sm:[&>div]:text-2xl sm:[&>div]:leading-[2.8rem]"
                />
              )}

              {(talk.slides || talk.video) && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {talk.slides && (
                    <a href={talk.slides} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.26)] bg-[rgb(var(--accent)/0.10)] px-4 py-2 text-sm font-bold text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.15)]">
                      <Presentation className="h-4 w-4" /> Slides
                    </a>
                  )}
                  {talk.video && (
                    <a href={talk.video} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--line)/0.04)] px-4 py-2 text-sm font-bold text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--line)/0.07)]">
                      <Video className="h-4 w-4" /> Video
                    </a>
                  )}
                </div>
              )}
            </header>

            <div className="p-6 sm:p-10">
              <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                <span className="h-px w-8 bg-[rgb(var(--accent)/0.45)]" />
                Note
              </div>
              <MarkdownContent content={content} variant="talk" />
            </div>
          </article>

          {relatedPosts.length > 0 && (
            <section className="mt-14 border-t border-[rgb(var(--line)/0.10)] pt-7">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[rgb(var(--accent))]" />
                <h2 className="font-bold">Related Blog</h2>
              </div>
              <div className="grid gap-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group rounded-xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.025)] p-4 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--line)/0.045)]"
                  >
                    <div className="text-xs text-[rgb(var(--muted))]">{post.date}</div>
                    <div className="mt-1 font-bold transition-colors group-hover:text-[rgb(var(--accent))]">{post.title}</div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">{post.desc}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10 grid gap-3 border-t border-[rgb(var(--line)/0.10)] pt-7 sm:grid-cols-2">
            <Link
              href="/talk"
              className="group rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.025)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--line)/0.045)]"
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                <FileText className="h-3.5 w-3.5 text-[rgb(var(--accent))]" />
                Archive
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">看其他 Talk</span>
                <ArrowUpRight className="h-4 w-4 text-[rgb(var(--muted))]" />
              </div>
            </Link>
            <Link
              href="/subscribe"
              className="group rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.025)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--line)/0.045)]"
            >
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                <Rss className="h-3.5 w-3.5 text-[rgb(var(--accent))]" />
                Subscribe
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-bold transition-colors group-hover:text-[rgb(var(--accent))]">收到之後的更新</span>
                <ArrowUpRight className="h-4 w-4 text-[rgb(var(--muted))]" />
              </div>
            </Link>
          </section>
        </main>

        <footer className="mx-auto max-w-3xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))] text-center">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
        </footer>
      </div>
    </div>
  );
}
