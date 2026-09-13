import { markdownParser } from './markdown-renderer.mjs';
import sanitize from 'sanitize-html';
import { createPatch } from 'diff';
import { UserError, markdown } from './store.mjs';
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function changes(old, draft) {
  return createPatch(`${draft.slug}.md`, old ? markdown(old) : '', markdown(draft), old ? `v${old.revision}` : '空白', `v${draft.revision}`);
}
export function checkDraft(draft, media) {
  if (!draft.body.trim()) throw new UserError('文章沒有內文，請先寫正文。');
  for (const asset of draft.assets || []) media.read(asset);
  const references = [...draft.body.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(m => m[1]);
  for (const url of references) {
    if (url.startsWith('/images/blog/') && !(draft.assets || []).some(a => a.url === url) && !(draft.metadata?.__remoteMedia || []).includes(url)) throw new UserError('文章引用了未保存的照片。請先重新上傳或由舊文章帶回。');
    if (/^https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\//.test(url)) throw new UserError('內文仍使用 Discord 暫時附件網址，請直接上傳照片以永久保存。');
  }
  const notes = [];
  if (!draft.desc) notes.push('尚未填摘要，網站會自動擷取內文。');
  if (/!\[\]\(/.test(draft.body)) notes.push('有圖片尚未填寫替代文字。');
  if (references.some(u => /^https?:/.test(u))) notes.push('外部圖片仍依賴原網站；不會自動備份。');
  return { images: references.length, notes };
}
export function previewHtml(draft, media, siteUrl) {
  let html = markdownParser.parse(draft.body);
  html = sanitize(html, { allowedTags: sanitize.defaults.allowedTags.concat(['img', 'details', 'summary', 'aside']),
    allowedAttributes: { ...sanitize.defaults.allowedAttributes, img: ['src', 'alt', 'title'], code: ['class'], aside: ['class'] },
    allowedSchemes: ['http', 'https', 'data'], allowedSchemesByTag: { a: ['http', 'https'], img: ['http', 'https', 'data'] },
    transformTags: { img: (tagName, attrs) => {
      const asset = (draft.assets || []).find(a => a.url === attrs.src);
      const src = asset ? `data:image/webp;base64,${media.read(asset).toString('base64')}` : attrs.src?.startsWith('/') ? new URL(attrs.src, siteUrl).href : attrs.src;
      return { tagName, attribs: { ...attrs, src } };
    } } });
  return `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(draft.title)} · 草稿預覽</title><style>body{background:#11121a;color:#e8e6ef;font:18px/1.9 system-ui,sans-serif;margin:0}article{max-width:760px;margin:60px auto;padding:0 24px}h1,h2,h3{line-height:1.4}h1{font-size:2.3em}p{overflow-wrap:anywhere}img{max-width:100%;height:auto;border-radius:12px}pre{overflow:auto;background:#20212e;padding:20px;border-radius:10px}a{color:#9dafff}blockquote{border-left:3px solid #929bdd;margin:0;padding-left:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #454554;padding:8px}.admonition{border-left:4px solid #829bff;background:#829bff18;padding:12px 20px;margin:24px 0;border-radius:8px}.admonition-warning{border-color:#eab308}.admonition-tip,.admonition-success{border-color:#22c55e}.admonition-danger,.admonition-error{border-color:#ef4444}.note{color:#aaa6bb;font-size:14px}hr{border:0;border-top:1px solid #444}</style><article><p class="note">私人草稿 · v${draft.revision} · 閱讀版預覽（非網站完整介面）</p><h1>${escape(draft.title)}</h1><p class="note">${escape(draft.desc || '')}</p><hr>${html}</article></html>`;
}
