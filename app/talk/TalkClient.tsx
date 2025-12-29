"use client";

import React from "react";
import { Calendar, Presentation, Video, Sparkles } from "lucide-react";
import ThemeStyles from "../components/ThemeStyles";
import Header from "../components/Header";
import { Talk } from "../types";
import MarkdownContent from "../components/MarkdownContent";

export default function TalkClient({ talks }: { talks: Talk[] }) {
  const years = Array.from(new Set(talks.map((t) => t.year)));
  const latestTalk = talks[0];
  const otherTalks = talks.slice(1);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="mx-auto max-w-6xl py-8">
          
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Talks</h1>
            <p className="mt-2 text-[rgb(var(--muted))]">分享、演講與教學記錄。</p>
          </div>

          {/* Latest Talk Highlight */}
          {latestTalk && (
            <div className="mb-16 rounded-2xl border border-[rgba(251,191,36,0.2)] bg-[rgba(251,191,36,0.03)] p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-32 h-32 text-[rgb(var(--accent))]" />
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(251,191,36,0.1)] px-3 py-1 text-xs font-bold text-[rgb(var(--accent))] mb-4">
                  <Sparkles className="w-3 h-3" />
                  LATEST TALK
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text))] mb-3">
                  {latestTalk.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-[rgb(var(--muted))] mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {latestTalk.date}
                  </span>
                  {latestTalk.event && (
                    <span className="rounded bg-[rgba(255,255,255,0.06)] px-2.5 py-0.5 text-xs">
                      {latestTalk.event}
                    </span>
                  )}
                </div>
                
                <div className="text-[rgb(var(--muted))] leading-relaxed max-w-3xl mb-6 text-lg">
                  <MarkdownContent content={latestTalk.desc} />
                </div>

                <div className="flex gap-3">
                  {latestTalk.slides && (
                    <a href={latestTalk.slides} target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-[rgb(var(--accent))] px-4 py-2 text-sm font-bold text-black hover:opacity-90 transition-opacity">
                      <Presentation className="h-4 w-4" /> View Slides
                    </a>
                  )}
                  {latestTalk.video && (
                    <a href={latestTalk.video} target="_blank" className="inline-flex items-center gap-2 rounded-lg bg-[rgba(255,255,255,0.1)] px-4 py-2 text-sm font-medium text-[rgb(var(--text))] hover:bg-[rgba(255,255,255,0.15)] transition-colors">
                      <Video className="h-4 w-4" /> Watch Video
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[200px_1fr]">
            
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
                  Timeline
                </h3>
                <nav className="space-y-6 border-l border-[rgba(255,255,255,0.06)] pl-4">
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

            <div className="space-y-12">
              {otherTalks.map((talk) => (
                <div key={talk.id} id={talk.id} className="relative scroll-mt-24 pl-8 border-l border-[rgba(255,255,255,0.1)]">
                  <div className="absolute -left-[5px] top-2 h-2.5 w-2.5 rounded-full bg-[rgb(var(--panel2))]" />
                  
                  <div className="rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] p-6 transition-colors hover:border-[rgba(255,255,255,0.15)]">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[rgb(var(--muted))]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {talk.date}
                      </span>
                      {talk.event && (
                        <span className="rounded bg-[rgba(255,255,255,0.06)] px-2 py-0.5 text-xs">
                          {talk.event}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-[rgb(var(--text))]">
                      {talk.title}
                    </h2>
                    
                    <div className="mt-2 text-[rgb(var(--muted))] leading-relaxed">
                      <MarkdownContent content={talk.desc} />
                    </div>

                    <div className="mt-4 flex gap-3">
                      {talk.slides && (
                        <a href={talk.slides} target="_blank" className="flex items-center gap-2 text-sm text-[rgb(var(--accent))] hover:underline">
                          <Presentation className="h-4 w-4" /> Slides
                        </a>
                      )}
                      {talk.video && (
                        <a href={talk.video} target="_blank" className="flex items-center gap-2 text-sm text-[rgb(var(--accent))] hover:underline">
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
