import { randomUUID } from 'node:crypto';
import matter from 'gray-matter';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } from 'discord.js';
import { UserError } from './store.mjs';

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'post';
}
export function parseArticle(source, filename, kind, siteUrl) {
  if (source.startsWith('---') && !/^---\r?\n/.test(source)) throw new UserError('文章 frontmatter 格式不支援。');
  const { data, content } = matter(source, { engines: { javascript() { throw new Error("Executable frontmatter is not supported."); } } });
  if (['draft', 'private'].includes(String(data.status || '').trim().toLowerCase())) return null;
  const basename = filename.replace(/\.md$/, '');
  const slug = kind === 'post' ? slugify(typeof data.slug === 'string' && data.slug ? data.slug : basename) : basename;
  const title = String(data.title || content.replace(/[#>*_`~\n]/g, ' ').trim().slice(0, 80) || basename).slice(0, 200);
  return { title, date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || '').slice(0, 30),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [], body: content, source, kind, slug, metadata: data, desc: String(data.desc || ''), filename,
    url: `${siteUrl.replace(/\/$/, '')}/${kind === 'post' ? 'blog' : 'talk'}/${encodeURIComponent(slug)}/` };
}
export const archiveEntry = () => new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('browse:home').setLabel('瀏覽以前的文章').setStyle(ButtonStyle.Primary), new ButtonBuilder().setCustomId('writing-template').setLabel('取得寫作模板').setStyle(ButtonStyle.Secondary));
const button = (id, label, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(disabled);
export class ArticleArchive {
  constructor(publisher, onEdit) { this.publisher = publisher; this.onEdit = onEdit; this.sessions = new Map(); this.cache = null; this.loading = null; }
  async load() {
    if (this.cache && Date.now() - this.cache.time < 60000) return this.cache.items;
    if (this.loading) return this.loading;
    this.loading = (async () => {
      const items = [];
      for (const kind of ['post', 'talk']) {
        const directory = `content/${kind === 'post' ? 'posts' : 'talks'}`;
        const entries = await this.publisher.request(`contents/${directory}?ref=${encodeURIComponent(this.publisher.branch)}`);
        if (!entries) throw new UserError(`無法讀取 ${directory}，請檢查 repository、分支或 GitHub 權限。`);
        if (!Array.isArray(entries)) throw new UserError('文章目錄格式不正確。');
        const files = entries.filter(e => e.type === 'file' && e.name.endsWith('.md'));
        let next = 0;
        await Promise.all(Array.from({ length: Math.min(4, files.length) }, async () => {
          while (next < files.length) {
            const file = files[next++];
            const remote = await this.publisher.request(`contents/${directory}/${encodeURIComponent(file.name)}?ref=${encodeURIComponent(this.publisher.branch)}`);
            if (!remote || remote.encoding !== 'base64') throw new UserError('文章讀取失敗，請稍後重新開啟。');
            const article = parseArticle(Buffer.from(remote.content, 'base64').toString('utf8'), file.name, kind, this.publisher.siteUrl);
            if (article) items.push({ ...article, file: `${directory}/${file.name}`, sha: remote.sha });
          }
        }));
      }
      items.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
      this.cache = { time: Date.now(), items }; return items;
    })();
    try { return await this.loading; } finally { this.loading = null; }
  }
  async open(owner, query = '', kind = 'all') {
    const all = await this.load();
    const q = query.toLowerCase();
    const items = all.filter(a => (kind === 'all' || a.kind === kind) && `${a.title} ${a.body} ${a.tags.join(' ')}`.toLowerCase().includes(q));
    for (const [key, value] of this.sessions) if (Date.now() - value.time > 1800000) this.sessions.delete(key);
    if (this.sessions.size >= 100) this.sessions.delete(this.sessions.keys().next().value);
    const id = randomUUID().slice(0, 8);
    this.sessions.set(id, { owner, items, query, time: Date.now() });
    return this.list(id, 0);
  }
  session(id, owner) {
    const s = this.sessions.get(id);
    if (!s || Date.now() - s.time > 1800000) throw new UserError('這個閱讀面板已過期，請按頻道的「瀏覽以前的文章」重新開啟。');
    if (s.owner !== owner) throw new UserError('請自行開啟文章瀏覽面板。');
    return s;
  }
  list(id, page) {
    const s = this.sessions.get(id), pageSize = 8;
    const total = Math.max(1, Math.ceil(s.items.length / pageSize));
    page = Math.min(Math.max(0, page), total - 1);
    const subset = s.items.slice(page * pageSize, (page + 1) * pageSize);
    const payload = { content: null, embeds: [{ title: '以前的文章', color: 0x8b9cff,
      description: s.items.length ? `共 ${s.items.length} 篇，從新到舊。選擇文章即可在 Discord 閱讀。${s.query ? `\n搜尋：${s.query.slice(0, 200)}` : ''}` : '找不到符合的已發布文章。',
      fields: subset.map(a => ({ name: `${a.kind === 'post' ? 'Blog' : '近況'} · ${a.date || '未註明日期'}`, value: `[${a.title.replace(/[\[\]]/g, '')}](${a.url})` })),
      footer: { text: `第 ${page + 1} / ${total} 頁 · 來源：網站 GitHub 已公開文章（快取 1 分鐘）` } }], components: [] };
    if (subset.length) payload.components.push(new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`browse:select:${id}:${page}`).setPlaceholder('選一篇文章來讀').addOptions(subset.map((a, n) => ({ label: a.title.slice(0, 100), description: `${a.date} · ${a.kind === 'post' ? 'Blog' : '近況'}`, value: String(page * pageSize + n) })))));
    payload.components.push(new ActionRowBuilder().addComponents(button(`browse:list:${id}:${page - 1}`, '上一頁', page === 0), button(`browse:list:${id}:${page + 1}`, '下一頁', page + 1 === total), button('browse:home', '重新載入')));
    return payload;
  }
  read(id, index, page) {
    const s = this.sessions.get(id), article = s.items[index];
    if (!article) throw new UserError('找不到這篇文章，請重新開啟。');
    const parts = [];
    const chars = Array.from(article.body || '（沒有內文）');
    // Keep pages well below Discord's 4,096 UTF-16-unit limit, including emoji.
    let part = '';
    for (const char of chars) { if ((part + char).length > 3500) { parts.push(part); part = ''; } part += char; }
    if (part) parts.push(part);
    page = Math.min(Math.max(0, page), parts.length - 1);
    return { content: null, embeds: [{ title: article.title, url: article.url, description: parts[page], color: 0x8b9cff,
      footer: { text: `${article.date} · 第 ${page + 1} / ${parts.length} 頁 · Discord 文字閱讀，完整排版請開啟網站` } }], components: [new ActionRowBuilder().addComponents(
        button(`browse:read:${id}:${index}:${page - 1}`, '上一段', page === 0), button(`browse:read:${id}:${index}:${page + 1}`, '下一段', page + 1 === parts.length),
        button(`browse:list:${id}:${Math.floor(index / 8)}`, '回文章列表'), button(`browse:export:${id}:${index}`, '下載 Markdown'),
        new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('在網站閱讀').setURL(article.url)), new ActionRowBuilder().addComponents(button(`browse:edit:${id}:${index}`, '編輯這篇'))] };
  }
  async handle(i) {
    const [, action, id, indexText, pageText] = i.customId.split(':');
    if (action === 'home') {
      if (i.message?.flags?.has(64)) { await i.deferUpdate(); return i.editReply(await this.open(i.user.id)); }
      await i.deferReply({ flags: 64 }); return i.editReply(await this.open(i.user.id));
    }
    const s = this.session(id, i.user.id);
    if (action === 'edit') {
      if (!this.onEdit) throw new UserError('請先設定寫作頻道。');
      await i.deferReply({ flags: 64 });
      return i.editReply(await this.onEdit(s.items[Number(indexText)], i.user.id));
    }
    if (action === 'export') {
      const a = s.items[Number(indexText)];
      if (!a) throw new UserError('找不到這篇文章。');
      return i.reply({ flags: 64, embeds: [{ description: '已匯出完整文章 Markdown。', color: 0x8b9cff }], files: [new AttachmentBuilder(Buffer.from(a.source), { name: `${a.slug}.md` })] });
    }
    await i.deferUpdate();
    if (action === 'select') return i.editReply(this.read(id, Number(i.values[0]), 0));
    if (action === 'read') return i.editReply(this.read(id, Number(indexText), Number(pageText)));
    return i.editReply(this.list(id, Number(indexText)));
  }
}
