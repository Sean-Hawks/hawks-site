import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Calendar, FileText, Presentation, Rss, Video } from "lucide-react";
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

function splitTalkContent(content = "") {
  const trimmed = content.trim();
  if (!trimmed) return { lead: "", body: "" };

  const blocks = trimmed.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const firstBlock = blocks[0] ?? "";
  const canUseLead =
    blocks.length > 1 &&
    !firstBlock.startsWith("#") &&
    !firstBlock.startsWith("!") &&
    !firstBlock.startsWith("```") &&
    firstBlock.length >= 20 &&
    firstBlock.length <= 220;

  if (!canUseLead) {
    return { lead: "", body: trimmed };
  }

  return {
    lead: firstBlock,
    body: blocks.slice(1).join("\n\n"),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const talk = getSortedTalksData().find((t) => t.id === slug);
  const title = talk ? `${talk.title} | Hawks Talks` : "Talk 未找到 | Hawks";
  const description = talk?.desc ? talk.desc.replace(/\s+/g, " ").slice(0, 150) : "Hawks 的分享與紀錄";
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
  const { lead, body } = splitTalkContent(content);

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

      <div className="w-full px-4 sm:px-3">
        <main className="max-w-4xl mx-auto py-8">
          <Link 
            href="/talk"
            className="group inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] transition-colors mb-6"
          >
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] group-hover:bg-[rgb(var(--accent)/0.10)] transition-colors">
                <ArrowLeft className="h-4 w-4" />
            </div>
            <span>回到 Talk Archive</span>
          </Link>

          <article className="overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] shadow-[0_22px_70px_rgba(90,76,55,0.12)]">
            <div className="border-b border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel2)/0.58)] p-6 sm:p-10">
                {talk.banner && (
                  <div className="-mx-6 -mt-6 mb-8 sm:-mx-10 sm:-mt-10 border-b border-[rgb(var(--line)/0.10)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={talk.banner}
                      alt={talk.title}
                      className="w-full h-auto max-h-[500px] object-cover"
                    />
                  </div>
                )}
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[rgb(var(--muted))]">
                  <span className="rounded-full border border-[rgb(var(--accent)/0.20)] bg-[rgb(var(--accent)/0.08)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--accent))]">
                    Talk
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {talk.date}
                  </span>
                  {talk.event && (
                    <span className="rounded bg-[rgb(var(--line)/0.06)] px-2.5 py-0.5 text-xs">
                      {talk.event}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-[rgb(var(--text))]">
                    {talk.title}
                </h1>

                {lead && (
                  <div className="mt-6 rounded-2xl border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent)/0.08)] p-5">
                    <div className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                      Opening Note
                    </div>
                    <MarkdownContent content={lead} variant="talkLead" />
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  {talk.slides && (
                    <a href={talk.slides} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-4 py-2 text-sm font-bold text-[rgb(var(--accent-foreground))] hover:opacity-90 transition-opacity">
                      <Presentation className="h-4 w-4" /> View Slides
                    </a>
                  )}
                  {talk.video && (
                    <a href={talk.video} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.05)] px-4 py-2 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--line)/0.08)] transition-colors">
                      <Video className="h-4 w-4" /> Watch Video
                    </a>
                  )}
                </div>
            </div>

            <div className="p-6 sm:p-10">
              <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                  <span className="h-px w-8 bg-[rgb(var(--accent)/0.45)]" />
                  Note
                </div>
                <MarkdownContent content={body || content} variant="talk" />
              </div>
            </div>
          </article>

          {relatedPosts.length > 0 && (
            <section className="mt-6 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5">
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

          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/talk"
              className="group rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.70)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--panel)/0.90)]"
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
              className="group rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.70)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--panel)/0.90)]"
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
