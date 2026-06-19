import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Hash } from "lucide-react";
import type { Metadata } from "next";
import Header from "../../../components/Header";
import ThemeStyles from "../../../components/ThemeStyles";
import { tagToSlug } from "../../../lib/posts";
import {
  getAllSiteTags,
  getSiteItemsByTagSlug,
  getSiteTagBySlug,
} from "../../../lib/site-tags";

type PageProps = { params: Promise<{ tag: string }> };

export function generateStaticParams() {
  return getAllSiteTags().map((tag) => ({ tag: tag.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const tagInfo = getSiteTagBySlug(tag);
  const title = tagInfo ? `${tagInfo.tag} 內容索引` : "Tag 未找到";
  const description = tagInfo ? `所有標籤為 ${tagInfo.tag} 的內容，包含 Blog 和 Library。` : "Hawks tag index";
  const url = `https://hawks.tw/blog/tag/${tag}/`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: ["/og/default.png"],
    },
  };
}

export default async function BlogTagPage({ params }: PageProps) {
  const { tag } = await params;
  const tagInfo = getSiteTagBySlug(tag);
  const items = getSiteItemsByTagSlug(tag);
  const allTags = getAllSiteTags();
  const activeTagSlug = tagToSlug(tagInfo?.tag ?? tag);
  const visibleTags = allTags.filter(
    (item, index) => index < 32 || item.slug === activeTagSlug
  );
  const hiddenTagCount = Math.max(0, allTags.length - visibleTags.length);

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <Link
          href="/search"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Search
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
            {items.length} 個內容收在這個標籤底下，包含 Blog 和 Library。
          </p>
        </div>

        <div className="mb-8 flex max-h-40 flex-wrap gap-2 overflow-y-auto pr-1">
          {visibleTags.map((item) => (
            <Link
              key={item.slug}
              href={`/blog/tag/${item.slug}`}
              className={[
                "max-w-full rounded-full border px-3 py-1.5 text-sm transition-colors",
                item.slug === activeTagSlug
                  ? "border-[rgb(var(--accent)/0.26)] bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--accent))]"
                  : "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.72)] text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]",
              ].join(" ")}
            >
              <span className="break-words">{item.tag}</span>
              <span className="ml-1 opacity-60">{item.count}</span>
            </Link>
          ))}
          {hiddenTagCount > 0 && (
            <Link
              href="/search"
              className="rounded-full border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-3 py-1.5 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
            >
              +{hiddenTagCount} tags
            </Link>
          )}
        </div>

        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="min-w-0 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.86)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.08)] transition-colors hover:border-[rgb(var(--accent)/0.28)] sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--line)/0.05)] px-2 py-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <time>{item.date}</time>
                </span>
                <span className="rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-1 font-medium text-[rgb(var(--accent))]">
                  {item.label}
                </span>
                {item.tags.map((postTag) => (
                  <Link
                    key={postTag}
                    href={`/blog/tag/${tagToSlug(postTag)}`}
                    className="max-w-full rounded-md bg-[rgb(var(--accent)/0.10)] px-2 py-1 font-medium text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.16)]"
                  >
                    {postTag}
                  </Link>
                ))}
              </div>
              {item.href ? (
                <Link href={item.href} className="group flex min-w-0 gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-xl font-bold leading-snug transition-colors group-hover:text-[rgb(var(--accent))] sm:text-2xl">
                      {item.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
                      {item.desc}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 hidden h-5 w-5 flex-shrink-0 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))] sm:block" />
                </Link>
              ) : (
                <div className="flex min-w-0 gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-xl font-bold leading-snug sm:text-2xl">
                      {item.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
                      {item.desc}
                    </p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
