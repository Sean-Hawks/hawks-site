import type { ArticleHeading } from '../lib/headings';

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
