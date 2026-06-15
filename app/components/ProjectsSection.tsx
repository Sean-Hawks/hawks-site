import { FolderGit2, ExternalLink } from "lucide-react";
import { projects } from "../data/projects";

export default function ProjectsSection({ showTitle = true }: { showTitle?: boolean }) {
  return (
    <div>
      {showTitle && (
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[rgb(var(--text))]">
          <FolderGit2 className="h-5 w-5 text-[rgb(var(--accent))]" />
          Projects
        </h2>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <a
            key={project.title}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.84)] p-5 shadow-[0_18px_60px_rgba(90,76,55,0.07)] transition-colors hover:border-[rgb(var(--accent)/0.28)] hover:bg-[rgb(var(--panel))]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
                {project.title}
              </h3>
              <ExternalLink className="h-4 w-4 text-[rgb(var(--muted))] transition-colors group-hover:text-[rgb(var(--accent))]" />
            </div>
            <p className="mt-2 text-sm leading-7 text-[rgb(var(--muted))]">
              {project.desc}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-[rgb(var(--line)/0.06)] px-2 py-1 text-xs text-[rgb(var(--muted))]">
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
