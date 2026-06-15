import Link from "next/link";
import { ArrowRight, Hash } from "lucide-react";
import Header from "./Header";
import ThemeStyles from "./ThemeStyles";
import { getAllTags, getPostsByTagSlug } from "../lib/posts";

export default function TagsIndex() {
  const tags = getAllTags();

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <div className="mb-8 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgb(var(--line)/0.08)] sm:p-6">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
            <Hash className="h-3.5 w-3.5" />
            Tags
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Tags</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            用 tag 當主要索引。使用越多次的 tag 會排越前面，平常只要維護文章 frontmatter 的 tags 就好。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tags.map((tag) => {
            const posts = getPostsByTagSlug(tag.slug).slice(0, 3);

            return (
              <section
                key={tag.slug}
                className="rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 shadow-[0_18px_60px_rgb(var(--line)/0.07)]"
              >
                <Link
                  href={`/blog/tag/${tag.slug}`}
                  className="group flex items-center justify-between gap-4"
                >
                  <div>
                    <h2 className="text-xl font-bold transition-colors group-hover:text-[rgb(var(--accent))]">
                      {tag.tag}
                    </h2>
                    <div className="mt-1 text-sm text-[rgb(var(--muted))]">
                      {tag.count} 篇文章
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))]" />
                </Link>

                <div className="mt-5 space-y-3">
                  {posts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="block rounded-xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.025)] p-4 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--line)/0.045)]"
                    >
                      <div className="text-xs text-[rgb(var(--muted))]">{post.date}</div>
                      <div className="mt-1 line-clamp-1 font-bold">{post.title}</div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
