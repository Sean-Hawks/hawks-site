import type { Metadata } from "next";
import { Github, Mail } from "lucide-react";
import Header from "../components/Header";
import PrintResumeButton from "../components/PrintResumeButton";
import TimelineList from "../components/TimelineList";
import ThemeStyles from "../components/ThemeStyles";
import { resumeItems } from "../data/resume";

export const metadata: Metadata = {
  title: "Timeline",
  description: "Hawks 的時間軸履歷：學習、專案、社群與音樂經歷。",
  alternates: {
    canonical: "https://hawks.tw/timeline/",
  },
  openGraph: {
    title: "Timeline",
    description: "Hawks 的時間軸履歷：學習、專案、社群與音樂經歷。",
    url: "https://hawks.tw/timeline/",
    images: ["/og/default.png"],
  },
};

export default function TimelinePage() {
  return (
    <div className="resume-print-root site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="resume-page mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--accent))]">
            Timeline
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            一路做過的事
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[rgb(var(--muted))] sm:text-lg">
            我是 Hawks，一個還在摸索技術、音樂與社群之間可能性的學生。
            這裡不是定稿，而是一份會跟著我繼續往前長的履歷。
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <PrintResumeButton />
            <a
              href="mailto:me@hawks.tw"
              className="print-hidden inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-4 py-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:text-[rgb(var(--text))]"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
            <a
              href="https://github.com/Sean-Hawks"
              target="_blank"
              rel="noopener noreferrer"
              className="print-hidden inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-4 py-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:text-[rgb(var(--text))]"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </header>

        <TimelineList items={resumeItems} />

        <footer className="border-t border-[rgb(var(--line)/0.09)] pt-6 text-xs leading-6 text-[rgb(var(--muted))]">
          Last updated August 2026 · me@hawks.tw · github.com/Sean-Hawks
        </footer>
      </main>
    </div>
  );
}
