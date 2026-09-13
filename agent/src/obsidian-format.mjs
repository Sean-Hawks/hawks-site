import matter from 'gray-matter';
import { UserError } from './store.mjs';
export function toObsidianBody(body) {
  return body.replace(/!\[([^\]]*)\]\((\/images\/[^)\s]+)\)/g, (_raw, alt, url) => `![[public${decodeURI(url)}|${alt.replace(/[|\]]/g, ' ')}]]`);
}
export function fromObsidianBody(body) {
  return body.replace(/!\[\[([^\]|]+\.(?:png|jpe?g|webp|avif|gif|svg))(?:\|([^\]]*))?\]\]/gi, (_raw, file, alt) => {
    const target = file.startsWith('public/images/') ? file.slice(7) : `images/${file}`;
    const label = alt && !/^\d+(x\d+)?$/.test(alt) ? alt : file.split('/').at(-1);
    return `![${label.replace(/[\[\]\\]/g, ' ')}](/${encodeURI(target).replace(/[()]/g, c => c === '(' ? '%28' : '%29')})`;
  });
}
export function parseObsidianMessage(text) {
  if (!/^---\r?\n/.test(text)) throw new UserError('請使用 YAML 標頭（--- 換行），不支援其他標頭引擎。');
  let parsed;
  try { parsed = matter(text, { language: 'yaml' }); } catch { throw new UserError('YAML 格式有誤，請檢查縮排、引號與結尾的 ---。'); }
  const data = parsed.data;
  if (!String(data.title || '').trim()) throw new UserError('請在 YAML 的 title 填入標題。');
  const kind = data.kind || (Object.hasOwn(data, 'relatedPosts') || Object.hasOwn(data, 'event') ? 'talk' : 'post');
  const metadata = Object.fromEntries(Object.entries(data).filter(([k]) => !['title','date','desc','slug','tags','status','kind'].includes(k)));
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
  return { title: String(data.title), body: fromObsidianBody(parsed.content), kind, desc: String(data.desc || ''), tags: Array.isArray(data.tags) ? data.tags.map(t => String(t).replace(/^#/, '')) : [], metadata,
    ...(date ? { date: String(date) } : {}), ...(data.slug ? { slug: String(data.slug) } : {}), ...(data.ogImage || data.banner ? { cover: String(data.ogImage || data.banner) } : {}) };
}
