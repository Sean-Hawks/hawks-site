/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSortedPostsData, getPostBySlug } from "../../lib/posts";
import ThemeStyles from "../../components/ThemeStyles";
import MarkdownContent from "../../components/MarkdownContent";

export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Next.js 15: params is a Promise
type PageProps = { params: Promise<{ slug: string }> };

function buildToc(content?: string) {
  if (!content) return [];
  const lines = content.split("\n");
  return lines
    .map((line) => {
      const match = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (!match) return null;
      const level = match[1].length; // 1~3
      const title = match[2].trim();
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return { id, title, level };
    })
    .filter(Boolean) as { id: string; title: string; level: number }[];
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const toc = buildToc(post?.content);

  if (!post) {
    return (
      <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
        <ThemeStyles />
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
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <ThemeStyles />

      <div className="w-full px-4 sm:px-3">
        {/* 調整頂部間距：從 pt-28 改為 pt-24 */}
        <main className="max-w-6xl mx-auto pt-24 pb-12 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-10">
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
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[rgba(255,255,255,0.06)] group-hover:bg-[rgba(251,191,36,0.1)] transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span>回到列表</span>
            </Link>

            <article className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] overflow-hidden shadow-xl">
              <div className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-6 sm:p-10">
                {post.banner && (
                  <div className="-mx-6 -mt-6 mb-8 sm:-mx-10 sm:-mt-10 border-b border-[rgba(255,255,255,0.06)]">
                    <img
                      src={post.banner}
                      alt={post.title}
                      className="w-full h-auto max-h-[500px] object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-2.5 py-1 rounded-md bg-[rgba(251,191,36,0.1)] text-[rgb(var(--accent))]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))] mb-1">
                  {post.date}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-[rgb(var(--text))]">
                  {post.title}
                </h1>
                <div className="mt-4 flex items-center gap-4 text-sm text-[rgb(var(--muted))]">
                  <time className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--muted))] opacity-50"></span>
                    {post.date}
                  </time>
                </div>
              </div>

              <div className="p-6 sm:p-10">
                <MarkdownContent content={post.content} />
              </div>
            </article>
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
