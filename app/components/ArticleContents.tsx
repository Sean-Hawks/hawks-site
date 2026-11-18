"use client";

import { useEffect, useState } from 'react';
import type { ArticleHeading } from '../lib/headings';

function useArticleLocation(headings: ArticleHeading[]) {
  const [current, setCurrent] = useState<string>();

  useEffect(() => {
    if (headings.length < 2) return;
    const targets = headings.map(({ id }) => document.getElementById(id)).filter(target => target !== null);
    if (!targets.length) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const margin = Number.parseFloat(getComputedStyle(targets[0]).scrollMarginTop) || 0;
      let location: string | undefined;
      for (const target of targets) {
        if (target.getBoundingClientRect().top > margin + 12) break;
        location = target.id;
      }
      setCurrent(location);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const content = targets[0].closest('.article-prose');
    const resize = content && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (content) resize?.observe(content);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    schedule();

    return () => {
      window.cancelAnimationFrame(frame);
      resize?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('hashchange', schedule);
    };
  }, [headings]);

  return current;
}

export function ArticleSidebar({ headings }: { headings: ArticleHeading[] }) {
  const current = useArticleLocation(headings);
  if (headings.length < 2) return null;
  const baseLevel = Math.min(...headings.map(heading => heading.level));

  return (
    <aside className="hidden min-w-0 lg:block">
      <div className="sticky top-40 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">目錄</h3>
        <nav aria-label="文章目錄" className="max-h-[calc(100vh-12rem)] space-y-1 overflow-y-auto">
          {headings.map(heading => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              style={{ paddingLeft: `${Math.max(0, heading.level - baseLevel) * 0.75}rem` }}
              aria-current={current === heading.id ? 'location' : undefined}
              className="article-toc-link block break-words py-1 text-sm leading-6 text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]"
            >
              {heading.title || '段落'}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default function ArticleContents({ headings, mobileOnly = true }: { headings: ArticleHeading[]; mobileOnly?: boolean }) {
  const current = useArticleLocation(headings);
  if (headings.length < 2) return null;
  return (
    <details className={`mb-8 rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel2)/0.6)] p-4 ${mobileOnly ? "lg:hidden" : ""}`}>
      <summary className="cursor-pointer py-1 font-semibold text-[rgb(var(--text))]">文章目錄 · {headings.length} 節</summary>
      <nav aria-label="文章目錄" className="mt-3 max-h-[50vh] overflow-y-auto">
        <ol className="space-y-1">
          {headings.map(heading => (
            <li key={heading.id} style={{ paddingLeft: `${Math.max(0, heading.level - 1) * 0.75}rem` }}>
              <a href={`#${heading.id}`} aria-current={current === heading.id ? 'location' : undefined} className="article-toc-link block break-words py-2 text-sm leading-6 text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]">{heading.title || '段落'}</a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
