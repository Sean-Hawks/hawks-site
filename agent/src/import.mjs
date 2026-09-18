import matter from 'gray-matter';
import { UserError } from './store.mjs';
export function importMarkdown(text, filename) {
  // Accept YAML only: gray-matter also supports executable JavaScript engines.
  if (text.startsWith('---') && !/^---\r?\n/.test(text)) throw new UserError('Frontmatter 請使用標準 YAML（--- 換行）。');
  const { data, content } = matter(text, { language: 'yaml', engines: { javascript() { throw new Error('Executable frontmatter is not supported.'); } } });
  return { title: String(data.title || filename.replace(/\.[^.]+$/, '')).slice(0, 200), body: content,
    desc: String(data.desc || ''), tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    ...(typeof data.slug === 'string' ? { slug: data.slug } : {}) };
}
