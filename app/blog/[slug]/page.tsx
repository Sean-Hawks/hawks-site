import Link from "next/link";
import { ArrowLeft, FileText, Mic2 } from "lucide-react";
import { getSortedPostsData, getPostBySlug, tagToSlug } from "../../lib/posts";
import { getSortedTalksData } from "../../lib/talks";
import ThemeStyles from "../../components/ThemeStyles";
import Header from "../../components/Header";
import MarkdownContent, { headingId } from "../../components/MarkdownContent";
import type { Metadata } from "next";
import { excerpt, stripMarkdown } from "../../lib/content";
import { getRelatedTalksForPost } from "../../lib/related";

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Next.js 15: params is a Promise
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post ? post.title : "文章未找到";
  const description = post?.desc ?? "Hawks 的個人網站與部落格";
  const url = post ? `https://hawks.tw/blog/${post.slug}/` : "https://hawks.tw/blog/";
  const image = post?.ogImage || (post ? `/og/blog-${post.slug}.png` : "/og/default.png");

  return {
    title,
    description,
    keywords: post?.tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: "hawks.tw",
      publishedTime: post?.date,
      tags: post?.tags,
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
  };
}

function buildToc(content?: string) {
  if (!content) return [];
  const lines = content.split("\n");
  return lines
    .map((line) => {
      const match = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (!match) return null;
      const level = match[1].length; // 1~3
      const title = match[2].trim();
      const id = headingId(title);
      if (!id) return null;
      return { id, title, level };
    })
    .filter(Boolean) as { id: string; title: string; level: number }[];
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const posts = getSortedPostsData();
  const talks = getSortedTalksData();
  const postIndex = posts.findIndex((item) => item.slug === slug);
  const previousPost = postIndex >= 0 ? posts[postIndex + 1] : undefined;
  const nextPost = postIndex > 0 ? posts[postIndex - 1] : undefined;
  const readingMinutes = Math.max(1, Math.ceil(stripMarkdown(post?.content ?? "").length / 500));
  const relatedTalks = post ? getRelatedTalksForPost(post, talks) : [];
  const toc = buildToc(post?.content);

  if (!post) {
    return (
      <div className="site-shell min-h-screen text-[rgb(var(--text))]">
        <ThemeStyles />
        <Header />
        <main className="p-6 max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">文章未找到</h1>
          <Link href="/blog" className="mt-4 text-[rgb(var(--accent))] hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            回到 Blog
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
        <main className="max-w-6xl mx-auto py-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
          {/* 左側：目錄 */}
          <aside className="hidden lg:block">
            {/* 對應調整 sticky top：從 top-44 改為 top-40 */}
            <div className="sticky top-40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                目錄
              </h3>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] transition-colors truncate ${
                      item.level > 1 ? "ml-3" : ""
                    } ${item.level > 2 ? "ml-6" : ""}`}
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* 右側：文章 */}
          <div>
            <Link
              href="/blog"
              className="group inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] transition-colors mb-6"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] group-hover:bg-[rgb(var(--accent)/0.10)] transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span>回到列表</span>
            </Link>

            <article className="overflow-hidden rounded-2xl border border-[rgb(var(--accent)/0.16)] bg-[rgb(var(--panel)/0.90)] shadow-[0_24px_80px_rgba(90,76,55,0.16)]">
              <div className="border-b border-[rgb(var(--accent)/0.12)] bg-gradient-to-br from-[rgb(var(--panel2)/0.92)] via-[rgb(var(--panel)/0.72)] to-[rgb(var(--accent)/0.06)] p-6 sm:p-10">
                {post.banner && (
                  <div className="-mx-6 -mt-6 mb-8 sm:-mx-10 sm:-mt-10 border-b border-[rgb(var(--line)/0.10)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.banner}
                      alt={post.title}
                      className="w-full h-auto max-h-[500px] object-cover"
                    />
                  </div>
                )}

                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.12)] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
                  <FileText className="h-3.5 w-3.5" />
                  Blog
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog/tag/${tagToSlug(tag)}`}
                      className="text-xs font-medium px-2.5 py-1 rounded-md bg-[rgb(var(--accent)/0.10)] text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.16)]"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-[rgb(var(--text))]">
                  {post.title}
                </h1>
                <div className="mt-4 flex items-center gap-4 text-sm text-[rgb(var(--muted))]">
                  <time className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--muted))] opacity-50"></span>
                    {post.date}
                  </time>
                  <span>{readingMinutes} min read</span>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                <div className="mx-auto max-w-[760px]">
                  <MarkdownContent
                    content={post.content}
                    assetBasePath={`/images/posts/${post.slug}`}
                  />
                </div>
              </div>
            </article>

            <nav className="mt-6 grid gap-3 sm:grid-cols-2">
              {previousPost ? (
                <Link
                  href={`/blog/${previousPost.slug}`}
                  className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5 transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">上一篇</div>
                  <div className="mt-2 font-bold">{previousPost.title}</div>
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link
                  href={`/blog/${nextPost.slug}`}
                  className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5 text-right transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
                >
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">下一篇</div>
                  <div className="mt-2 font-bold">{nextPost.title}</div>
                </Link>
              ) : (
                <div />
              )}
            </nav>

            {relatedTalks.length > 0 && (
              <section className="mt-6 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Mic2 className="h-4 w-4 text-[rgb(var(--accent))]" />
                  <h2 className="font-bold">Related Talks</h2>
                </div>
                <div className="grid gap-3">
                  {relatedTalks.map((talk) => (
                    <Link
                      key={talk.id}
                      href={`/talk/${talk.id}`}
                      className="group rounded-xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.025)] p-4 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--line)/0.045)]"
                    >
                      <div className="text-xs text-[rgb(var(--muted))]">{talk.date}</div>
                      <div className="mt-1 font-bold transition-colors group-hover:text-[rgb(var(--accent))]">{talk.title}</div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">{excerpt(talk.desc, 100)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))] text-center">
          <div className="opacity-70">
            © {new Date().getFullYear()} Hawks • made to feel like a profile, not a resume.
          </div>
        </footer>
      </div>
    </div>
  );
}
