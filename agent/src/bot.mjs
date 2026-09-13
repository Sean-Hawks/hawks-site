import { prepareCopy } from './copy-flow.mjs';
import { photoGallery, placementPanel, placePhotos } from './photo-layout.mjs';
import { GeminiEditor } from './gemini.mjs';
import { templatePanel, blankTemplate, templateText } from './writing-template.mjs';
import { PublishReview } from './publish-review.mjs';
import { MediaStore } from './media.mjs';
import { checkDraft, changes, previewHtml } from './review.mjs';
import { DeploymentTracker } from './deployments.mjs';
import { ArticleArchive } from './archive.mjs';
import { ChannelWriter, embedded, parseMessage } from './channel-writing.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Client, GatewayIntentBits, Partials, Events, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, AttachmentBuilder } from 'discord.js';
import { importMarkdown } from './import.mjs';
import { Store, UserError, stats } from './store.mjs';
import { Publisher } from './github.mjs';

const owners = new Set((process.env.DISCORD_OWNER_IDS || '').split(',').map(x => x.trim()).filter(Boolean));
if (!owners.size || !process.env.DISCORD_BOT_TOKEN) throw new Error('請先設定 DISCORD_OWNER_IDS 與 DISCORD_BOT_TOKEN。');
const store = new Store(process.env.AGENT_DATA_DIR || '.data');
const publisher = new Publisher({ token: process.env.GITHUB_TOKEN, repository: process.env.GITHUB_REPOSITORY || 'Sean-Hawks/hawks-site',
  branch: process.env.GITHUB_BRANCH || 'main', siteUrl: process.env.SITE_URL || 'https://hawks.tw' });
const client = new Client({ intents: [GatewayIntentBits.Guilds, ...(process.env.DISCORD_BLOG_CHANNEL_ID ? [GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] : [])], partials: [Partials.Message, Partials.Channel], allowedMentions: { parse: [] } });
const busy = new Set();
const publishReview = new PublishReview();
const media = new MediaStore(store.dir);
const ai = new GeminiEditor({ key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || 'gemini-3.5-flash', dir: store.dir });
publisher.media = media;
const deployments = new DeploymentTracker({ dir: store.dir, publisher, client, workflow: process.env.GITHUB_DEPLOY_WORKFLOW || 'deploy.yml', onUpdate: async (job, text, color) => {
  if (!writer) return false;
  return writer.enqueue(async () => {
    const b = Object.values(writer.state.bindings).find(b => b.draftId === job.draftId || (!job.draftId && store.read(b.draftId, b.owner).published?.commit === job.commit));
    if (!b) return false;
    const d = store.read(b.draftId, b.owner);
    if (d.published?.commit === job.commit) {
      b.deployment = { commit: job.commit, text, color, url: job.runUrl || `https://github.com/${publisher.repository}/actions` };
      writer.save(); await writer.panel(b);
    }
    job.messageId = b.panelId;
    return true;
  });
} });
const archive = new ArticleArchive(publisher, async (article, owner) => {
  if (!writer || !article) throw new UserError('請先設定寫作頻道。');
  const existing = store.list(owner).find(d => d.published?.file === article.file);
  if (existing) return { ...card(existing), content: '這篇文章已有草稿，請繼續原本草稿，避免覆蓋未發布修改。' };
  const remote = await publisher.request(`contents/${article.file}?ref=${encodeURIComponent(publisher.branch)}`);
  if (!remote || remote.sha !== article.sha) throw new UserError('網站原文已有更新，請重新載入文章清單。');
  const latest = store.list(owner).find(d => d.published?.file === article.file);
  if (latest) return card(latest);
  const draft = store.create(owner, { title: article.title, body: article.body, desc: article.desc, tags: article.tags, kind: article.kind, slug: article.slug, date: article.date, metadata: { ...article.metadata, __remoteMedia: [...article.body.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map(m => m[1]) }, cover: article.metadata.ogImage || '', published: { file: article.file, sha: article.sha, url: article.url, revision: 1 } });
  const { history: _history, published: _published, ...baseline } = draft;
  void _history; void _published;
  draft.published.baseline = baseline; store.write(draft);
  const ready = await writer.enqueue(() => writer.checkout(draft));
  return { ...card(ready), content: `已帶回 <#${writer.channelId}>。按「選段修改」即可修改舊文。` };
});
const writer = process.env.DISCORD_BLOG_CHANNEL_ID ? new ChannelWriter({ store, client, owners, card, media, busy, channelId: process.env.DISCORD_BLOG_CHANNEL_ID }) : null;
const help = '**Hawks 寫作工作室**\n`/blog new` 開始寫作，表單送出即存草稿。\n`/blog list` 找回草稿、全文搜尋。\n`/blog import` 匯入 Markdown 長文。\n開啟草稿後可編輯、續寫、設定網址／標籤、預覽、匯出及發布。\n內文超過 4,000 字時，用「續寫」或「編輯段落」逐段修改。\n「版本紀錄」搭配 `/blog restore` 可復原最近 30 次修改。\n所有操作回覆僅自己可見；只有按下「確認發布」才會寫入網站 GitHub。';
function buttons(d) {
  return [
    [['edit', '編輯段落'], ['append', '續寫'], ['meta', '標題與設定'], ['preview', '預覽'], ['export', '匯出']],
    [['publish', '發布前檢查'], ['history', '版本紀錄'], ['copy', '複製草稿'], [d.archived ? 'unarchive' : 'archive', d.archived ? '移回草稿匣' : '封存']],
    [['photos', '照片與封面'], ['sections', '選段修改'], ['ai', 'AI 編輯助手'], ['kind', '近況／文章']]
  ].map(items => items.filter(([action]) => (!d.source || !['edit', 'append', 'meta'].includes(action)) && (action !== 'sections' || d.source?.sections) && (action !== 'photos' || d.assets?.length))).filter(items => items.length).map(items => new ActionRowBuilder().addComponents(items.map(([action, label]) => new ButtonBuilder()
    .setCustomId(`${action}:${d.id}:${d.revision}`).setLabel(label).setStyle(action === 'publish' ? ButtonStyle.Primary : ButtonStyle.Secondary))));
}
function card(d) {
  return { content: null, embeds: [{ title: d.title, description: d.desc || '還沒寫摘要，隨時可以補上。', color: 0x8b9cff,
    fields: [{ name: '寫作進度', value: stats(d) }, { name: '類型 / 網址', value: `${d.kind === 'talk' ? '近況' : '文章'} / ${d.slug}` },
      { name: '標籤', value: d.tags.join(' · ') || '無' },
      { name: '照片', value: `${d.assets?.length || 0} 張已保存${d.cover ? ' · 已設定封面' : ''}` },
      { name: '發布狀態', value: d.published ? `已送出 v${d.published.revision} 至 GitHub；修改需再次發布。\n${d.published.url}` : '私人草稿' }], footer: { text: `草稿 ID：${d.id}` } }], components: buttons(d) };
}
function field(id, label, value = '', long = false, required = true, max = 4000) {
  return new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(long ? TextInputStyle.Paragraph : TextInputStyle.Short)
    .setValue(value).setRequired(required).setMaxLength(max));
}
function chunks(body) {
  const result = [];
  for (let i = 0; i < body.length; i += 4000) result.push(body.slice(i, i + 4000));
  return result.length ? result : [''];
}
async function modal(i, action, d, page = 0, kind = 'post') {
  const m = new ModalBuilder().setCustomId(`${action}:${d?.id || kind}:${d?.revision || 0}:${page}`).setTitle(action === 'new' ? '開始一篇新文章' : action === 'meta' ? '文章設定' : action === 'append' ? '接著寫下去' : `編輯第 ${page + 1} 段`);
  if (action === 'new') m.addComponents(field('title', '文章標題', '', false, true, 200), field('body', '內文（也可以先空著）', '', true, false));
  else if (action === 'meta') m.addComponents(field('title', '標題', d.title, false, true, 200), field('desc', '摘要', d.desc, true, false, 1000),
    field('slug', '網址代稱（小寫英文、數字、連字號）', d.slug, false, true, 100), field('tags', '標籤（以逗號分隔）', d.tags.join(', '), false, false, 1000));
  else m.addComponents(field('body', action === 'append' ? '新增段落' : '內文（此段最多 4,000 字）', action === 'append' ? '' : chunks(d.body)[page], true, action === 'append'));
  await i.showModal(m);
}
export async function handle(i) {
  for (const method of ['reply', 'editReply', 'update']) {
    if (typeof i[method] === 'function') { const original = i[method].bind(i); i[method] = payload => original(embedded(payload)); }
  }
  if (!owners.has(i.user.id)) {
    if (i.isAutocomplete()) return i.respond([]);
    return i.reply({ content: '這是私人寫作工作室，你尚未被授權使用。', flags: MessageFlags.Ephemeral });
  }
  if (i.customId === 'writing-template' && writer) return i.reply({ ...blankTemplate(writer.channelId), flags: MessageFlags.Ephemeral });
  if (i.customId?.startsWith('browse:')) return archive.handle(i);
  if (i.isAutocomplete()) return i.respond(store.list(i.user.id, i.options.getFocused()).slice(0, 25).map(d => ({ name: `${d.title} · ${stats(d)}`.slice(0, 100), value: d.id })));
  if (i.isChatInputCommand()) {
    if (i.commandName !== 'blog') return;
    const sub = i.options.getSubcommand();
    if (sub === 'new' && writer) return i.reply({ ...blankTemplate(writer.channelId, i.options.getString('kind') || 'post'), flags: MessageFlags.Ephemeral });
    if (sub === 'new') return modal(i, 'new', null, 0, i.options.getString('kind') || 'post');
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    if (sub === 'help') return i.editReply(writer ? `到 <#${writer.channelId}> 直接傳送訊息寫文章。第一行是標題，其餘是內文。\n編輯原訊息就會自動儲存，回覆原文或狀態卡可以續寫。\n每篇文章的 Embed 卡片提供預覽、匯出、版本紀錄與發布按鈕；發布需再次確認。` : help);
    if (sub === 'browse') return i.editReply(await archive.open(i.user.id, i.options.getString('query') || '', i.options.getString('kind') || 'all'));
    if (sub === 'list') {
      const drafts = store.list(i.user.id, i.options.getString('query') || '');
      if (!drafts.length) return i.editReply('沒有符合的草稿。用 /blog new 開始寫吧。');
      return i.editReply({ content: `找到 ${drafts.length} 篇草稿，顯示最近 25 篇。可用 query 搜尋其他文章。`, components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('open-list').setPlaceholder('繼續哪一篇？').addOptions(drafts.slice(0, 25).map(d => ({ label: d.title.slice(0, 100), description: stats(d), value: d.id }))))] });
    }
    if (sub === 'import') {
      const file = i.options.getAttachment('file');
      const url = new URL(file.url);
      if (!['cdn.discordapp.com', 'media.discordapp.net'].includes(url.hostname) || url.protocol !== 'https:' || !/\.(md|txt)$/i.test(file.name) || file.size > 800000) throw new UserError('請上傳 800 KB 以內的 .md 或 .txt 附件。');
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
      if (!res.ok) throw new UserError('附件讀取失敗，請重新上傳。');
      const text = await res.text();
      if (text.length > 200000) throw new UserError('文章超過 200,000 字。');
      const draft = store.create(i.user.id, importMarkdown(text, file.name));
      return i.editReply(card(draft));
    }
    const id = i.options.getString('draft');
    if (busy.has(id)) throw new UserError('正在發布這篇文章，請稍後再試。');
    let d = store.read(id, i.user.id);
    if (sub === 'restore') {
      const version = i.options.getInteger('version');
      if (writer && d.source) d = await writer.enqueue(async () => writer.checkout(store.restore(id, i.user.id, d.revision, version)));
      else d = store.restore(id, i.user.id, d.revision, version);
    }
    return i.editReply(card(d));
  }
  if (i.isStringSelectMenu() && i.customId === 'open-list') return i.reply({ ...card(store.read(i.values[0], i.user.id)), flags: MessageFlags.Ephemeral });
  const [action, id, revisionText, pageText = '0'] = i.customId.split(':');
  const revision = Number(revisionText), page = Number(pageText);
  if (i.isModalSubmit() && action === 'new') {
    const d = store.create(i.user.id, { title: i.fields.getTextInputValue('title'), body: i.fields.getTextInputValue('body'), kind: id });
    return i.reply({ ...card(d), flags: MessageFlags.Ephemeral });
  }
  if (busy.has(id)) throw new UserError('正在發布這篇文章，請稍後再試。');
  let d = store.read(id, i.user.id);
  if (d.revision !== revision) throw new UserError('這個面板已過期，請用 /blog open 重新開啟最新版本。');
  if (d.source && (i.isModalSubmit() || ['edit', 'append', 'meta'].includes(action))) throw new UserError('請直接編輯頻道中的原訊息；回覆原文即可續寫。');
  if (i.isModalSubmit()) {
    let update;
    if (action === 'meta') update = { title: i.fields.getTextInputValue('title'), desc: i.fields.getTextInputValue('desc'), slug: i.fields.getTextInputValue('slug'), tags: i.fields.getTextInputValue('tags').split(/[,，]/) };
    else {
      const body = i.fields.getTextInputValue('body');
      const parts = chunks(d.body);
      if (action === 'edit') parts[page] = body;
      update = { body: action === 'append' ? `${d.body}${d.body ? '\n\n' : ''}${body}` : parts.join('') };
    }
    if (d.published && update.slug && update.slug !== d.slug) throw new UserError('已發布文章的網址不能更改，請使用「複製草稿」。');
    d = store.update(id, i.user.id, revision, update);
    return i.reply({ ...card(d), flags: MessageFlags.Ephemeral });
  }
  if (i.isStringSelectMenu() && action === 'section') return modal(i, 'edit', d, Number(i.values[0]));
  if (['edit', 'append', 'meta'].includes(action)) {
    if (action === 'edit' && d.body.length > 4000) {
      const parts = chunks(d.body);
      const rows = [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`section:${id}:${revision}`).addOptions(parts.slice(page, page + 25).map((part, n) => ({ label: `第 ${page + n + 1} 段`, description: part.replace(/\s+/g, ' ').slice(0, 80) || '空白', value: String(page + n) }))))];
      const navigation = [];
      if (page > 0) navigation.push(new ButtonBuilder().setCustomId(`edit:${id}:${revision}:${page - 25}`).setLabel('上一頁').setStyle(ButtonStyle.Secondary));
      if (page + 25 < parts.length) navigation.push(new ButtonBuilder().setCustomId(`edit:${id}:${revision}:${page + 25}`).setLabel('下一頁').setStyle(ButtonStyle.Secondary));
      if (navigation.length) rows.push(new ActionRowBuilder().addComponents(navigation));
      return i.reply({ content: '選擇要編輯的段落（每段最多 4,000 字）。', flags: MessageFlags.Ephemeral, components: rows });
    }
    return modal(i, action, d);
  }
  if (action === 'cancel') { publishReview.cancel(d); return i.update({ content: '已取消，草稿仍保留。', components: [], embeds: [] }); }
  if (['photopage', 'photocover', 'photoselect', 'photoall', 'phototarget', 'photoplace'].includes(action)) await i.deferUpdate();
  else await i.deferReply({ flags: MessageFlags.Ephemeral });
  if (action === 'unarchive') return i.editReply(card(store.update(id, i.user.id, revision, { archived: false })));
  if (action === 'kind') return i.editReply({ content: '選擇這份內容要放在哪裡。已發布內容會在下次確認發布時搬移，草稿階段不變更網站。', components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`setkind:${id}:${revision}`).addOptions({ label: '近況', value: 'talk' }, { label: '文章', value: 'post' }))] });
  if (action === 'usesource') {
    const binding = Object.values(writer.state.bindings).find(b => b.draftId === id);
    if (binding?.staleSource !== pageText) throw new UserError('原訊息修改提示已失效，請重新開啟草稿。');
    const source = await (await writer.channel()).messages.fetch({ message: pageText, force: true });
    if (source.author.id !== i.user.id) throw new UserError('這不是你的原訊息。');
    const rendered = await media.renderMessage(source);
    const { body, title } = parseMessage(rendered.text);
    d = await writer.enqueue(async () => writer.checkout(store.update(id, i.user.id, revision, { body, title, assets: [...new Map([...d.assets, ...rendered.assets].map(a => [a.hash, a])).values()] })));
    return i.editReply({ ...card(d), content: '已採用這則訊息的內文修改。請預覽後重新確認發布。' });
  }
  if (action === 'setkind') {
    const kind = i.values[0];
    const update = { kind, relocation: d.published ? { from: d.published.file, kind } : null };
    if (writer && d.source) { await writer.beforePublish(d); return i.editReply(await writer.enqueue(() => prepareCopy(writer, d, update))); }
    else d = store.update(id, i.user.id, revision, update);
    publishReview.cancel(d);
    return i.editReply(card(d));
  }
  if (action === 'ai') return i.editReply({ content: '選一種協助方式。按下後才會把本篇內文送給 Gemini；只有「照片圖說」會另外傳送前 3 張已保存的照片。整理完成後請按「取得可複製全文」，把想採用的部分貼回原訊息，也可以自行修改或略過。草稿以你的訊息為準。', components: [new ActionRowBuilder().addComponents(...[['aimeta', '標題／摘要／標籤'], ['aipolish', '保留語氣潤稿'], ['ailayout', 'Markdown 排版'], ['aireview', '檢查待補內容'], ['aiphotos', '照片圖說']].map(([action, label]) => new ButtonBuilder().setCustomId(`${action}:${id}:${revision}`).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(action === 'aiphotos' && !d.assets?.length)))] });
  if (['aimeta', 'aipolish', 'ailayout', 'aireview', 'aiphotos'].includes(action)) {
    if (writer && d.source) await writer.beforePublish(d);
    const result = await ai.suggest(d, { aimeta: 'metadata', aipolish: 'polish', ailayout: 'layout', aireview: 'review', aiphotos: 'photos' }[action], media);
    const notes = result.notes.join('\n') || '沒有額外提醒。';
    const summary = result.mode === 'metadata' ? `**標題**：${result.update.title}\n**摘要**：${result.update.desc}\n**標籤**：${result.update.tags.join(' · ')}` : result.mode === 'photos' ? result.update.assets.slice(0, 3).map((a, n) => `${n + 1}. ${a.alt}`).join('\n') : ['polish', 'layout'].includes(result.mode) ? '編輯與排版差異在附件；原稿尚未修改。' : '以下是編輯建議，並非已完成的事實查核。';
    return i.editReply({ embeds: [{ title: 'Gemini 編輯建議', description: `${summary}\n\n${notes}${Number.isFinite(result.usage?.totalTokenCount) ? `\n\n本次 API 用量：${result.usage.totalTokenCount.toLocaleString()} tokens（不是剩餘額度）` : ''}`.slice(0, 4000), color: 0x8b9cff, footer: { text: `v${revision} · 30 分鐘內有效 · 記得複製貼回；草稿尚未變更` } }],
      files: Object.keys(result.update).length ? [new AttachmentBuilder(Buffer.from(changes(d, { ...d, ...result.update })), { name: 'ai-suggestions.diff' })] : [],
      components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`aiapply:${id}:${revision}:${result.token}`).setLabel('取得可複製全文').setStyle(ButtonStyle.Success).setDisabled(!Object.keys(result.update).length), new ButtonBuilder().setCustomId(`aiskip:${id}:${revision}:${result.token}`).setLabel('略過').setStyle(ButtonStyle.Secondary))] });
  }
  if (['aiapply', 'aiadjust', 'aiskip'].includes(action)) {
    const suggestion = ai.get(pageText, d, i.user.id);
    if (action === 'aiskip') { ai.discard(pageText); return i.editReply('已略過，原稿未改動。'); }
    if (!Object.keys(suggestion.update).length) throw new UserError('這份建議沒有需要貼回的內容。');
    if (!writer || !d.source) throw new UserError('請先在寫作頻道建立原訊息，再使用複製貼回流程。');
    await writer.beforePublish(d);
    const panel = await writer.enqueue(() => prepareCopy(writer, d, suggestion.update));
    publishReview.cancel(d); ai.discard(pageText);
    return i.editReply(panel);
  }
  if (action === 'sections' || action === 'sectionpage') return i.editReply(writer.sectionPicker(d, page));
  if (action === 'picksection') return i.editReply(`已準備好段落：[前往修改](${await writer.showSection(d, Number(i.values[0]))})`);
  if (['photos', 'photopage', 'photocover', 'setcover'].includes(action)) {
    if (action === 'photocover' || action === 'setcover') {
      const asset = d.assets[ action === 'photocover' ? Number(i.values[0]) : page ];
      if (!asset) throw new UserError('找不到照片。');
      d = store.update(id, i.user.id, revision, { cover: asset.url });
      if (writer && d.source) await writer.refresh(id);
    }
    return i.editReply({ attachments: [], ...await photoGallery(d, media, action === 'setcover' ? Math.floor(page / 6) : page) });
  }
  if (['photoselect', 'photoall', 'phototarget'].includes(action)) {
    const indices = action === 'photoselect' ? i.values.map(Number) : action === 'photoall' ? d.assets.slice(page * 6, page * 6 + 6).map((_, n) => page * 6 + n) : pageText.split(',').map(Number);
    return i.editReply(placementPanel(d, indices, action === 'phototarget' ? Number(i.customId.split(':')[4]) : 0));
  }
  if (action === 'photoplace') {
    const indices = pageText.split(',').map(Number).sort((a, b) => a - b);
    if (writer && d.source) {
      await writer.beforePublish(d);
      return i.editReply(await writer.enqueue(() => prepareCopy(writer, d, { body: placePhotos(d, indices, Number(i.values[0])) })));
    } else d = store.update(id, i.user.id, revision, { body: placePhotos(d, indices, Number(i.values[0])) });
    publishReview.cancel(d);
    const gallery = await photoGallery(d, media);
    gallery.embeds[0].description = `已放入 ${indices.length} 張照片並儲存 v${d.revision}，尚未發布。可以繼續安排其他照片，或按「預覽」。`;
    gallery.components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`preview:${id}:${d.revision}`).setLabel('預覽').setStyle(ButtonStyle.Primary)));
    return i.editReply({ attachments: [], ...gallery });
  }
  if (action === 'preview') {
    const html = Buffer.from(previewHtml(d, media, publisher.siteUrl));
    if (html.length > 8 * 1024 * 1024) throw new UserError('含照片的預覽超過 8 MB，請改用照片面板搭配 Markdown 匯出。');
    return i.editReply({ embeds: [{ title: d.title, description: `${stats(d)}\n下載 HTML 可看完整閱讀排版與已保存的照片，不會公開草稿。`, color: 0x8b9cff }], files: [new AttachmentBuilder(html, { name: `${d.slug}-preview.html` })] });
  }
  if (action === 'export') return i.editReply({ embeds: [{ description: '完整 Markdown 已匯出。' }], files: [new AttachmentBuilder(Buffer.from(templateText(d, d.body)), { name: `${d.slug}.md` })] });
  if (action === 'history') {
    if (!d.history.length) return i.editReply('還沒有歷史版本。');
    return i.editReply({ content: '選一個版本比較差異，再決定是否還原。', components: [new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`compare:${id}:${revision}`).addOptions(d.history.slice(-25).reverse().map(h => ({ label: `v${h.revision} · ${h.title}`.slice(0, 100), description: h.updatedAt, value: String(h.revision) }))))] });
  }
  if (action === 'compare') {
    const target = Number(i.values[0]), old = d.history.find(h => h.revision === target);
    if (!old) throw new UserError('版本已超過保留期限。');
    const diff = changes(old, d);
    return i.editReply({ embeds: [{ title: `v${target} → v${revision}`, description: `以下是差異節錄；附件包含完整差異。\n\n${diff.slice(0, 3200)}`, color: 0x8b9cff }], files: [new AttachmentBuilder(Buffer.from(diff), { name: 'changes.diff' })], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`restoreversion:${id}:${revision}:${target}`).setLabel(`確認還原 v${target}`).setStyle(ButtonStyle.Danger))] });
  }
  if (action === 'restoreversion') {
    if (writer && d.source) d = await writer.enqueue(async () => writer.checkout(store.restore(id, i.user.id, revision, page)));
    else d = store.restore(id, i.user.id, revision, page);
    return i.editReply({ ...card(d), content: '已還原成新版本，網站尚未更動。頻道文章可從「選段修改」繼續編輯，舊來源訊息不會覆蓋還原內容。' });
  }
  if (action === 'copy') return i.editReply(card(store.create(i.user.id, { title: `${d.title.slice(0, 190)}（複本）`, body: d.body, desc: d.desc, tags: d.tags, kind: d.kind, assets: d.assets || [], cover: d.cover || '', metadata: d.metadata })));
  if (action === 'archive') {
    store.update(id, i.user.id, revision, { archived: true });
    return i.editReply(`已從草稿匣封存。可使用 /blog open 加上 ID 取回：\n${id}`);
  }
  if (action === 'publish') {
    if (writer && d.source) await writer.beforePublish(d);
    const checks = checkDraft(d, media);
    const old = d.published?.baseline || d.history.find(h => h.revision === d.published?.revision);
    const diff = changes(old, d);
    const token = publishReview.begin(d);
    return i.editReply({ ...publishReview.panel(d, checks, publisher.siteUrl, token), files: [new AttachmentBuilder(Buffer.from(diff), { name: 'publish-changes.diff' })] });
  }
  if (action === 'reviewedit') {
    if (writer && d.source?.sections) {
      const url = await writer.showSection(d, 0);
      return i.editReply(templatePanel(d, '', { url, section: true }));
    }
    if (writer && d.source) {
      const channel = await writer.channel();
      const original = await channel.messages.fetch({ message: d.source.rootId, force: true });
      const { parseMessage } = await import('./channel-writing.mjs');
      const input = parseMessage(original.content);
      return i.editReply(templatePanel({ ...d, ...input }, input.body, { url: `https://discord.com/channels/${channel.guildId}/${d.source.channelId}/${d.source.rootId}` }));
    }
    return i.editReply({ ...templatePanel(d, d.body), content: '這是目前草稿模板。此草稿未綁定訊息，可用「標題與設定」修改；貼到頻道會建立另一篇草稿。', components: card(d).components });
  }
  if (action === 'reviewapprove') {
    if (writer && d.source) await writer.beforePublish(d);
    publishReview.approve(pageText, d, i.user.id, i.values || []);
    return i.editReply({ embeds: [{ title: '核對完成 · 2 / 2', description: `已確認「${d.title}」v${revision} 的文章資料、標籤摘要、圖片及公開範圍。\n按下最後確認後才會發布。`, color: 0x57bf8e }], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`confirm:${id}:${revision}:${pageText}`).setLabel('資料無誤，確認公開發布').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(`cancel:${id}:${revision}`).setLabel('取消').setStyle(ButtonStyle.Secondary))] });
  }
  if (action === 'confirm') {
    // Recheck after network acknowledgement so simultaneous confirmations cannot publish twice.
    if (busy.has(id)) throw new UserError('這篇文章正在發布。');
    publishReview.consume(pageText, d, i.user.id);
    busy.add(id);
    try {
      d = store.read(id, i.user.id);
      if (d.revision !== revision) throw new UserError('文章已修改，請重新確認發布。');
      if (writer && d.source) await writer.beforePublish(d);
      checkDraft(d, media);
      const published = await publisher.publish(d);
      const { history: _history, published: _published, source: _source, ...baseline } = d;
      void _history; void _published; void _source;
      store.update(id, i.user.id, revision, { published: { ...published, baseline }, relocation: null });
      archive.cache = null;
      if (writer) { try { await deployments.track(published, writer.channelId, d.title, d.id); } catch { console.error('Deployment notification pending; will retry from saved job.'); } }
      return i.editReply(`已寫入 GitHub，網站正在部署（尚未確認上線）。\n文章：${published.url}\n部署進度：https://github.com/${publisher.repository}/actions\nCommit：${published.commit.slice(0, 7)}`);
    } finally { busy.delete(id); if (writer && d.source) await writer.refresh(id); }
  }
}
if (writer) {
  const receive = message => {
    if (message.channelId !== writer.channelId) return;
    writer.enqueue(async () => {
      const current = message.partial ? await message.fetch() : message;
      await writer.process(current);
    }).catch(() => {});
  };
  client.on(Events.ShardResume, () => writer.enqueue(() => writer.reconcile()).catch(() => {}));
  client.on(Events.MessageCreate, receive);
  client.on(Events.MessageUpdate, (_old, message) => receive(message));
  client.on(Events.MessageDelete, message => {
    if (message.channelId !== writer.channelId) return;
    const b = writer.bindingFor(message.id);
    if (b) writer.enqueue(async () => { if (message.id === b.panelId) { b.panelId = null; writer.save(); } await writer.sync(b, { force: true }); }).catch(() => {});
  });
}
client.on(Events.InteractionCreate, async i => {
  const started = Date.now();
  const label = i.commandName || (i.customId || 'unknown').split(':')[0];
  console.log(`${new Date().toISOString()} interaction received: ${label}`);
  try {
    await handle(i);
    console.log(`${new Date().toISOString()} interaction completed: ${label} ${Date.now() - started}ms`);
  }
  catch (error) {
    const content = error instanceof UserError ? error.message : '操作未完成；草稿不會被刪除，請重新開啟後再試。';
    console.error(`Interaction failed: ${error.name} ${error.code ?? ''}`);
    try {
      if (i.isAutocomplete()) await i.respond([]);
      else if (i.deferred || i.replied) await i.editReply({ content, embeds: [], components: [] });
      else await i.reply({ content, flags: MessageFlags.Ephemeral });
    } catch { /* Expired interaction; never log interaction tokens. */ }
  }
});
const healthPath = path.join(store.dir, 'health.json');
let gatewayRouting = false;
function health() {
  fs.writeFileSync(healthPath, JSON.stringify({ pid: process.pid, checkedAt: new Date().toISOString(),
    ready: client.isReady(), gatewayRouting, ping: Number.isFinite(client.ws.ping) ? client.ws.ping : null }), { mode: 0o600 });
}
client.once(Events.ClientReady, c => {
  console.log(`${new Date().toISOString()} Hawks Agent 已上線：${c.user.tag}`);
  health();
  if (writer) writer.enqueue(() => writer.reconcile()).catch(() => {});
  deployments.poll().catch(() => {});
});
for (const event of [Events.ShardDisconnect, Events.ShardReconnecting, Events.ShardResume, Events.ShardReady]) {
  client.on(event, () => { console.log(`${new Date().toISOString()} gateway: ${event}`); health(); });
}
client.on(Events.Error, () => console.error('Discord 連線錯誤，等待重新連線。'));
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { client.destroy(); health(); process.exit(0); });
  try {
    const response = await fetch('https://discord.com/api/v10/applications/@me', {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }, signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error('無法驗證 Discord 應用程式設定。');
    const app = await response.json();
    if (app.interactions_endpoint_url) throw new Error('Interactions Endpoint URL 已設定；Gateway bot 收不到指令，請先修正路由。');
    if (writer && !(app.flags & ((1 << 18) | (1 << 19)))) throw new Error('需要在 Developer Portal 啟用 Message Content Intent。');
    gatewayRouting = true;
    await client.login(process.env.DISCORD_BOT_TOKEN);
    setInterval(health, 15000).unref();
    setInterval(() => deployments.poll().catch(() => {}), 30000).unref();
  } catch (error) {
    console.error(error.message?.includes('Endpoint') ? error.message : 'Discord 啟動失敗，請檢查 token、網路及應用程式設定。');
    client.destroy(); health(); process.exitCode = 1;
  }
}
