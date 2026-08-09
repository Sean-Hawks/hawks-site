"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { resumeItems, sortResumeItemsByDate } from "../data/resume";
import { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import Header from "./Header";
import ThemeStyles from "./ThemeStyles";

interface HomeClientProps {
  posts: Post[];
  talks: Talk[];
  libraryItems: LibraryItem[];
}

type HeroSlide = {
  src: string;
  alt: string;
  label: string;
  href: string;
};

const tickerItems = [
  "TAIPEI / UTC+8",
  "STATUS: WRITING",
  "CODE / BAND / ACGM / LIFE",
  "NO ALGORITHM HERE",
  "HAWKS.TW SIGNAL ONLINE",
];

const quickLinks = [
  { label: "Blog", href: "/blog", note: "寫清楚一點的文章" },
  { label: "Now", href: "/now", note: "近況和沒有結論的碎念" },
  { label: "Project", href: "/project", note: "程式與 side projects" },
  { label: "Search", href: "/search", note: "在這個網站裡找東西" },
];

function formatDate(date: string) {
  return date.replaceAll("-", ".");
}

function libraryHref(item: LibraryItem) {
  return item.hasReview || item.recommendedWorks.length > 0
    ? `/library/${item.category}/${item.slug}`
    : `/library/${item.category}`;
}

function featuredLibraryItems(items: LibraryItem[]) {
  const featured = items.filter((item) => item.featured);

  return [...(featured.length > 0 ? featured : items)]
    .sort(
      (a, b) =>
        (a.featuredOrder ?? Number.POSITIVE_INFINITY) -
          (b.featuredOrder ?? Number.POSITIVE_INFINITY) ||
        (b.rating ?? -1) - (a.rating ?? -1)
    )
    .slice(0, 4);
}

function markdownImages(content: string | undefined) {
  if (!content) return [];

  const images: Array<{ src: string; alt: string }> = [];
  const obsidianPattern = /!\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
  const markdownPattern = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;

  for (const match of content.matchAll(obsidianPattern)) {
    images.push({
      src: match[1].startsWith("/") ? match[1] : `/images/${match[1]}`,
      alt: match[2]?.trim() || match[1],
    });
  }

  for (const match of content.matchAll(markdownPattern)) {
    if (!match[2].startsWith("/")) continue;
    images.push({ src: match[2], alt: match[1].trim() || "站內圖片" });
  }

  return images;
}

function resolveContentImage(src: string, banner: string | undefined) {
  if (!banner || !banner.startsWith("/images/posts/")) return src;
  if (!/^\/images\/[^/]+$/.test(src)) return src;

  const bannerDirectory = banner.slice(0, banner.lastIndexOf("/"));
  return `${bannerDirectory}/${src.slice("/images/".length)}`;
}

function collectHeroSlides(
  posts: Post[],
  talks: Talk[]
) {
  const slides: HeroSlide[] = [];
  const seen = new Set<string>();

  const add = (slide: HeroSlide) => {
    if (!slide.src || !slide.src.startsWith("/") || seen.has(slide.src)) return;
    seen.add(slide.src);
    slides.push(slide);
  };

  add({
    src: "/images/PXL_20260726_092925853-redacted.jpg",
    alt: "AIS3 下課後，手上拿著鬆餅和活動名牌",
    label: "AIS3 / Taipei / 2026.07",
    href: "/blog/ais3",
  });

  for (const post of posts) {
    if (post.banner) {
      add({
        src: post.banner,
        alt: post.title,
        label: `BLOG / ${post.title}`,
        href: `/blog/${post.slug}`,
      });
    }

    for (const image of markdownImages(post.content)) {
      add({
        ...image,
        src: resolveContentImage(image.src, post.banner),
        label: `BLOG / ${post.title}`,
        href: `/blog/${post.slug}`,
      });
    }
  }

  for (const talk of talks) {
    if (talk.banner) {
      add({
        src: talk.banner,
        alt: talk.title,
        label: `NOW / ${talk.title}`,
        href: `/talk/${talk.id}`,
      });
    }

    for (const image of markdownImages(talk.desc)) {
      add({
        ...image,
        label: `NOW / ${talk.title}`,
        href: `/talk/${talk.id}`,
      });
    }
  }

  return slides;
}

function SectionTitle({
  code,
  title,
  note,
  href,
  hrefLabel,
}: {
  code: string;
  title: string;
  note?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="home-reveal mb-6 flex flex-col gap-4 border-b border-[rgb(var(--line)/0.15)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-500">
          {code}
        </div>
        <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        {note && <p className="mt-2 max-w-2xl leading-7 text-[rgb(var(--muted))]">{note}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="home-action-link self-start font-mono text-xs font-bold uppercase tracking-[0.12em] text-[rgb(var(--accent))] sm:self-auto"
        >
          {hrefLabel ?? "OPEN"} ↗
        </Link>
      )}
    </div>
  );
}

export default function HomeClient({ posts, talks, libraryItems }: HomeClientProps) {
  const featuredPosts = posts.slice(0, 3);
  const libraryPicks = featuredLibraryItems(libraryItems);
  const timelinePicks = sortResumeItemsByDate(resumeItems).slice(0, 4);
  const heroSlides = React.useMemo(
    () => collectHeroSlides(posts, talks),
    [posts, talks]
  );
  const [activeHero, setActiveHero] = React.useState(0);
  const [isHeroPlaying, setIsHeroPlaying] = React.useState(true);
  const [activePost, setActivePost] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);

  React.useEffect(() => {
    if (!isHeroPlaying || heroSlides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % heroSlides.length);
    }, 4600);

    return () => window.clearInterval(timer);
  }, [heroSlides.length, isHeroPlaying]);

  React.useEffect(() => {
    if (!isPlaying || featuredPosts.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActivePost((current) => (current + 1) % featuredPosts.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [featuredPosts.length, isPlaying]);

  const currentPost = featuredPosts[activePost] ?? featuredPosts[0];
  const currentHero = heroSlides[activeHero] ?? heroSlides[0];

  const showPreviousHero = React.useCallback(() => {
    setActiveHero((current) =>
      heroSlides.length > 0 ? (current - 1 + heroSlides.length) % heroSlides.length : 0
    );
  }, [heroSlides.length]);

  const showNextHero = React.useCallback(() => {
    setActiveHero((current) =>
      heroSlides.length > 0 ? (current + 1) % heroSlides.length : 0
    );
  }, [heroSlides.length]);

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
      event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
    },
    []
  );

  return (
    <div className="hawks-home min-h-screen text-[rgb(var(--text))]" onPointerMove={handlePointerMove}>
      <ThemeStyles />
      <Header />

      <div className="home-ticker border-b border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.72)]">
        <div className="home-ticker-track py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`} className="inline-flex items-center gap-5 px-5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.9)]" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <section className="grid gap-7 lg:grid-cols-[280px_minmax(0,1fr)] xl:gap-10">
          <aside className="home-panel home-profile-panel self-start lg:sticky lg:top-24">
            <div className="border-b border-[rgb(var(--line)/0.14)] px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500">
              Profile://1awks
            </div>

            <div className="p-5">
              <div className="flex items-center gap-4 lg:block">
                <div className="home-profile-ring relative h-20 w-20 shrink-0 rounded-full p-[3px] lg:h-28 lg:w-28">
                  <div className="relative h-full w-full overflow-hidden rounded-full bg-[rgb(var(--panel2))]">
                    <Image src="/avatar.jpg" alt="Hawks 的頭像" fill sizes="112px" className="object-cover" priority />
                  </div>
                </div>
                <div className="lg:mt-5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-2xl font-bold">Hawks</h2>
                    <span className="home-status-dot h-2 w-2 rounded-full bg-emerald-500" title="Online" />
                  </div>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">大安高工 / Taipei</p>
                </div>
              </div>

              <dl className="mt-5 hidden border-t border-[rgb(var(--line)/0.14)] sm:block">
                <div className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-[rgb(var(--line)/0.14)] py-3 text-sm">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">Status</dt>
                  <dd>整理網站</dd>
                </div>
                <div className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-[rgb(var(--line)/0.14)] py-3 text-sm">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">Focus</dt>
                  <dd>Music / Machine Learning / Cyber Security</dd>
                </div>
                <div className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-[rgb(var(--line)/0.14)] py-3 text-sm">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--muted))]">Since</dt>
                  <dd>2008.03.21</dd>
                </div>
              </dl>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <a href="https://github.com/Sean-Hawks" className="home-mini-button">GitHub</a>
                <a href="mailto:me@hawks.tw" className="home-mini-button">Email</a>
                <Link href="/timeline" className="home-mini-button">History</Link>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <section className="home-hero-grid home-panel relative overflow-hidden">
              <div className="home-hero-copy relative z-10 px-5 pb-8 pt-6 sm:px-8 sm:pb-10 sm:pt-8 xl:px-10">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-500">
                  Hawks.tw / Personal signal grid
                </div>
                <h1 className="home-hero-title mt-5 font-black uppercase leading-[0.78] tracking-[-0.075em]">
                  <span className="block">Hawks</span>
                  <span className="home-hero-outline block">.tw</span>
                </h1>
                <p className="mt-7 max-w-xl font-serif text-lg font-bold leading-8 text-[rgb(var(--text)/0.88)] sm:text-xl sm:leading-9">
                  嗨早安，我是來自台南的 Hawks！這裡會分享我在音樂、程式或在各種影視作品上的心得。
                </p>
              </div>

              {currentHero && (
                <figure className="home-hero-photo group relative min-h-[310px] overflow-hidden border-t border-[rgb(var(--line)/0.14)] sm:min-h-[390px] xl:border-l xl:border-t-0">
                  <Link
                    href={currentHero.href}
                    aria-label={`前往圖片來源：${currentHero.label}`}
                    className="absolute inset-0"
                  >
                    <Image
                      key={currentHero.src}
                      src={currentHero.src}
                      alt={currentHero.alt}
                      fill
                      sizes="(min-width: 1280px) 520px, (min-width: 640px) 70vw, 100vw"
                      className="home-hero-slide object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                      priority={activeHero === 0}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
                  </Link>

                  <div className="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-3 sm:inset-x-5">
                    <Link
                      href={currentHero.href}
                      className="min-w-0 border border-white/25 bg-black/58 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur transition-colors hover:border-cyan-300/70"
                    >
                      <span className="block truncate">{currentHero.label}</span>
                      <span className="mt-1 block text-[9px] text-white/65">
                        {String(activeHero + 1).padStart(2, "0")} / {String(heroSlides.length).padStart(2, "0")}
                      </span>
                    </Link>

                    <div className="flex shrink-0 border border-white/25 bg-black/58 text-white backdrop-blur">
                      <button
                        type="button"
                        aria-label="上一張圖片"
                        onClick={showPreviousHero}
                        className="home-hero-control"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={isHeroPlaying ? "暫停圖片輪播" : "播放圖片輪播"}
                        aria-pressed={!isHeroPlaying}
                        onClick={() => setIsHeroPlaying((current) => !current)}
                        className="home-hero-control border-x border-white/20"
                      >
                        {isHeroPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        aria-label="下一張圖片"
                        onClick={showNextHero}
                        className="home-hero-control"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div
                    key={`${activeHero}-${isHeroPlaying}`}
                    className={isHeroPlaying ? "home-hero-progress" : "absolute inset-x-0 bottom-0 z-10 h-0.5 bg-cyan-300/45"}
                  />
                  <span className="home-corner home-corner-tl" />
                  <span className="home-corner home-corner-br" />
                </figure>
              )}
            </section>

            <section aria-label="網站內容統計" className="home-stats-grid mt-4 grid grid-cols-2 sm:grid-cols-4">
              {[
                ["Blog", posts.length],
                ["Now", talks.length],
                ["Library", libraryItems.length],
                ["Timeline", resumeItems.length],
              ].map(([label, value]) => (
                <div key={label} className="home-stat-cell home-panel p-4 sm:p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{label}</div>
                  <div className="mt-2 font-mono text-3xl font-black tabular-nums sm:text-4xl">
                    {String(value).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <SectionTitle
            code="Signal / 01"
            title="Latest Post"
            href="/blog"
            hrefLabel="全部文章"
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
            {currentPost && (
              <article className="home-panel home-featured-post home-reveal overflow-hidden">
                <Link href={`/blog/${currentPost.slug}`} className="group grid h-full md:grid-cols-[minmax(0,0.95fr)_minmax(280px,1.05fr)]">
                  <div className="relative min-h-[260px] overflow-hidden bg-[rgb(var(--panel2))] md:min-h-[420px]">
                    <Image
                      key={currentPost.slug}
                      src={currentPost.banner || "/og/default.png"}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 500px, 100vw"
                      className="home-signal-image object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">
                      Incoming signal / {String(activePost + 1).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="flex min-h-[300px] flex-col p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                      <time>{formatDate(currentPost.date)}</time>
                      <span>{currentPost.tags.slice(0, 2).join(" / ")}</span>
                    </div>
                    <h3 className="mt-6 font-serif text-3xl font-bold leading-tight tracking-tight transition-colors group-hover:text-cyan-500 sm:text-4xl">
                      {currentPost.title}
                    </h3>
                    <p className="mt-4 line-clamp-4 leading-8 text-[rgb(var(--muted))]">{currentPost.desc}</p>
                    <div className="mt-auto pt-8 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[rgb(var(--accent))]">
                      Read transmission ↗
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 border-t border-[rgb(var(--line)/0.14)] p-3">
                  {featuredPosts.map((post, index) => (
                    <button
                      key={post.slug}
                      type="button"
                      aria-label={`顯示文章：${post.title}`}
                      aria-pressed={activePost === index}
                      onClick={() => setActivePost(index)}
                      className={activePost === index ? "home-signal-tab home-signal-tab-active" : "home-signal-tab"}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label={isPlaying ? "暫停文章輪播" : "播放文章輪播"}
                    aria-pressed={!isPlaying}
                    onClick={() => setIsPlaying((current) => !current)}
                    className="home-signal-tab ml-auto"
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div key={`${activePost}-${isPlaying}`} className={isPlaying ? "home-signal-progress" : "h-0.5 bg-cyan-500/40"} />
              </article>
            )}

            <aside className="home-panel home-reveal">
              <div className="flex items-center justify-between border-b border-[rgb(var(--line)/0.14)] px-5 py-4">
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500">Now / live notes</div>
                <Link href="/now" className="font-mono text-[10px] uppercase tracking-wider text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]">All ↗</Link>
              </div>
              <div>
                {talks.slice(0, 5).map((talk, index) => (
                  <Link
                    key={talk.id}
                    href={`/talk/${talk.id}`}
                    className="home-list-row group grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-[rgb(var(--line)/0.12)] p-4 last:border-b-0"
                  >
                    <span className="font-mono text-[10px] text-cyan-500">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <time className="font-mono text-[10px] text-[rgb(var(--muted))]">{formatDate(talk.date)}</time>
                      <strong className="mt-1 block font-serif text-lg leading-7 transition-colors group-hover:text-cyan-500">{talk.title}</strong>
                    </span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <SectionTitle
            code="Archive / 02"
            title="最近喜歡"
            href="/library"
            hrefLabel="打開 Library"
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {libraryPicks.map((item, index) => (
              <Link
                key={item.id}
                href={libraryHref(item)}
                className="home-media-card home-panel home-reveal group overflow-hidden"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[rgb(var(--panel2))]">
                  {item.image.src ? (
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      fill
                      sizes="(min-width: 1024px) 300px, 50vw"
                      className={
                        item.image.zoom
                          ? "scale-[1.34] object-cover transition-transform duration-500 group-hover:scale-[1.38]"
                          : item.image.fit === "contain"
                            ? "object-contain p-5 transition-transform duration-500 group-hover:scale-105"
                            : "object-cover transition-transform duration-500 group-hover:scale-105"
                      }
                    />
                  ) : null}
                  <span className="absolute left-3 top-3 border border-white/20 bg-black/55 px-2 py-1 font-mono text-[10px] text-white backdrop-blur">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    <span>{item.category}</span>
                    {item.rating !== null && <span className="text-[rgb(var(--accent))]">{item.rating.toFixed(1)}</span>}
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-serif text-lg font-bold leading-7 transition-colors group-hover:text-cyan-500">{item.title}</h3>
                  {item.note && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[rgb(var(--muted))]">{item.note}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <SectionTitle
            code="History / 03"
            title="Timeline pulse"
            href="/timeline"
            hrefLabel="完整時間軸"
          />

          <div className="home-panel home-reveal overflow-hidden">
            {timelinePicks.map((item, index) => (
              <Link
                key={`${item.period}-${item.title}`}
                href={item.links?.find((link) => !link.external)?.href ?? "/timeline"}
                className="home-timeline-row group grid gap-3 border-b border-[rgb(var(--line)/0.13)] p-5 last:border-b-0 sm:grid-cols-[3rem_10rem_minmax(0,1fr)_auto] sm:items-center"
              >
                <span className="font-mono text-[10px] text-cyan-500">{String(index + 1).padStart(2, "0")}</span>
                <time className="font-mono text-xs text-[rgb(var(--muted))]">{item.period}</time>
                <span>
                  <strong className="font-serif text-lg transition-colors group-hover:text-cyan-500">{item.title}</strong>
                  {item.organization && <small className="mt-1 block text-sm text-[rgb(var(--muted))]">{item.organization}</small>}
                </span>
                <span className="hidden font-mono text-xs text-[rgb(var(--muted))] sm:block">↗</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <SectionTitle code="Index / 04" title="Choose a route" />
          <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="首頁主要入口">
            {quickLinks.map((item, index) => (
              <Link key={item.href} href={item.href} className="home-route-card home-panel home-reveal group p-5">
                <div className="flex items-center justify-between font-mono text-[10px] text-cyan-500">
                  <span>ROUTE_{String(index + 1).padStart(2, "0")}</span>
                  <span>↗</span>
                </div>
                <div className="mt-8 font-serif text-2xl font-bold transition-colors group-hover:text-cyan-500">{item.label}</div>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{item.note}</p>
              </Link>
            ))}
          </nav>
        </section>
      </main>

      <footer className="border-t border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.5)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 font-mono text-[10px] uppercase tracking-[0.16em] text-[rgb(var(--muted))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} Hawks / hawks.tw</span>
          <span>End of transmission — for now.</span>
        </div>
      </footer>
    </div>
  );
}
