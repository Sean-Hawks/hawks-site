import type { ArticleHeading } from '../lib/headings';

export function ArticleSidebar({ headings }: { headings: ArticleHeading[] }) {
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
              className="block break-words py-1 text-sm leading-6 text-[rgb(var(--muted))] transition-colors hover:text-[rgb(var(--accent))]"
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
  if (headings.length < 2) return null;
  return (
    <details className={`mb-8 rounded-xl border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--panel2)/0.6)] p-4 ${mobileOnly ? "lg:hidden" : ""}`}>
      <summary className="cursor-pointer py-1 font-semibold text-[rgb(var(--text))]">文章目錄 · {headings.length} 節</summary>
      <nav aria-label="文章目錄" className="mt-3 max-h-[50vh] overflow-y-auto">
        <ol className="space-y-1">
          {headings.map(heading => (
            <li key={heading.id} style={{ paddingLeft: `${Math.max(0, heading.level - 1) * 0.75}rem` }}>
              <a href={`#${heading.id}`} className="block break-words py-2 text-sm leading-6 text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]">{heading.title || '段落'}</a>
            </li>
          ))}
        </ol>
      </nav>
    </details>
  );
}
