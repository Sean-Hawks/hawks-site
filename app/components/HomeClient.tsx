import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects } from "../data/projects";
import type { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import PublicationActivity from "./PublicationActivity";
import { consoleStatistics } from "../lib/console-stats";
import ConsoleReadingInventory from "./ConsoleReadingInventory";
import ConsoleLibraryPanel, { type ConsoleLibraryItem } from "./ConsoleLibraryPanel";
import ConsoleIdentityPlaque from "./ConsoleIdentityPlaque";
import ConsoleContentIndex from "./ConsoleContentIndex";
interface HomeClientProps {
  posts: Post[];
  talks: Talk[];
  libraryItems: LibraryItem[];
}

function plainText(content = "") {
  return content
    .replace(/!\[\[[^\]]+\]\]|!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function Source({ children }: { children: React.ReactNode }) {
  return <div className="panel-source">{children}</div>;
}

export default function HomeClient({
  posts,
  talks,
  libraryItems,
}: HomeClientProps) {
  const entries = [
    ...posts.map((post) => ({
      title: post.title,
      date: post.date,
      href: `/blog/${post.slug}`,
      type: "文章",
      desc: plainText(post.desc || post.content),
      image: post.banner,
    })),
    ...talks.map((talk) => ({
      title: talk.titleGenerated ? "一則近況" : talk.title,
      date: talk.date,
      href: `/talk/${talk.id}`,
      type: "近況",
      desc: plainText(talk.desc),
      image: talk.banner,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const updated = entries[0];
  const latest = entries.find((entry) => entry.type === "文章") ?? updated;
  const recent = entries
    .filter((entry) => entry.href !== latest?.href)
    .slice(0, 3);
  const ratedCount = libraryItems.filter((item) => item.rating !== null).length;
  const activeCount = libraryItems.filter(
    (item) => item.status === "watching" || item.status === "playing",
  ).length;
  const plannedCount = libraryItems.filter(
    (item) => item.status === "planned",
  ).length;
  const { reading, readings, collection, averageRating } = consoleStatistics(posts, talks, libraryItems);
  const libraryPreview: ConsoleLibraryItem[] = libraryItems.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    status: item.status,
    rating: item.rating,
    featured: item.featured,
    featuredOrder: item.featuredOrder,
    image: { src: item.image.src, alt: item.image.alt, fit: item.image.fit },
    href: item.hasReview || item.recommendedWorks.length
      ? `/library/${item.category}/${item.slug}/`
      : `/library/${item.category}/?q=${encodeURIComponent(item.title)}#item-${item.slug}`,
  }));
  const metrics = [
    { label: "文章", value: posts.length, unit: "篇", href: "/blog/" },
    { label: "近況", value: talks.length, unit: "則", href: "/talk/" },
    {
      label: "收藏",
      value: libraryItems.length,
      unit: "部 / 位",
      href: "/library/",
    },
    { label: "專案", value: projects.length, unit: "個", href: "/project/" },
  ];

  return (
    <div className="status-home min-h-screen">
      <main id="main-content" tabIndex={-1} className="status-main">
        <div className="overview-summary">
          <span className={updated ? "status-ok" : "secondary"}>
            {updated ? "● 公開紀錄" : "○ 尚無更新"}
          </span>
          {updated ? (
            <Link href={updated.href}>最近更新：{updated.title}</Link>
          ) : (
            <span className="secondary">文章與近況會出現在這裡。</span>
          )}
          {updated && <time dateTime={updated.date}>{updated.date}</time>}
        </div>

        <div className="home-console">
          <aside className="home-dossier">
            <section className="home-profile" aria-labelledby="profile-title">
              <div className="profile-eyebrow">
                <h2 id="profile-title">個人檔案</h2><span>Hawks</span>
              </div>
              <div className="profile-copy">
                <ConsoleIdentityPlaque firstDate={entries.at(-1)?.date} lastDate={updated?.date} entries={entries.length} />
                <p className="identity-focus">嗨早安，我是 Hawks！</p>
                <p className="identity-description">
                  我喜歡寫程式、打擊樂跟動畫。
                  <br />
                  這裡放一些學到的東西、參加活動的心得，還有平常的碎念和喜歡的作品。
                </p>
                <div className="identity-links">
                  <a href="https://github.com/Sean-Hawks">GitHub ↗</a>
                  <a href="mailto:me@hawks.tw">聯絡我 ↗</a>
                  <Link href="/timeline/">關於我 ↗</Link>
                </div>
              </div>
              <figure className="profile-portrait">
                <div>
                  <Image
                    src="/avatar.jpg"
                    alt="Hawks 的鯊魚玩偶頭像"
                    fill
                    sizes="(max-width: 599px) 92px, 240px"
                    className="object-cover"
                    priority
                  />
                </div>
                <figcaption>
                  <span>Hawks</span>
                  <span>大安高工 / 台北</span>
                </figcaption>
              </figure>
              <Source>個人資料 · GitHub / 經歷</Source>
            </section>
            <PublicationActivity dates={entries.map((entry) => entry.date)} />
            <ConsoleReadingInventory summary={reading} items={readings} />
          </aside>
          <div className="home-stream">
            <ConsoleContentIndex metrics={metrics} collection={collection} />

            <section id="console-writing" className="home-writing" aria-labelledby="writing-title">
              <div className="panel-heading">
                <h2 id="writing-title">最近寫下的</h2>
                <Link href="/blog/">
                  全部文章與近況
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>
              <div className="writing-layout">
                {latest ? (
                  <Link href={latest.href} className="featured-entry">
                    {latest.image && (
                      <div className="feature-image">
                        <Image
                          src={latest.image}
                          alt={latest.title}
                          fill
                          sizes="(max-width: 699px) 90vw, (max-width: 1099px) 55vw, 480px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="feature-meta">
                      <span>最新{latest.type}</span>
                      <time dateTime={latest.date}>{latest.date}</time>
                    </div>
                    <h3>{latest.title}</h3>
                    <p>{latest.desc || "閱讀完整內容。"}</p>
                    <span className="feature-read">
                      閱讀全文
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </span>
                  </Link>
                ) : (
                  <p className="empty-copy">還沒有公開的文章或近況。</p>
                )}
                <div className="recent-entries">
                  <div className="recent-label">其他近況與筆記</div>
                  {recent.map((entry) => (
                    <Link
                      href={entry.href}
                      key={entry.href}
                      className="entry-row"
                    >
                      <div className="entry-meta">
                        <span>{entry.type}</span>
                        <time dateTime={entry.date}>{entry.date}</time>
                      </div>
                      <h3>{entry.title}</h3>
                      <p>{entry.desc || "閱讀完整內容。"}</p>
                    </Link>
                  ))}
                  {!recent.length && (
                    <p className="empty-copy">其他紀錄會陸續放在這裡。</p>
                  )}
                  <Link href="/subscribe/" className="subscribe-link">
                    透過 RSS 收到下一次更新
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
              <Source>文章 / 近況目錄 · 依發布日期排序</Source>
            </section>

            <ConsoleLibraryPanel
              items={libraryPreview}
              collection={collection}
              averageRating={averageRating}
              ratedCount={ratedCount}
              activeCount={activeCount}
              plannedCount={plannedCount}
            />
          </div>
        </div>
      </main>
      <footer className="status-footer">
        <span>© Hawks · hawks.tw</span>
        <div>
          <Link href="/timeline/">經歷</Link>
          <Link href="/blogroll/">部落卷</Link>
          <Link href="/subscribe/">RSS ↗</Link>
        </div>
      </footer>
    </div>
  );
}
