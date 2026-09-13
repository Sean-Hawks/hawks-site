import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import matter from 'gray-matter';

export class UserError extends Error {}
export class Store {
  constructor(dir) {
    this.dir = path.resolve(dir);
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
  }
  file(id) {
    if (!/^[a-f0-9-]{36}$/.test(id)) throw new UserError('找不到這份草稿。');
    return path.join(this.dir, `${id}.json`);
  }
  read(id, owner) {
    let draft;
    try { draft = JSON.parse(fs.readFileSync(this.file(id), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') throw new UserError('找不到這份草稿。'); throw error; }
    if (draft.owner !== owner) throw new UserError('這不是你的草稿。');
    return draft;
  }
  write(draft) {
    const file = this.file(draft.id);
    const temp = `${file}.${randomUUID()}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(draft, null, 2), { mode: 0o600 });
    fs.renameSync(temp, file);
    return draft;
  }
  dateSlug(date, kind = 'post', excludeId) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(date));
    const value = key => parts.find(p => p.type === key).value;
    const day = `${value('year')}-${value('month')}-${value('day')}`;
    const occupied = new Set(fs.readdirSync(this.dir).filter(f => /^[a-f0-9-]{36}\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(this.dir, f), 'utf8'))).filter(d => d.id !== excludeId && d.kind === kind).map(d => d.slug));
    if (!occupied.has(day)) return day;
    const timed = `${day}-${value('hour')}${value('minute')}`;
    let candidate = timed, suffix = 2;
    while (occupied.has(candidate)) candidate = `${timed}-${suffix++}`;
    return candidate;
  }
  create(owner, input) {
    input = validate(input);
    const id = randomUUID();
    const now = new Date().toISOString();
    return this.write({ id, owner, title: '未命名草稿', body: '', desc: '', tags: [],
      slug: this.dateSlug(input.date || now, input.kind || 'post'), kind: 'post', assets: [], cover: '', ...validate(input),
      revision: 1, history: [], createdAt: now, updatedAt: now });
  }
  update(id, owner, revision, input) {
    const draft = this.read(id, owner);
    if (draft.revision !== revision) throw new UserError('草稿已有新版本，請重新開啟後再修改。');
    const { history, ...snapshot } = draft;
    return this.write({ ...draft, ...validate(input), revision: revision + 1,
      history: [...history, snapshot].slice(-30), updatedAt: new Date().toISOString() });
  }
  list(owner, query = '') {
    return fs.readdirSync(this.dir).filter(f => /^[a-f0-9-]{36}\.json$/.test(f)).map(f => JSON.parse(fs.readFileSync(path.join(this.dir, f), 'utf8')))
      .filter(d => d.owner === owner && !d.archived && `${d.title} ${d.tags.join(' ')} ${d.body}`.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  restore(id, owner, revision, target) {
    const draft = this.read(id, owner);
    const old = draft.history.find(h => h.revision === target);
    if (!old) throw new UserError('找不到這個版本（保留最近 30 次修改）。');
    const { title, body, desc, tags, slug, kind, assets = [], cover = '', metadata, date } = old;
    return this.update(id, owner, revision, { title, body, desc, tags, slug: draft.published ? draft.slug : slug, kind: draft.published ? draft.kind : kind, assets, cover, metadata, date });
  }
}
function validate(input) {
  const out = {};
  for (const key of ['title', 'body', 'desc', 'slug', 'kind', 'tags', 'archived', 'published', 'source', 'assets', 'cover', 'metadata', 'date', 'relocation']) {
    if (input[key] !== undefined) out[key] = input[key];
  }
  if (out.title !== undefined && (!out.title.trim() || out.title.length > 200)) throw new UserError('標題需為 1–200 字。');
  if (out.body !== undefined && (typeof out.body !== 'string' || out.body.length > 200000)) throw new UserError('文章上限 200,000 字。');
  if (out.date !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(out.date) || Number.isNaN(Date.parse(out.date)) || new Date(out.date).toISOString().slice(0, 10) !== out.date)) throw new UserError('日期請填有效的 YYYY-MM-DD，例如 2026-09-09。');
  if (out.desc !== undefined && out.desc.length > 1000) throw new UserError('摘要上限 1,000 字。');
  if (out.slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(out.slug)) throw new UserError('網址代稱只能使用小寫英文、數字及連字號。');
  if (out.slug?.length > 100) throw new UserError('網址代稱上限 100 字。');
  if (out.kind !== undefined && !['post', 'talk'].includes(out.kind)) throw new UserError('不支援的文章類型。');
  if (out.tags !== undefined) out.tags = [...new Set(out.tags.map(t => String(t).trim().replace(/^#+/, '').slice(0, 40)).filter(Boolean))].slice(0, 20);
  return out;
}
export function markdown(draft, status = 'draft') {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(draft.createdAt));
  const { __remoteMedia: _remoteMedia, ...metadata } = draft.metadata || {};
  void _remoteMedia;
  return matter.stringify(draft.body, { ...(draft.kind === 'talk' ? { event: '', banner: '', slides: '', video: '', relatedPosts: [], ogImage: '' } : {}), ...metadata, title: draft.title, date: draft.date || date, desc: draft.desc, slug: draft.slug, tags: draft.tags.map(t => `#${t}`), ...(draft.cover ? { ogImage: draft.cover, ...(draft.kind === 'talk' ? { banner: draft.cover } : {}) } : {}), status });
}
export function stats(draft) {
  const characters = draft.body.replace(/\s/g, '').length;
  return `${characters.toLocaleString()} 字 · 約 ${Math.max(1, Math.ceil(characters / 500))} 分鐘 · v${draft.revision}`;
}
