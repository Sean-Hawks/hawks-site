import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Award, Heart, Sparkles, Star } from "lucide-react";
import Header from "../../../components/Header";
import MarkdownContent, { headingId } from "../../../components/MarkdownContent";
import ThemeStyles from "../../../components/ThemeStyles";
import {
  getAllLibraryItems,
  getLibraryCategory,
  getLibraryItemBySlug,
} from "../../../lib/library";
import { stripMarkdown } from "../../../lib/content";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ category: string; slug: string }> };

export function generateStaticParams() {
  return getAllLibraryItems()
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

  if (!item || !item.hasReview) {
    return {
      title: "Library Review",
    };
  }

  return {
    title: `評論：${item.title}`,
    description: item.note,
    openGraph: {
      title: `評論：${item.title}`,
      description: item.note,
      images: [
        {
          url: item.image.src,
          alt: item.image.alt,
        },
      ],
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

function Rating({ rating }: { rating: number }) {
  const filledStars = Math.max(0, Math.min(5, Math.round(rating / 2)));

  return (
    <div className="flex items-center gap-2">
      <div className="flex" aria-label={`Rating ${rating.toFixed(1)} out of 10`}>
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
        {rating.toFixed(1)}
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

  if (!item || !item.hasReview || !currentCategory) {
    notFound();
  }

  const toc = buildToc(item.content);
  const readingMinutes = Math.max(
    1,
    Math.ceil(stripMarkdown(item.content ?? "").length / 500)
  );
  const recommendation = recommendationMeta[item.recommendation];
  const RecommendationIcon = recommendation.Icon;

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
              <header className="grid border-b border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel2)/0.58)] lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="relative block h-80 overflow-hidden bg-[rgb(var(--line)/0.05)] lg:h-full">
                  {item.image.src ? (
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes="(min-width: 1024px) 260px, calc(100vw - 32px)"
                      className={
                        item.image.fit === "contain" ? "object-contain p-4" : "object-cover"
                      }
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[rgb(var(--line)/0.025)] p-6 text-center">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
                        No cover yet
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
                      評論
                    </span>
                    <span className="rounded-md bg-[rgb(var(--line)/0.06)] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
                      {currentCategory.label}
                    </span>
                    {item.year && (
                      <span className="rounded-md bg-[rgb(var(--line)/0.06)] px-2.5 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.year}
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold leading-tight text-[rgb(var(--text))] sm:text-4xl">
                    評論：{item.title}
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
                    <span className="inline-flex items-center gap-1.5 font-medium text-[rgb(var(--accent))]">
                      <RecommendationIcon className="h-4 w-4" />
                      {recommendation.label}
                    </span>
                    <span>{readingMinutes} min read</span>
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

              <div className="p-6 sm:p-10">
                <MarkdownContent content={item.content} />
              </div>
            </article>
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
