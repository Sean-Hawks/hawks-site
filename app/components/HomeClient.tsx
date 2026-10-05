import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Github, Mail, Rss } from "lucide-react";
import { resumeItems, sortResumeItemsByDate } from "../data/resume";
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
        <ArrowUpRight size={14} aria-hidden="true" />
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
  const picks = [...libraryItems]
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity) ||
        (b.rating ?? -1) - (a.rating ?? -1),
    )
    .slice(0, 4);
  const history = sortResumeItemsByDate(resumeItems).slice(0, 3);
  const metrics = [
    {
      label: "文章",
      value: posts.length,
      unit: "篇",
      note: "學習筆記與活動心得",
      href: "/blog/",
      source: "文章目錄",
    },
    {
      label: "近況",
      value: talks.length,
      unit: "則",
      note: "生活裡的短更新",
      href: "/talk/",
      source: "近況目錄",
    },
    {
      label: "收藏",
      value: libraryItems.length,
      unit: "部 / 位",
      note: "動畫、電影、音樂與遊戲",
      href: "/library/",
      source: "收藏目錄",
    },
    {
      label: "專案",
      value: projects.length,
      unit: "個",
      note: "程式實作與作品紀錄",
      href: "/project/",
      source: "專案清單",
    },
  ];
  // Anchor the chart to the latest published entry, so static exports stay consistent.
  const [year, month] = (latest?.date ?? "").split("-").map(Number);
  const months = latest
    ? Array.from({ length: 6 }, (_, i) => {
        const date = new Date(Date.UTC(year, month - 6 + i, 1));
        const key = date.toISOString().slice(0, 7);
        return {
          key,
          label: `${date.getUTCMonth() + 1} 月`,
          count: entries.filter((entry) => entry.date.startsWith(key)).length,
        };
      })
    : [];
  const maxCount = Math.max(1, ...months.map((item) => item.count));
  const points = months
    .map((item, i) => `${12 + i * 56},${66 - (item.count / maxCount) * 50}`)
    .join(" ");
  const total = posts.length + talks.length + libraryItems.length;

  return (
    <div className="status-home min-h-screen">
      <Header />
      <main id="main-content" tabIndex={-1} className="status-main">
        <div className="overview-summary">
          <span className={latest ? "status-ok" : "secondary"}>
            {latest ? "● 有新內容" : "○ 尚無更新"}
          </span>
          {latest ? (
            <Link href={latest.href}>
              最近寫下了〈{latest.title}〉
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          ) : (
            <span>文章與近況會出現在這裡。</span>
          )}
          {latest && <time dateTime={latest.date}>{latest.date}</time>}
        </div>

        <div className="overview-grid">
          <section
            className="quiet-panel intro-panel"
            aria-labelledby="intro-title"
          >
            <div className="panel-heading">
              <span>關於這裡</span>
              <span className="secondary">台北 · UTC+8</span>
            </div>
            <div className="intro-body">
              <div className="profile-line">
                <Image
                  src="/avatar.jpg"
                  alt="Hawks 的頭像"
                  width={56}
                  height={56}
                  priority
                />
                <div>
                  <span className="profile-name">Hawks</span>
                  <p className="secondary">大安高工 · 程式 / 資安 / 打擊樂</p>
                </div>
              </div>
              <h1 id="intro-title">
                把學到的、做過的，
                <br />
                慢慢寫下來。
              </h1>
              <p className="intro-description">
                這裡記錄程式開發、機器學習與資安的學習歷程，也放著管樂生活和喜歡的作品。
              </p>
              <div className="intro-links">
                <a href="https://github.com/Sean-Hawks">
                  <Github size={15} aria-hidden="true" />
                  GitHub
                </a>
                <a href="mailto:me@hawks.tw">
                  <Mail size={15} aria-hidden="true" />
                  聯絡我
                </a>
                <Link href="/subscribe/">
                  <Rss size={15} aria-hidden="true" />
                  訂閱更新
                </Link>
              </div>
            </div>
            <Source>Hawks · 個人簡介</Source>
          </section>

          <section
            className="quiet-panel activity-panel"
            aria-labelledby="activity-title"
          >
            <div className="panel-heading">
              <h2 id="activity-title">內容總覽</h2>
              <span className="secondary">已公開的紀錄</span>
            </div>
            <div className="activity-body">
              <div className="activity-total">
                <span className="big-number">{total}</span>
                <span className="number-unit">篇 / 則 / 部</span>
              </div>
              <p className="secondary">每一篇筆記、每一則近況、每一部收藏。</p>
              {months.length > 0 && (
                <div className="writing-chart">
                  <div className="chart-caption">
                    <span>寫作紀錄</span>
                    <span>
                      {months.reduce((sum, item) => sum + item.count, 0)} 篇 /
                      則 · 近六個月
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 304 80"
                    role="img"
                    aria-label={`各月文章與近況數量：${months.map((item) => `${item.key}：${item.count}`).join("，")}`}
                  >
                    <line
                      x1="12"
                      y1="66"
                      x2="292"
                      y2="66"
                      stroke="var(--border)"
                    />
                    <polyline
                      points={points}
                      fill="none"
                      stroke="var(--foreground)"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                    {months.map((item, i) => (
                      <circle
                        key={item.key}
                        cx={12 + i * 56}
                        cy={66 - (item.count / maxCount) * 50}
                        r="2.5"
                        fill="var(--foreground)"
                      />
                    ))}
                  </svg>
                  <div className="chart-months">
                    {months.map((item) => (
                      <span key={item.key}>{item.label}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Source>
              文章 + 近況 + 收藏目錄
              {latest && <> · 最新文章 / 近況 {latest.date}</>}
            </Source>
          </section>
        </div>

        <div className="metric-grid" aria-label="站內內容數量">
          {metrics.map((metric) => (
            <Link
              href={metric.href}
              key={metric.label}
              className="quiet-panel metric-panel"
            >
              <div className="panel-heading">
                <h2>{metric.label}</h2>
                <ArrowUpRight size={14} aria-hidden="true" />
              </div>
              <div className="metric-body">
                <div>
                  <span className="big-number">{metric.value}</span>
                  <span className="number-unit">{metric.unit}</span>
                </div>
                <p className="secondary">{metric.note}</p>
              </div>
              <Source>{metric.source} · 已公開</Source>
            </Link>
          ))}
        </div>

        <div className="reading-grid">
          <section className="quiet-panel">
            <PanelHeading
              title="最近寫下的"
              href="/blog/"
              note="全部文章與近況"
            />
            <div className="entry-table">
              {entries.slice(0, 5).map((entry) => (
                <Link href={entry.href} key={entry.href} className="entry-row">
                  <time dateTime={entry.date}>{entry.date}</time>
                  <div>
                    <span className="entry-type">{entry.type}</span>
                    <h3>{entry.title}</h3>
                    <p>{entry.desc || "閱讀完整內容。"}</p>
                  </div>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              ))}
              {!entries.length && (
                <p className="empty-copy">還沒有公開的文章或近況。</p>
              )}
            </div>
            <Source>文章與近況目錄 · 依發布日期排序</Source>
          </section>
          <section className="quiet-panel project-panel">
            <PanelHeading
              title="做過的東西"
              href="/project/"
              note={`${projects.length} 個專案`}
            />
            <div>
              {projects.slice(0, 3).map((project) => (
                <a
                  className="project-row"
                  href={project.link}
                  key={project.title}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="project-title">
                    <h3>{project.title}</h3>
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </div>
                  <p>{project.desc}</p>
                  <span className="project-tech">
                    {project.tags.join(" / ")}
                  </span>
                </a>
              ))}
            </div>
            <Source>專案清單 · 原始碼連結至 GitHub</Source>
          </section>
        </div>

        <section className="quiet-panel library-panel">
          <PanelHeading
            title="喜歡的作品"
            href="/library/"
            note="瀏覽全部收藏"
          />
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
                    sizes="(max-width: 639px) 40vw, (max-width: 1100px) 22vw, 250px"
                    className={
                      item.image.fit === "contain"
                        ? "object-contain"
                        : "object-cover"
                    }
                  />
                </div>
                <div className="pick-meta">
                  <span>{categories[item.category]}</span>
                  <span
                    className={
                      item.status === "watching" || item.status === "playing"
                        ? "status-ok"
                        : "secondary"
                    }
                  >
                    {statuses[item.status]}
                  </span>
                </div>
                <div className="pick-title">
                  <h3>{item.title}</h3>
                  {item.rating !== null && (
                    <span>
                      <strong>{item.rating.toFixed(1)}</strong>
                      <small> / 10</small>
                    </span>
                  )}
                </div>
                <p>{item.note}</p>
              </Link>
            ))}
            {!picks.length && <p className="empty-copy">還沒有公開的收藏。</p>}
          </div>
          <Source>收藏目錄 · 個人評分與心得</Source>
        </section>

        <section className="quiet-panel history-panel">
          <PanelHeading title="走過的路" href="/timeline/" note="完整經歷" />
          <div className="history-grid">
            {history.map((item) => (
              <div
                key={`${item.title}-${item.period}`}
                className="history-item"
              >
                <span className="secondary">{item.period}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
            ))}
          </div>
          <Source>經歷時間軸 · 最近三筆紀錄</Source>
        </section>
      </main>
      <footer className="status-footer">
        <span>© Hawks · hawks.tw</span>
        <div>
          <Link href="/blogroll/">部落卷</Link>
          <Link href="/search/">搜尋</Link>
          <Link href="/subscribe/">RSS 訂閱 ↗</Link>
        </div>
      </footer>
    </div>
  );
}
