import { ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { UserError } from './store.mjs';
import { releaseCopy } from './copy-flow.mjs';
import { parseObsidianMessage, fromObsidianBody } from './obsidian-format.mjs';

export function embedded(payload) {
  if (typeof payload === 'string') payload = { content: payload };
  if (!payload || typeof payload !== 'object') return payload;
  const { content, ...rest } = payload;
  const embeds = [...(rest.embeds || [])];
  if (content) embeds.unshift({ color: 0x8b9cff, description: content.slice(0, 4096) });
  return { ...rest, content: null, ...(embeds.length ? { embeds } : {}) };
}
export function parseMessage(text) {
  if (text.startsWith('---')) return parseObsidianMessage(text);
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const title = (lines.shift() || '').replace(/^#{1,6}\s*/, '').trim();
  if (!title || title.length > 200) throw new UserError('第一行請寫 1–200 字的文章標題。');
  const input = { title, body: '', tags: [], desc: '' };
  while (lines.length) {
    const match = lines[0].match(/^(標籤|摘要|網址|日期|類型)[:：]\s*(.*)$/);
    if (!match) break;
    lines.shift();
    if (match[1] === '標籤') input.tags = [...new Set(match[2].split(/[,，]/).map(t => t.trim().replace(/^#+/, '').slice(0, 40)).filter(Boolean))].slice(0, 20);
    if (match[1] === '摘要') input.desc = match[2];
    if (match[1] === '網址') input.slug = match[2];
    if (match[1] === '日期') input.date = match[2];
    if (match[1] === '類型') input.kind = ({ blog: 'post', post: 'post', '部落格': 'post', talk: 'talk', '近況': 'talk' })[match[2].trim().toLowerCase()] || match[2];
  }
  input.body = lines.join('\n').replace(/^\n/, '');
  return input;
}
export const guide = embedded({ content: '**在這裡直接寫文章**\n\n傳一則新訊息：第一行是標題，其餘是 Markdown 內文。\n**修改：**用 Discord 的「編輯訊息」，儲存後狀態卡會更新。\n**長文：**回覆原文、續寫段落或狀態卡，文字會依序接在同一篇文章。每段都可單獨編輯。\n**設定：**標題下方可加 `標籤：生活, 技術`、`摘要：一句話介紹`、`網址：my-post`，然後空一行寫內文。\n**發布：**按狀態卡的發布按鈕，再確認；聊天與修改都不會自動公開。\n\n刪除已追蹤訊息時保留最後草稿，暫停同步與發布。要接著寫可複製成獨立草稿，或以新訊息重新建立文章。\n僅指定作者能寫入。頻道設為私人（伺服器管理員仍可查看）。可在文章或回覆附上照片，bot 會壓縮、移除 EXIF 並保存；圖說以「圖說：」指定。在內文獨立一行寫 [[圖1]] 可放置同則訊息第一張附件；[[圖2]] 是第二張。已有照片可從「照片與封面」多選照片，再選段落批次插入。不需要複製路徑。AI 或批次排圖完成後，按「取得可複製全文」，選擇想採用的部分貼回原訊息即可，也可以略過；草稿以你的訊息為準。發布前可看閱讀版預覽、照片與版本差異。瀏覽舊文可選「編輯這篇」，再以選段回覆修改。' });

export class ChannelWriter {
  constructor({ store, channelId, owners, client, card, media, busy = new Set() }) {
    Object.assign(this, { store, channelId, owners, client, card, media, busy });
    const dir = path.join(store.dir, 'channel-writing');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    this.file = path.join(dir, `${channelId}.json`);
    this.state = fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : { bindings: {}, cursor: null };
    this.queue = Promise.resolve();
  }
  save() {
    fs.writeFileSync(`${this.file}.tmp`, JSON.stringify(this.state, null, 2), { mode: 0o600 });
    fs.renameSync(`${this.file}.tmp`, this.file);
  }
  enqueue(fn) {
    const task = this.queue.then(fn);
    this.queue = task.catch(error => console.error(`Channel writing failed: ${error.name} ${error.code || ''}`));
    return task;
  }
  bindingFor(id) {
    if (!id) return undefined;
    return Object.values(this.state.bindings).find(b => b.rootId === id || b.panelId === id || b.parts.includes(id) || b.sections?.some(s => s.cardId === id || s.messageId === id));
  }
  async channel() { return this.client.channels.fetch(this.channelId); }
  async notice(channel, content) { return channel.send(embedded(content)); }
  async process(message) {
    if (message.channelId !== this.channelId || message.author?.bot || !this.owners.has(message.author?.id)) return;
    const existing = this.bindingFor(message.id) || this.bindingFor(message.reference?.messageId);
    if (existing) await releaseCopy(this, existing);
    if (this.state.retired?.includes(message.id)) {
      const matches = Object.values(this.state.bindings).filter(b => b.owner === message.author.id && this.store.read(b.draftId, b.owner).history.some(h => h.source?.rootId === message.id));
      if (matches.length !== 1) return;
      const b = matches[0];
      await releaseCopy(this, b);
      await this.useOriginal(b, message.id);
    }
    let b = this.bindingFor(message.id);
    if (!b && message.reference?.messageId) {
      b = this.bindingFor(message.reference.messageId);
      // Retired sources cannot overwrite restored/AI-edited text, but new replies
      // to their original article still belong to the current draft.
      if (!b && this.state.retired?.includes(message.reference.messageId)) {
        const matches = Object.values(this.state.bindings).filter(candidate => {
          if (candidate.owner !== message.author.id) return false;
          const draft = this.store.read(candidate.draftId, candidate.owner);
          return candidate.replyAliases?.includes(message.reference.messageId) || draft.history.some(version => version.source?.rootId === message.reference.messageId);
        });
        if (matches.length === 1) b = matches[0];
      }
      if (!b || b.owner !== message.author.id) return;
      if (!message.content?.trim() && !message.attachments?.size) return;
      const section = b.sections?.find(s => s.cardId === message.reference.messageId || s.messageId === message.reference.messageId);
      if (section && !b.copySources) { if (section.messageId && section.messageId !== message.id) this.state.retired = [...(this.state.retired || []), section.messageId]; section.messageId = message.id; this.save(); }
      else if (b.sections) { b.sections.push({ text: '\n\n', prefix: '\n\n', messageId: message.id }); this.save(); }
      else if (!b.parts.includes(message.id)) { b.parts.push(message.id); this.save(); }
    }
    if (!b) {
      if (!message.content?.trim()) {
        if (message.attachments?.size) await this.notice(message.channel, '附件不會直接變成文章。請先傳送標題與內文；請將照片附在含標題的文章，或回覆文章／狀態卡上傳照片。');
        return;
      }
      let input;
      try { input = parseMessage(message.content); }
      catch (error) { await this.notice(message.channel, error.message); return; }
      let draft;
      try { draft = this.store.create(message.author.id, { ...input, source: { channelId: this.channelId, rootId: message.id } }); }
      catch (error) { if (!(error instanceof UserError)) throw error; await this.notice(message.channel, error.message); return; }
      b = { rootId: message.id, owner: message.author.id, draftId: draft.id, parts: [], panelId: null };
      this.state.bindings[message.id] = b;
      this.save();
    }
    await this.sync(b);
    if (!this.state.cursor || BigInt(message.id) > BigInt(this.state.cursor)) { this.state.cursor = message.id; this.save(); }
  }
  async useOriginal(b, id) {
    const message = await (await this.channel()).messages.fetch({ message: id, force: true });
    if (message.author?.id !== b.owner) throw new UserError('原訊息作者不符，未變更草稿。');
    delete this.state.bindings[b.rootId];
    b.replyAliases = [...new Set([...(b.replyAliases || []), b.rootId])];
    b.rootId = id; b.parts = []; b.preserveMetadata = true;
    delete b.sections; delete b.copySources; delete b.staleSource;
    this.state.retired = (this.state.retired || []).filter(value => value !== id);
    this.state.bindings[id] = b;
    const d = this.store.read(b.draftId, b.owner);
    this.store.update(d.id, b.owner, d.revision, { source: { channelId: this.channelId, rootId: id } });
    this.save();
  }
  async panel(b, note) {
    const channel = await this.channel();
    const d = this.store.read(b.draftId, b.owner);
    const payload = this.card(d);
    payload.embeds[0].description = (note || b.issue || (d.published ? '修改已儲存；再次發布後才會更新網站。' : '已儲存草稿，尚未公開。'));
    payload.embeds[0].fields.push({ name: '直接編輯原訊息即可更新', value: `[跳到原文](https://discord.com/channels/${channel.guildId}/${this.channelId}/${b.rootId})\n${b.sections?.length || b.parts.length + 1} 個段落 · 回覆原文或這張卡片即可續寫` });
    payload.embeds[0].timestamp = d.updatedAt;
    if (b.deployment && b.deployment.commit === d.published?.commit) {
      payload.embeds[0].fields.push({ name: '網站部署', value: `${b.deployment.text}\n[查看部署進度](${b.deployment.url})` });
    }
    if (b.issue) { payload.embeds[0].color = 0xf2b84b; payload.components = []; }
    try {
      if (b.panelId) { const previous = await channel.messages.fetch(b.panelId); await previous.edit(payload); return; }
    } catch (error) { if (error.code !== 10008) throw error; }
    const sent = await channel.send(payload);
    b.panelId = sent.id; this.save();
  }
  async sync(b, { force = false } = {}) {
    if (this.busy.has(b.draftId) && !force) { b.pending = true; this.save(); return; }
    const channel = await this.channel();
    await releaseCopy(this, b);
    if (b.staleSource) await this.useOriginal(b, b.staleSource);
    const messages = [];
    for (const section of b.sections || [b.rootId, ...b.parts].map(messageId => ({ messageId }))) {
      if (!section.messageId) { messages.push({ content: section.text, author: { id: b.owner }, attachments: new Map() }); continue; }
      const id = section.messageId;
      try {
        const message = await channel.messages.fetch({ message: id, force: true });
        messages.push(b.copySources ? { content: (section.prefix || '') + message.content.trim() + (section.suffix || ''), author: message.author, attachments: message.attachments } : message);
      }
      catch (error) {
        if (error.code !== 10008) throw error;
        b.issue = '原文或續寫訊息已刪除。已保留最後草稿與歷史版本，暫停同步與發布；可用 /blog open 匯出或複製草稿。';
        this.save(); await this.panel(b); return;
      }
    }
    let d = this.store.read(b.draftId, b.owner);
    try {
      if (messages.some(m => m.author?.id !== b.owner || (!b.sections && !m.content?.trim() && !m.attachments?.size))) throw new UserError('原訊息為空或無法讀取，已保留草稿，暫停發布。請確認訊息內容與 bot 權限。');
      const combinedText = fromObsidianBody(messages.map(m => m.content || '').join(b.copySources ? '' : '\n\n'));
      const placedUrls = new Set([...combinedText.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(match => match[1]));
      const rendered = [];
      for (const m of messages) rendered.push(this.media ? await this.media.renderMessage(m, { placedUrls }) : { text: m.content, assets: [] });
      const input = parseMessage(rendered[0].text);
      if (b.preserveMetadata && !messages[0].content.startsWith('---')) {
        for (const [label, key] of [['標籤', 'tags'], ['摘要', 'desc']]) {
          if (!new RegExp(`^${label}[:：]`, 'm').test(messages[0].content)) input[key] = d[key];
        }
      }
      input.body = b.sections ? input.body + rendered.slice(1).map(r => r.text).join('') : [input.body, ...rendered.slice(1).map(r => r.text)].filter(Boolean).join('\n\n');
      input.body = fromObsidianBody(input.body);
      const incoming = rendered.flatMap(r => r.assets);
      input.assets = [...new Map([...(d.assets || []), ...incoming].filter(a => input.body.includes(a.url)).map(a => [a.hash, a])).values()].sort((a, b) => input.body.indexOf(a.url) - input.body.indexOf(b.url));
      if (input.assets.length > 30) throw new UserError('每篇文章最多 30 張保存的照片，請拆成多篇文章。');
      input.cover = input.cover !== undefined ? input.cover : d.cover && (input.body.includes(d.cover) || !(d.assets || []).some(a => a.url === d.cover)) ? d.cover : input.assets[0]?.url || '';

      if (d.published && input.slug && input.slug !== d.slug) throw new UserError('已發布文章不能修改網址；請將「網址：」改回原值。草稿保留，發布暫停。');
      if (d.published && input.kind && input.kind !== d.kind) throw new UserError('已發布文章不能改變類型。');
      const changed = ['title', 'body', 'desc', 'tags', 'slug', 'date', 'kind', 'assets', 'cover', 'metadata'].some(k => input[k] !== undefined && JSON.stringify(input[k]) !== JSON.stringify(d[k]));
      const previousLength = d.body.replace(/\s/g, '').length;
      if (changed) d = this.store.update(d.id, d.owner, d.revision, input);
      const hadIssue = !!b.issue;
      b.issue = null; b.pending = false; this.save();
      if (changed || hadIssue || !b.panelId || force) {
        const delta = d.body.replace(/\s/g, '').length - previousLength;
        const note = changed ? `偵測到訊息修改，已儲存 v${d.revision}（字數 ${delta >= 0 ? '+' : ''}${delta}）。${d.published ? '網站仍是先前版本，需再次確認發布。' : '這篇仍是私人草稿。'}` : undefined;
        await this.panel(b, note);
      }
    } catch (error) {
      if (!(error instanceof UserError)) throw error;
      b.issue = error.message; this.save(); await this.panel(b);
    }
  }
  async checkout(draft) {
    const channel = await this.channel();
    const existing = Object.values(this.state.bindings).find(b => b.draftId === draft.id);
    const heading = `${draft.title}\n日期：${draft.date || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(draft.createdAt))}\n類型：${draft.kind}\n標籤：${draft.tags.join(', ')}\n摘要：${draft.desc || ''}\n網址：${draft.slug}\n`;
    const sections = [{ text: heading }];
    // Preserve exact body bytes between editable segments.
    for (let offset = 0; offset < draft.body.length; offset += 1500) sections.push({ text: draft.body.slice(offset, offset + 1500) });
    if (sections.length === 1) sections.push({ text: ' ' });
    let sent;
    if (existing?.panelId) {
      try { sent = await channel.messages.fetch(existing.panelId); }
      catch (error) { if (error.code !== 10008) throw error; }
    }
    if (!sent) sent = await channel.send(embedded('正在載入寫作工作區…'));
    const b = { rootId: sent.id, panelId: sent.id, owner: draft.owner, draftId: draft.id, parts: [], sections, deployment: existing?.deployment };
    if (existing) {
      b.replyAliases = [...new Set([...(existing.replyAliases || []), existing.rootId, existing.panelId, ...existing.parts].filter(Boolean))];
      this.state.retired = [...new Set([...(this.state.retired || []), existing.rootId, ...existing.parts, ...(existing.sections || []).map(s => s.messageId).filter(Boolean)])];
      delete this.state.bindings[existing.rootId];
    }
    this.state.bindings[b.rootId] = b; this.save();
    const current = this.store.read(draft.id, draft.owner);
    const updated = this.store.update(draft.id, draft.owner, current.revision, { source: { channelId: this.channelId, rootId: b.rootId, sections: true } });
    await this.panel(b, '已載入完整文章。選段修改會替換該段，未改段落保留；修改後仍需確認發布。');
    return updated;
  }
  sectionPicker(draft, page = 0) {
    const b = Object.values(this.state.bindings).find(b => b.draftId === draft.id);
    if (!b?.sections) throw new UserError('這篇文章請直接編輯原訊息。');
    const options = b.sections.slice(page * 25, page * 25 + 25).map((_, n) => ({ label: page * 25 + n === 0 ? '標題、摘要與標籤' : `內文第 ${page * 25 + n} 段`, value: String(page * 25 + n) }));
    if (!options.length) throw new UserError('找不到段落。');
    return { ...embedded('選擇段落後，在頻道回覆該段 Embed 貼上修改後的內容。'), components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`picksection:${draft.id}:${draft.revision}`).addOptions(options)), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`sectionpage:${draft.id}:${draft.revision}:${Math.max(0, page - 1)}`).setLabel('上一頁').setStyle(ButtonStyle.Secondary).setDisabled(page === 0), new ButtonBuilder().setCustomId(`sectionpage:${draft.id}:${draft.revision}:${page + 1}`).setLabel('下一頁').setStyle(ButtonStyle.Secondary).setDisabled((page + 1) * 25 >= b.sections.length))] };
  }
  async showSection(draft, index) {
    const b = Object.values(this.state.bindings).find(b => b.draftId === draft.id);
    const section = b?.sections?.[index];
    if (!section) throw new UserError('找不到這個段落。');
    const channel = await this.channel();
    const text = section.messageId ? (await channel.messages.fetch({ message: section.messageId, force: true })).content : section.text;
    const payload = { ...embedded(`**${draft.title.slice(0, 100)} · ${index === 0 ? '文章設定' : `第 ${index} 段`}**\n回覆這張卡，貼上完整的替換文字。之後直接編輯你的回覆即可。\n\n${text.slice(0, 1800)}`), files: [new AttachmentBuilder(Buffer.from(text), { name: `section-${index}.txt` })] };
    let sent;
    if (section.cardId) {
      try { sent = await channel.messages.fetch(section.cardId); await sent.edit(payload); }
      catch (error) { if (error.code !== 10008) throw error; }
    }
    if (!sent) sent = await channel.send(payload);
    section.cardId = sent.id; this.save();
    return `https://discord.com/channels/${channel.guildId}/${this.channelId}/${sent.id}`;
  }
  async beforePublish(draft) {
    const b = Object.values(this.state.bindings).find(b => b.draftId === draft.id);
    if (!b) return;
    await this.enqueue(() => this.sync(b, { force: true }));
    if (b.issue) throw new UserError(b.issue);
    if (this.store.read(draft.id, draft.owner).revision !== draft.revision) throw new UserError('偵測到原訊息有新修改，已同步。請從最新狀態卡重新確認發布。');
  }
  async refresh(draftId) {
    const b = Object.values(this.state.bindings).find(b => b.draftId === draftId);
    if (b) await this.enqueue(async () => { await this.sync(b); await this.panel(b); });
  }
  async reconcile() {
    const channel = await this.channel();
    // Walk back to the last persisted user message so offline edits and new replies are recovered.
    const pending = [];
    let before;
    while (true) {
      const page = await channel.messages.fetch({ limit: 100, ...(before ? { before } : {}) });
      if (!page.size) break;
      for (const m of page.values()) if (!this.state.cursor || BigInt(m.id) > BigInt(this.state.cursor)) pending.push(m);
      const oldest = [...page.keys()].reduce((a, b) => BigInt(a) < BigInt(b) ? a : b);
      if ((this.state.cursor && BigInt(oldest) <= BigInt(this.state.cursor)) || page.size < 100) break;
      before = oldest;
    }
    pending.sort((a, b) => BigInt(a.id) < BigInt(b.id) ? -1 : 1);
    for (const m of pending) await this.process(m);
    for (const b of Object.values(this.state.bindings)) { await this.sync(b); await this.panel(b); }
  }
}
