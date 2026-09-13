import { randomUUID } from 'node:crypto';
import { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import matter from 'gray-matter';
import { markdown, stats, UserError } from './store.mjs';
const groups = [
  { label: '標題、類型、日期與網址正確', value: 'identity' },
  { label: '標籤與摘要已確認（包含留空）', value: 'metadata' },
  { label: '照片、圖說與封面已確認', value: 'images' },
  { label: '內文與修改已看過，同意公開', value: 'content' },
];
export class PublishReview {
  constructor() { this.reviews = new Map(); }
  begin(draft) {
    for (const [key, r] of this.reviews) if (r.expires < Date.now() || r.id === draft.id) this.reviews.delete(key);
    const token = randomUUID().slice(0, 8);
    this.reviews.set(token, { id: draft.id, owner: draft.owner, revision: draft.revision, expires: Date.now() + 600000, approved: false });
    return token;
  }
  get(token, draft, owner) {
    const r = this.reviews.get(token);
    if (!r || r.expires < Date.now() || r.id !== draft.id || r.owner !== owner || r.revision !== draft.revision) throw new UserError('核對表已過期或文章已有修改，請重新按「發布前檢查」。');
    return r;
  }
  approve(token, draft, owner, values) {
    const r = this.get(token, draft, owner);
    if (!groups.every(g => values.includes(g.value))) throw new UserError('請確認全部四項，再進入最後發布步驟。');
    r.approved = true;
  }
  consume(token, draft, owner) {
    const r = this.get(token, draft, owner);
    if (!r.approved) throw new UserError('請先完成發布核對表，再確認發布。');
    this.reviews.delete(token);
  }
  cancel(draft) { for (const [key, r] of this.reviews) if (r.id === draft.id) this.reviews.delete(key); }
  panel(d, checks, siteUrl, token) {
    const meta = matter(markdown(d, 'published')).data;
    const extra = Object.fromEntries(Object.entries(meta).filter(([k, v]) => !['title','date','slug','tags','desc','ogImage','status'].includes(k) && v !== '' && v != null));
    const cover = meta.ogImage || meta.banner || '';
    const fields = [
      { name: '標題', value: d.title },
      { name: '類型與文章日期', value: `${d.kind === 'post' ? 'Blog' : '近況 / Talk'} · ${meta.date}` },
      { name: '公開網址', value: (d.relocation ? null : d.published?.url) || `${siteUrl.replace(/\/$/, '')}/${d.kind === 'post' ? 'blog' : 'talk'}/${d.slug}/` },
      { name: '標籤', value: d.tags.length ? d.tags.join(' · ') : '⚠ 尚未填寫：可以補上，或確認本篇不加標籤。' },
      { name: '摘要', value: d.desc || '⚠ 尚未填寫：Blog 將由網站擷取內文摘要；近況以內文呈現。' },
      { name: '封面／分享預覽圖', value: cover || '未另指定封面／分享圖，使用網站預設呈現。' },
      { name: '照片與圖說', value: `${checks.images} 張引用圖片 · ${d.assets?.length || 0} 張已保存\n${(d.assets || []).slice(0, 5).map((a, n) => `${n + 1}. ${a.alt || '⚠ 無圖說'}`).join('\n') || '沒有新上傳照片。'}${(d.assets?.length || 0) > 5 ? '\n其餘照片請按「照片與封面」查看。' : ''}`.slice(0, 1024) },
      { name: '內文與公開範圍', value: `${stats(d)}\n確認發布後任何人都能透過網站閱讀；未來日期也會立即公開，不代表排程。` },
    ];
    if (d.relocation && d.published) fields.push({ name: '分類搬移', value: `確認發布時會從 ${d.published.url} 搬到上方新網址，並移除舊位置的內容。` });
    if (Object.keys(extra).length) fields.push({ name: '其他保留設定（如關聯文章、橫幅、影片）', value: JSON.stringify(extra, null, 2).slice(0, 1000) });
    if (checks.notes.length) fields.push({ name: '待確認提醒', value: checks.notes.join('\n').slice(0, 1024) });
    return { embeds: [{ title: '發布前逐項核對 · 1 / 2', description: '請先核對下列資料；空白欄位不會替你猜測或自動填入。可先修改／預覽，確認四項後才會出現最後發布按鈕。\n完整修改內容見 diff 附件。', color: 0xf2b84b, fields, footer: { text: `v${d.revision} · 核對有效時間 10 分鐘 · 修改後需重新核對` } }], components: [
      new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`reviewapprove:${d.id}:${d.revision}:${token}`).setPlaceholder('逐項勾選全部四項確認').setMinValues(4).setMaxValues(4).addOptions(groups)),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`reviewedit:${d.id}:${d.revision}`).setLabel('修改文章資料').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`preview:${d.id}:${d.revision}`).setLabel('查看完整預覽').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`photos:${d.id}:${d.revision}:0`).setLabel('照片與封面').setStyle(ButtonStyle.Secondary).setDisabled(!d.assets?.length),
        new ButtonBuilder().setCustomId(`cancel:${d.id}:${d.revision}`).setLabel('暫不發布').setStyle(ButtonStyle.Secondary))] };
  }
}
