import React from "react";
import { FolderGit2, ExternalLink } from "lucide-react";
import { projects } from "../data/projects";

export default function ProjectsSection() {
  return (
    <div className="mt-6 border-t border-[rgba(255,255,255,0.06)] pt-6">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-[rgb(var(--text))]">
        <FolderGit2 className="h-5 w-5 text-[rgb(var(--accent))]" />
        Projects
      </h2>
      
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((project) => (
          <a
            key={project.title}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4 transition-colors hover:bg-[rgba(255,255,255,0.06)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))]">
                {project.title}
              </h3>
              <ExternalLink className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              {project.desc}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded text-[10px] text-[rgb(var(--muted))] opacity-70">
                  #{tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
