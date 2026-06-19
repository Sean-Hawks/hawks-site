import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Award, Disc3, Heart, Sparkles, Star } from "lucide-react";
import Header from "../../../components/Header";
import MarkdownContent, { headingId } from "../../../components/MarkdownContent";
import ThemeStyles from "../../../components/ThemeStyles";
import {
  getAllLibraryItems,
  getLibraryCategory,
  getLibraryItemBySlug,
} from "../../../lib/library";
import { excerpt, stripMarkdown } from "../../../lib/content";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ category: string; slug: string }> };

function hasLibraryDetail(item: { hasReview: boolean; recommendedWorks: unknown[] }) {
  return item.hasReview || item.recommendedWorks.length > 0;
}

export function generateStaticParams() {
  return getAllLibraryItems()
    .filter(hasLibraryDetail)
    .map((item) => ({
      category: item.category,
      slug: item.slug,
    }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const item = getLibraryItemBySlug(category, slug);

  if (!item || !hasLibraryDetail(item)) {
    return {
      title: "Library",
    };
  }

  const title = item.hasReview ? `評論：${item.title}` : item.title;
  const description = item.note || excerpt(item.content, 150);
  const url = `https://hawks.tw/library/${item.category}/${item.slug}/`;

  return {
    title,
    description,
    keywords: item.tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "hawks.tw",
      publishedTime: item.date,
      tags: item.tags,
      images: [
        {
          url: item.image.src,
          alt: item.image.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [item.image.src],
    },
  };
}

function buildToc(content?: string) {
  if (!content) return [];
  return content
    .split("\n")
    .map((line) => {
      const match = /^(#{1,3})\s+(.*)$/.exec(line.trim());
      if (!match) return null;
      const level = match[1].length;
      const title = match[2].trim();
      const id = headingId(title);
      if (!id) return null;
      return { id, title, level };
    })
    .filter(Boolean) as { id: string; title: string; level: number }[];
}

function Rating({ rating }: { rating: number | null }) {
  const filledStars =
    rating === null ? 0 : Math.max(0, Math.min(5, Math.round(rating / 2)));

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex"
        aria-label={
          rating === null
            ? "Rating not available"
            : `Rating ${rating.toFixed(1)} out of 10`
        }
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={[
              "h-4 w-4",
              index < filledStars
                ? "fill-[rgb(var(--accent))] text-[rgb(var(--accent))]"
                : "text-[rgb(var(--line)/0.25)]",
            ].join(" ")}
          />
        ))}
      </div>
      <span className="rounded-md bg-[rgb(var(--accent)/0.12)] px-2 py-1 text-xs font-bold text-[rgb(var(--accent))]">
        {rating === null ? "N/A" : rating.toFixed(1)}
      </span>
    </div>
  );
}

const recommendationMeta = {
  brilliant: { label: "Brilliant", Icon: Award },
  favorite: { label: "Favorite", Icon: Heart },
  recommended: { label: "Recommended", Icon: Star },
  casual: { label: "Casual", Icon: Sparkles },
} as const;

export default async function LibraryReviewPage({ params }: PageProps) {
  const { category, slug } = await params;
  const item = getLibraryItemBySlug(category, slug);
  const currentCategory = getLibraryCategory(category);

  if (!item || !currentCategory || !hasLibraryDetail(item)) {
    notFound();
  }

  const toc = buildToc(item.content);
  const readingMinutes = item.hasReview
    ? Math.max(1, Math.ceil(stripMarkdown(item.content ?? "").length / 500))
    : 0;
  const recommendation = recommendationMeta[item.recommendation];
  const RecommendationIcon = recommendation.Icon;
  const recommendedWorksSection =
    item.recommendedWorks.length > 0 ? (
      <section className="mt-6 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.07)]">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
              <Disc3 className="h-3.5 w-3.5" />
              Recommended Works
            </div>
            <h2 className="text-xl font-bold">推薦作品</h2>
          </div>
          <div className="text-xs text-[rgb(var(--muted))]">
            {item.title} 入門歌單
          </div>
        </div>
        <div className="grid gap-3">
          {item.recommendedWorks.map((work, index) => {
            const workImage = work.image || item.image.src;
            const card = (
              <>
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[rgb(var(--line)/0.05)] sm:h-28 sm:w-36">
                  {workImage ? (
                    <Image
                      src={workImage}
                      alt={`${work.title} cover`}
                      fill
                      sizes="(min-width: 640px) 144px, 96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-[rgb(var(--accent))]">
                      <Disc3 className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 inline-flex rounded-md bg-[rgb(var(--accent)/0.12)] px-2 py-1 text-xs font-bold text-[rgb(var(--accent))]">
                    #{index + 1}
                  </div>
                  <h3 className="text-base font-bold leading-snug text-[rgb(var(--text))] sm:text-lg">
                    {work.title}
                  </h3>
                  {work.source && (
                    <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                      Source / {work.source}
                    </p>
                  )}
                  {work.note && (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">
                      {work.note}
                    </p>
                  )}
                </div>
                {work.link && (
                  <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))]" />
                )}
              </>
            );

            const className =
              "group flex items-center gap-4 rounded-2xl border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.025)] p-3 transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:bg-[rgb(var(--line)/0.045)]";

            return work.link ? (
              <a
                key={work.title}
                href={work.link}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {card}
              </a>
            ) : (
              <div key={work.title} className={className}>
                {card}
              </div>
            );
          })}
        </div>
      </section>
    ) : null;

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-40 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                目錄
              </h3>
              <nav className="space-y-1">
                {toc.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className={[
                      "block truncate text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]",
                      heading.level > 1 ? "ml-3" : "",
                      heading.level > 2 ? "ml-6" : "",
                    ].join(" ")}
                  >
                    {heading.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div>
            <Link
              href={currentCategory.href}
              className="group mb-6 inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] transition-colors group-hover:bg-[rgb(var(--accent)/0.10)]">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span>回到 {currentCategory.title}</span>
            </Link>

            <article className="overflow-hidden rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.88)] shadow-[0_22px_70px_rgba(90,76,55,0.12)]">
              <header
                className={[
                  "grid border-b border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel2)/0.58)]",
                  item.image.fit === "contain"
                    ? "lg:grid-cols-[360px_minmax(0,1fr)]"
                    : "lg:grid-cols-[260px_minmax(0,1fr)]",
                ].join(" ")}
              >
                <div
                  className={[
                    "relative block overflow-hidden",
                    item.image.fit === "contain" ? "bg-white" : "bg-[rgb(var(--line)/0.05)]",
                    item.image.fit === "contain"
                      ? "h-80 sm:h-96 lg:h-full"
                      : "h-72 sm:h-80 lg:h-full",
                  ].join(" ")}
                >
                  {item.image.src ? (
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes={
                        item.image.fit === "contain"
                          ? "(min-width: 1024px) 360px, calc(100vw - 32px)"
                          : "(min-width: 1024px) 260px, calc(100vw - 32px)"
                      }
                      priority
                      className={
                        item.image.fit === "contain" ? "object-contain object-center" : "object-cover"
                      }
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[rgb(var(--line)/0.025)] p-6 text-center">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                        尚無封面
                      </div>
                      <div className="text-sm leading-6 text-[rgb(var(--muted))]">
                        {item.title}
                      </div>
                    </div>
                  )}
                  {(item.image.credit || item.image.source) && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-[11px] leading-4 text-white/78">
                      {item.image.source ? (
                        <a
                          href={item.image.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.image.credit || "Image source"}
                        </a>
                      ) : (
                        item.image.credit
                      )}
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-10">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-[rgb(var(--accent)/0.10)] px-2.5 py-1 text-xs font-bold text-[rgb(var(--accent))]">
                      {item.hasReview ? "評論" : currentCategory.label}
                    </span>
                    {item.hasReview && (
                      <span className="rounded-md bg-[rgb(var(--line)/0.06)] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
                        {currentCategory.label}
                      </span>
                    )}
                    {item.year && (
                      <span className="rounded-md bg-[rgb(var(--line)/0.06)] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.year}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold leading-tight text-[rgb(var(--text))] sm:text-4xl">
                    {item.hasReview ? `評論：${item.title}` : item.title}
                  </h1>
                  {item.subtitle && (
                    <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                      {item.subtitle}
                    </p>
                  )}

                  <p className="mt-5 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
                    {item.note}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--muted))]">
                    <Rating rating={item.rating} />
                    {item.rating !== null && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-[rgb(var(--accent))]">
                        <RecommendationIcon className="h-4 w-4" />
                        {recommendation.label}
                      </span>
                    )}
                    {readingMinutes > 0 && <span>{readingMinutes} min read</span>}
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[rgb(var(--accent))] hover:underline"
                      >
                        Official
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </header>

              {item.hasReview && (
                <div className="space-y-8 p-6 sm:p-10">
                  <section className="rounded-2xl border border-[rgb(var(--accent)/0.16)] bg-gradient-to-br from-[rgb(var(--panel2)/0.62)] via-[rgb(var(--panel)/0.58)] to-[rgb(var(--accent)/0.06)] p-5 shadow-[0_18px_56px_rgba(90,76,55,0.10)] sm:p-7">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                          <Sparkles className="h-3.5 w-3.5" />
                          Review
                        </div>
                        <h2 className="mt-3 text-2xl font-bold leading-tight text-[rgb(var(--text))]">
                          個人評論
                        </h2>
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">
                        {item.title}
                      </div>
                    </div>
                    <MarkdownContent content={item.content} variant="libraryReview" />
                  </section>
                </div>
              )}
            </article>

            {recommendedWorksSection}
          </div>
        </main>

        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-8 text-center text-xs text-[rgb(var(--muted))]">
          <div className="opacity-70">
            © {new Date().getFullYear()} Hawks • made to feel like a profile, not a resume.
          </div>
        </footer>
      </div>
    </div>
  );
}
