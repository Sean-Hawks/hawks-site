import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export function readPublishedMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => {
      const { data } = matter(fs.readFileSync(path.join(dir, entry.name), 'utf8'), {
        engines: { javascript() { throw new Error('Executable frontmatter is not supported.'); } },
      });
      return { file: entry.name, data };
    })
    .filter(({ data }) => !['draft', 'private'].includes(String(data.status ?? '').trim().toLowerCase()));
}

export function removeStaleOgImages(dir, expected) {
  for (const name of fs.readdirSync(dir)) {
    if (/^(blog|talk)-.+\.png$/.test(name) && !expected.has(name)) fs.unlinkSync(path.join(dir, name));
  }
}
