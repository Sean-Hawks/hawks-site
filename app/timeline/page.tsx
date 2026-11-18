import type { Metadata } from "next";
import { Github, Mail } from "lucide-react";
import Header from "../components/Header";
import TimelineList from "../components/TimelineList";
import ThemeStyles from "../components/ThemeStyles";
import { resumeItems } from "../data/resume";
import "./timeline.css";

export const metadata: Metadata = {
  title: "Timeline",
  description: "Hawks 的經歷紀事：學習、專案、社群與音樂。",
  alternates: {
    canonical: "https://hawks.tw/timeline/",
  },
  openGraph: {
    title: "Timeline",
    description: "Hawks 的經歷紀事：學習、專案、社群與音樂。",
    url: "https://hawks.tw/timeline/",
    images: ["/og/default.png"],
  },
};

export default function TimelinePage() {
  return (
    <div className="resume-print-root timeline-shell site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main id="main-content" tabIndex={-1} className="resume-page timeline-page mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-8 sm:pt-9">
        <header className="timeline-heading">
          <div>
            <h1>一路做過的事</h1>
            <p>{resumeItems.length} 筆經歷</p>
          </div>
        </header>

        <TimelineList items={resumeItems} />

        <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[rgb(var(--line)/0.14)] pt-5 text-xs text-[rgb(var(--muted))]">
          <a href="mailto:me@hawks.tw" className="inline-flex items-center gap-1.5 hover:underline"><Mail size={14} aria-hidden="true" />me@hawks.tw</a>
          <a href="https://github.com/Sean-Hawks" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><Github size={14} aria-hidden="true" />GitHub</a>
        </footer>
      </main>
    </div>
  );
}
