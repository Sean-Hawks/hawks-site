import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects } from "../data/projects";
import type { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import Header from "./Header";

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

function PanelHeading({
  title,
  href,
  note,
}: {
  title: string;
  href: string;
  note: string;
}) {
  return (
    <div className="panel-heading">
      <h2>{title}</h2>
      <Link href={href}>
        {note}
        <ArrowUpRight size={13} aria-hidden="true" />
      </Link>
    </div>
  );
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
    })),
    ...talks.map((talk) => ({
      title: talk.titleGenerated ? "一則近況" : talk.title,
      date: talk.date,
      href: `/talk/${talk.id}`,
      type: "近況",
      desc: plainText(talk.desc),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const latest = entries[0];
  const recent = entries.slice(1, 5);
  const picks = [...libraryItems]
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity) ||
        (b.rating ?? -1) - (a.rating ?? -1),
    )
    .slice(0, 3);
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
      <Header />
      <main id="main-content" tabIndex={-1} className="status-main">
        <div className="overview-summary">
          <span className={latest ? "status-ok" : "secondary"}>
            {latest ? "● 內容已公開" : "○ 尚無更新"}
          </span>
          <span className="secondary">
            {latest ? `最新${latest.type}已收錄` : "文章與近況會出現在這裡"}
          </span>
          {latest && <time dateTime={latest.date}>更新於 {latest.date}</time>}
        </div>

        <section
          className="quiet-panel home-masthead"
          aria-labelledby="intro-title"
        >
          <div className="panel-heading">
            <span>個人網站</span>
            <span className="secondary">台北 · UTC+8</span>
          </div>
          <div className="masthead-body">
            <div className="home-identity">
              <h1 id="intro-title">
                Hawks<span className="secondary">.tw</span>
              </h1>
              <p className="identity-focus">程式 / 資安 / 打擊樂</p>
              <p className="identity-description">
                記錄學到的東西、做過的作品，
                <br />
                以及生活裡值得留下的片刻。
              </p>
              <div className="identity-links">
                <a href="https://github.com/Sean-Hawks">GitHub ↗</a>
                <a href="mailto:me@hawks.tw">聯絡我 ↗</a>
                <Link href="/subscribe/">訂閱更新 ↗</Link>
              </div>
            </div>
            <div className="home-feature">
              <div className="feature-meta">
                <span>最新{latest?.type ?? "內容"}</span>
                {latest && <time dateTime={latest.date}>{latest.date}</time>}
              </div>
              {latest ? (
                <>
                  <h2>
                    <Link href={latest.href}>{latest.title}</Link>
                  </h2>
                  <p>{latest.desc || "閱讀完整內容。"}</p>
                  <Link className="feature-read" href={latest.href}>
                    閱讀全文
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </Link>
                </>
              ) : (
                <p>還沒有公開的文章或近況。</p>
              )}
            </div>
          </div>
          <nav className="content-index" aria-label="站內內容索引">
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
          </nav>
          <Source>來源 · 個人簡介 / 已公開的文章、近況、收藏 / 專案清單</Source>
        </section>

        <div className="home-content-grid">
          <section className="quiet-panel writing-panel">
            <PanelHeading title="近期紀錄" href="/blog/" note="全部文章" />
            <div className="entry-table">
              {recent.map((entry) => (
                <Link href={entry.href} key={entry.href} className="entry-row">
                  <time dateTime={entry.date}>{entry.date}</time>
                  <div>
                    <span className="entry-type">{entry.type}</span>
                    <h3>{entry.title}</h3>
                  </div>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              ))}
              {!recent.length && (
                <p className="empty-copy">
                  {latest
                    ? "其他紀錄會陸續放在這裡。"
                    : "還沒有公開的文章或近況。"}
                </p>
              )}
            </div>
            <Source>文章 / 近況目錄 · 依發布日期排序</Source>
          </section>
          <section className="quiet-panel library-panel">
            <PanelHeading title="精選收藏" href="/library/" note="全部收藏" />
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
                      sizes="48px"
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
                        <span className="rating-meter" aria-hidden="true">
                          <span>{"━".repeat(Math.round(item.rating))}</span>
                          <span>
                            {"━".repeat(10 - Math.round(item.rating))}
                          </span>
                        </span>
                        <span className="rating-value">
                          <strong>{item.rating.toFixed(1)}</strong>
                          <small> / 10</small>
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
            <Source>收藏目錄 · 個人評分</Source>
          </section>
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
