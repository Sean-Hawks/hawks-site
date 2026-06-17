import { ExternalLink, FolderGit2 } from "lucide-react";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { projects } from "../data/projects";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project",
  description: "Hawks 做過、正在做，或之後想慢慢補完的專案紀錄。",
  alternates: {
    canonical: "https://hawks.tw/project/",
  },
  openGraph: {
    title: "Project",
    description: "Hawks 做過、正在做，或之後想慢慢補完的專案紀錄。",
    url: "https://hawks.tw/project/",
    images: ["/og/default.png"],
  },
};

export default function ProjectPage() {
  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent)/0.08)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
            <FolderGit2 className="h-3.5 w-3.5" />
            Projects
          </div>
          <h1 className="text-3xl font-bold">Project</h1>
          <p className="mt-2 max-w-2xl leading-7 text-[rgb(var(--muted))]">
            放一些正在做、做過，或之後想慢慢補完的東西。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <a
              key={project.title}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.07)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
                  {project.title}
                </h2>
                <ExternalLink className="h-4 w-4 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))]" />
              </div>
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">{project.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-[rgb(var(--line)/0.06)] px-2 py-1 text-xs text-[rgb(var(--muted))]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-[rgb(var(--muted))] sm:px-3">
        <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
      </footer>
    </div>
  );
}
