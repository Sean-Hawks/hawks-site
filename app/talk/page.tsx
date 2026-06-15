import Link from "next/link";
import { Calendar, Presentation, Video, Sparkles } from "lucide-react";
import { getSortedTalksData } from "../lib/talks";
import ThemeStyles from "../components/ThemeStyles";
import Header from "../components/Header";
import MarkdownContent from "../components/MarkdownContent";

export default function TalkPage() {
  const talks = getSortedTalksData();
  // 取得所有年份並去重
  const years = Array.from(new Set(talks.map((t) => t.year)));
  const latestTalk = talks[0];
  const otherTalks = talks.slice(1);

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="mx-auto max-w-6xl py-8">
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Talk Archive</h1>
            <p className="mt-2 text-[rgb(var(--muted))]">分享、演講與教學記錄。主要近況現在放在 Now 頁。</p>
          </div>

          {/* Latest Talk Highlight */}
          {latestTalk && (
            <div className="mb-16 rounded-2xl border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.07)] p-6 shadow-[0_22px_70px_rgba(90,76,55,0.10)] sm:p-8 relative overflow-hidden transition-all hover:border-[rgb(var(--accent)/0.36)] hover:bg-[rgb(var(--accent)/0.09)] group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-[rgb(var(--accent))]" />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent)/0.12)] px-3 py-1 text-xs font-bold text-[rgb(var(--accent))] mb-4">
                  <Sparkles className="w-3 h-3" />
                  LATEST TALK
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text))] mb-3 group-hover:text-[rgb(var(--accent))] transition-colors">
                  <Link href={`/talk/${latestTalk.id}`} className="before:absolute before:inset-0 focus:outline-none">
                    {latestTalk.title}
                  </Link>
                </h2>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--muted))] mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {latestTalk.date}
                  </span>
                  {latestTalk.event && (
                    <span className="rounded bg-[rgb(var(--line)/0.06)] px-2.5 py-0.5 text-xs">
                      {latestTalk.event}
                    </span>
                  )}
                </div>
                
                <div className="text-[rgb(var(--muted))] leading-relaxed max-w-3xl mb-6 text-lg line-clamp-3">
                  <MarkdownContent content={latestTalk.desc} />
                </div>

                <div className="flex gap-3 relative z-20">
                  {latestTalk.slides && (
                    <a href={latestTalk.slides} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-4 py-2 text-sm font-bold text-[rgb(var(--accent-foreground))] hover:opacity-90 transition-opacity">
                      <Presentation className="h-4 w-4" /> View Slides
                    </a>
                  )}
                  {latestTalk.video && (
                    <a href={latestTalk.video} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.05)] px-4 py-2 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--line)/0.08)] transition-colors">
                      <Video className="h-4 w-4" /> Watch Video
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[200px_1fr]">
            
            {/* 左側：黏性目錄 (Timeline) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  Timeline
                </h3>
                <nav className="space-y-6 border-l border-[rgb(var(--line)/0.10)] pl-4">
                  {years.map((year) => (
                    <div key={year} className="relative">
                      <div className="absolute -left-[21px] top-0 h-2.5 w-2.5 rounded-full border-2 border-[rgb(var(--bg))] bg-[rgb(var(--muted))] opacity-50" />
                      <div className="text-lg font-bold text-[rgb(var(--text))] mb-2 opacity-80">
                        {year}
                      </div>
                      <div className="space-y-2">
                        {talks
                          .filter((t) => t.year === year)
                          .map((talk) => (
                            <a
                              key={talk.id}
                              href={`#${talk.id}`}
                              className="block text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))] transition-colors truncate"
                            >
                              {talk.title}
                            </a>
                          ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* 右側：其餘演講列表 */}
            <div className="space-y-12">
              {otherTalks.map((talk) => (
                <div key={talk.id} id={talk.id} className="relative scroll-mt-24 pl-8 border-l border-[rgb(var(--line)/0.12)]">
                  <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-[rgb(var(--panel2))]" />
                  
                  <div className="rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-6 shadow-[0_18px_60px_rgba(90,76,55,0.07)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))] relative group">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[rgb(var(--muted))]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {talk.date}
                      </span>
                      {talk.event && (
                        <span className="rounded bg-[rgb(var(--line)/0.06)] px-2 py-0.5 text-xs">
                          {talk.event}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors">
                      <Link href={`/talk/${talk.id}`} className="before:absolute before:inset-0 focus:outline-none">
                        {talk.title}
                      </Link>
                    </h2>
                    
                    <div className="mt-2 text-[rgb(var(--muted))] leading-relaxed line-clamp-2">
                      <MarkdownContent content={talk.desc} />
                    </div>

                    <div className="mt-4 flex gap-3 relative z-20">
                      {talk.slides && (
                        <a href={talk.slides} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[rgb(var(--accent))] hover:underline">
                          <Presentation className="h-4 w-4" /> Slides
                        </a>
                      )}
                      {talk.video && (
                        <a href={talk.video} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[rgb(var(--accent))] hover:underline">
                          <Video className="h-4 w-4" /> Video
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
        
        <footer className="mx-auto max-w-6xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))]">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
        </footer>
      </div>
    </div>
  );
}
