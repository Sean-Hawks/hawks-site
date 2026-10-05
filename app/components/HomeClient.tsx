import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects } from "../data/projects";
import type { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import PublicationActivity from "./PublicationActivity";
import { consoleStatistics } from "../lib/console-stats";
interface HomeClientProps {
  posts: Post[];
  talks: Talk[];
  libraryItems: LibraryItem[];
}

const categories = {
  anime: "動畫",
  movie: "電影",
  artist: "音樂",
  game: "遊戲",
};
const readingKinds = { post: "文章", talk: "近況", library: "作品評論" };
const statuses = {
  watched: "已看完",
  listened: "已聽過",
  watching: "● 觀看中",
  playing: "● 遊玩中",
  played: "已玩過",
  planned: "○ 待補",
  recommended: "推薦",
};

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
  const picks = [...libraryItems]
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity) ||
        (b.rating ?? -1) - (a.rating ?? -1),
    )
    .slice(0, 3);
  const ratedCount = libraryItems.filter((item) => item.rating !== null).length;
  const activeCount = libraryItems.filter(
    (item) => item.status === "watching" || item.status === "playing",
  ).length;
  const plannedCount = libraryItems.filter(
    (item) => item.status === "planned",
  ).length;
  const { reading, collection, averageRating } = consoleStatistics(posts, talks, libraryItems);
  const ratingSegments = libraryItems.length
    ? Math.round((ratedCount / libraryItems.length) * 24)
    : 0;
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
                <h2 id="profile-title">個人檔案</h2><span>台北 · UTC+8</span>
              </div>
              <div className="profile-copy">
                <h1 id="intro-title">HAWKS<span>.TW</span></h1>
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
            {reading.count > 0 && (
              <section className="reading-inventory" aria-labelledby="inventory-title">
                <div className="console-title-row">
                  <h2 id="inventory-title">閱讀存量</h2><span>{reading.count} 篇正文</span>
                </div>
                <div className="inventory-body">
                  <p className="inventory-label">全部讀完，預估需要</p>
                  <div className="inventory-total"><strong>{reading.minutes}</strong><small>分鐘</small></div>
                  <dl className="inventory-breakdown">
                    {reading.breakdown.map((item) => (
                      <div key={item.kind}><dt>{readingKinds[item.kind]}</dt><dd><strong>{item.minutes}</strong> 分鐘</dd></div>
                    ))}
                  </dl>
                  <Link href="/explore/" className="inventory-short-link">
                    <span>五分鐘內可讀完 <strong>{reading.shortCount}</strong> 篇</span>
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </div>
                <Source>公開正文 · 依文字估算，圖片與程式碼不計</Source>
              </section>
            )}
          </aside>
          <div className="home-stream">
            <nav className="content-index" aria-label="站內內容索引">
              <div className="console-title-row">
                <h2>內容總覽</h2>
                <span>站內索引</span>
              </div>
              {metrics.map((metric) => (
                <Link href={metric.href} key={metric.label}>
                  <span className="index-label">{metric.label}</span>
                  <span className="index-value">
                    {metric.value}
                    <small>{metric.unit}</small>
                  </span>
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              ))}
              <Source>文章 / 近況 / 收藏 / 專案目錄</Source>
            </nav>

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

            <section id="console-library" className="home-library" aria-labelledby="library-title">
              <div className="panel-heading">
                <h2 id="library-title">喜歡的作品</h2>
                <Link href="/library/">
                  全部收藏
                  <ArrowUpRight size={13} aria-hidden="true" />
                </Link>
              </div>
              {libraryItems.length > 0 && (
                <div className="library-monitor">
                  <div>
                    <div className="monitor-heading">
                      <span>評分紀錄</span>
                      <span>
                        <strong>{ratedCount}</strong>
                        <small> / {libraryItems.length} 件已評分</small>
                      </span>
                    </div>
                    <div
                      className="monitor-meter"
                      role="meter"
                      aria-label="收藏評分紀錄"
                      aria-valuemin={0}
                      aria-valuemax={libraryItems.length}
                      aria-valuenow={ratedCount}
                      aria-valuetext={`${ratedCount} / ${libraryItems.length} 件已評分`}
                    >
                      {Array.from({ length: 24 }, (_, index) => (
                        <span
                          key={index}
                          className={
                            index < ratingSegments ? "meter-used" : undefined
                          }
                          aria-hidden="true"
                        >
                          ━
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="monitor-status">
                    {averageRating !== null && (
                      <span>平均個人評分<strong>{averageRating.toFixed(1)}</strong> / 10</span>
                    )}
                    <span>
                      <span className={activeCount ? "status-ok" : "secondary"}>
                        {activeCount ? "●" : "○"} 進行中
                      </span>
                      <strong>{activeCount}</strong> 件
                    </span>
                    <span>
                      ○ 待補<strong>{plannedCount}</strong> 件
                    </span>
                  </div>
                </div>
              )}
              {libraryItems.length > 0 && (
                <div className="collection-distribution" aria-label="收藏分類占比">
                  {collection.map(({ category, count }) => (
                    <Link href={`/library/${category}/`} key={category} className="collection-channel">
                      <div><span>{categories[category]}</span><span><strong>{count}</strong> {category === "artist" ? "位 / 組" : category === "game" ? "款" : "部"}</span></div>
                      <div className="monitor-meter" role="meter" aria-label={`${categories[category]}占全部收藏`} aria-valuemin={0} aria-valuemax={libraryItems.length} aria-valuenow={count} aria-valuetext={`${count} / ${libraryItems.length} 件`}>
                        {Array.from({ length: 24 }, (_, index) => (
                          <span key={index} className={index < Math.round(count / libraryItems.length * 24) ? "meter-used" : undefined} aria-hidden="true">━</span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="library-picks">
                {picks.map((item) => (
                  <Link
                    href={
                      item.hasReview || item.recommendedWorks.length
                        ? `/library/${item.category}/${item.slug}`
                        : `/library/${item.category}`
                    }
                    key={item.id}
                    className="library-pick"
                  >
                    <div className="pick-image">
                      <Image
                        src={item.image.src}
                        alt={item.image.alt || item.title}
                        fill
                        sizes="72px"
                        className={
                          item.image.fit === "contain"
                            ? "object-contain"
                            : "object-cover"
                        }
                      />
                    </div>
                    <div className="pick-content">
                      <div className="pick-meta">
                        <span>{categories[item.category]}</span>
                        <span
                          className={
                            item.status === "watching" ||
                            item.status === "playing"
                              ? "status-ok"
                              : "secondary"
                          }
                        >
                          {statuses[item.status]}
                        </span>
                      </div>
                      <h3>{item.title}</h3>
                      {item.rating !== null && (
                        <div className="pick-rating">
                          <span className="rating-value">
                            <strong>{item.rating.toFixed(1)}</strong>
                            <small> / 10</small>
                          </span>
                          <span className="rating-meter" aria-hidden="true">
                            <span>{"━".repeat(Math.round(item.rating))}</span>
                            <span>
                              {"━".repeat(10 - Math.round(item.rating))}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {!picks.length && (
                  <p className="empty-copy">還沒有公開的收藏。</p>
                )}
              </div>
              <Source>收藏目錄 · 依目前紀錄計算 · 個人評分滿分 10</Source>
            </section>
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
