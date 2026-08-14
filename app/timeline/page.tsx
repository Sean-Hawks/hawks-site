import type { Metadata } from "next";
import { Github, Mail } from "lucide-react";
import Header from "../components/Header";
import SignalPageHeader from "../components/SignalPageHeader";
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

      <main className="resume-page mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <SignalPageHeader
          code="07 / LOGBOOK"
          title="一路做過的事"
          description="學習、專案、社群、競賽與音樂留下的時間座標。"
          statLabel="Records"
          statValue={String(resumeItems.length).padStart(2, "0")}
        >
          <div className="flex flex-wrap gap-3">
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
        </SignalPageHeader>

        <TimelineList items={resumeItems} />

        <footer className="border-t border-[rgb(var(--line)/0.09)] pt-6 text-xs leading-6 text-[rgb(var(--muted))]">
          Last updated August 2026 · me@hawks.tw · github.com/Sean-Hawks
        </footer>
      </main>
    </div>
  );
}
