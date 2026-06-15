import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Hash } from "lucide-react";
import type { Metadata } from "next";
import Header from "../../../components/Header";
import ThemeStyles from "../../../components/ThemeStyles";
import { getAllTags, getPostsByTagSlug, getTagBySlug, tagToSlug } from "../../../lib/posts";

type PageProps = { params: Promise<{ tag: string }> };

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const tagInfo = getTagBySlug(tag);

  return {
    title: tagInfo ? `${tagInfo.tag} 文章索引` : "Tag 未找到",
    description: tagInfo ? `所有標籤為 ${tagInfo.tag} 的文章。` : "Hawks Blog tag index",
  };
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag } = await params;
  const tagInfo = getTagBySlug(tag);
  const posts = getPostsByTagSlug(tag);
  const allTags = getAllTags();

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <div className="mb-8 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.10)] sm:p-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
            <Hash className="h-3.5 w-3.5" />
            Tag Index
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            {tagInfo?.tag ?? `#${tag}`}
          </h1>
          <p className="mt-2 text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            {posts.length} 篇文章收在這個標籤底下。
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {allTags.map((item) => (
            <Link
              key={item.slug}
              href={`/blog/tag/${item.slug}`}
              className={[
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                item.slug === tagToSlug(tagInfo?.tag ?? tag)
                  ? "border-[rgb(var(--accent)/0.26)] bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]"
                  : "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.72)] text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]",
              ].join(" ")}
            >
              {item.tag}
              <span className="ml-1 opacity-60">{item.count}</span>
            </Link>
          ))}
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.08)] transition-colors hover:border-[rgb(var(--accent)/0.28)] sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--line)/0.05)] px-2 py-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <time>{post.date}</time>
                </span>
                {post.tags.map((postTag) => (
                  <Link
                    key={postTag}
                    href={`/blog/tag/${tagToSlug(postTag)}`}
                    className="rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-1 font-medium text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.16)]"
                  >
                    {postTag}
                  </Link>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`} className="group flex gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold leading-snug transition-colors group-hover:text-[rgb(var(--accent))] sm:text-2xl">
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
      </main>
    </div>
  );
}
