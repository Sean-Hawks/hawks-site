import { ActionRowBuilder, StringSelectMenuBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import sharp from 'sharp';
import { markdownParser as marked } from './markdown-renderer.mjs';
import { UserError } from './store.mjs';
const row = component => new ActionRowBuilder().addComponents(component);
const button = (id, label, disabled = false) => new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Secondary).setDisabled(disabled);
export async function photoGallery(d, media, page = 0) {
  const start = page * 6, assets = d.assets.slice(start, start + 6);
  if (!assets.length) throw new UserError('找不到照片，請重新開啟照片面板。');
  const files = await Promise.all(assets.map(async (asset, n) => new AttachmentBuilder(await sharp(media.read(asset)).resize({ width: 360, height: 280, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 75 }).toBuffer(), { name: `photo-${start + n + 1}.jpg` })));
  return {
    embeds: [{ title: `照片排版 · ${start + 1}–${start + assets.length} / ${d.assets.length}`, description: '① 勾選照片（可多選） → ② 選擇放在哪段後面，產生可貼回的全文。\n已在文中的照片會移到新位置，不會重複。每批依照片編號排列。', color: 0x8b9cff }, ...assets.map((asset, n) => ({ title: `照片 ${start + n + 1}${d.cover === asset.url ? ' · 封面' : ''}`, description: asset.alt.slice(0, 100), thumbnail: { url: `attachment://photo-${start + n + 1}.jpg` }, color: 0x8b9cff }))], files,
    components: [row(new StringSelectMenuBuilder().setCustomId(`photoselect:${d.id}:${d.revision}`).setPlaceholder('勾選這批要插入的照片').setMinValues(1).setMaxValues(assets.length).addOptions(assets.map((a, n) => ({ label: `照片 ${start + n + 1} · ${a.alt}`.slice(0, 100), value: String(start + n) })))),
      new ActionRowBuilder().addComponents(button(`photopage:${d.id}:${d.revision}:${page - 1}`, '上一批', page === 0), button(`photopage:${d.id}:${d.revision}:${page + 1}`, '下一批', start + 6 >= d.assets.length), button(`photoall:${d.id}:${d.revision}:${page}`, '插入這一批全部')),
      row(new StringSelectMenuBuilder().setCustomId(`photocover:${d.id}:${d.revision}:${page}`).setPlaceholder('設定封面（不影響內文位置）').addOptions(assets.map((a, n) => ({ label: `照片 ${start + n + 1} · ${a.alt}`.slice(0, 100), value: String(start + n) }))))]
  };
}
export function placementOptions(d, indices) {
  if (!indices.length || indices.length > 6 || new Set(indices).size !== indices.length || indices.some(n => !Number.isInteger(n) || !d.assets[n])) throw new UserError('照片選擇已失效，請重新選擇。');
  const assets = indices.map(n => d.assets[n]);
  const urls = new Set(assets.map(a => a.url));
  // Only remove actual Markdown image tokens, leaving code examples untouched.
  const tokens = marked.lexer(d.body);
  function clean(token) {
    if (token.type === 'image' && urls.has(token.href)) return '';
    const children = token.tokens || token.items;
    if (children) {
      let raw = token.raw, cursor = 0;
      for (const child of children) {
        const at = raw.indexOf(child.raw, cursor);
        if (at < 0) continue;
        const replacement = clean(child);
        raw = raw.slice(0, at) + replacement + raw.slice(at + child.raw.length);
        cursor = at + replacement.length;
      }
      return raw;
    }
    return token.raw;
  }
  let body = '', cursor = 0;
  for (const token of tokens) {
    const at = d.body.indexOf(token.raw, cursor);
    if (at < 0) throw new UserError('這篇文章的 Markdown 格式暫時無法自動排圖，草稿未修改。');
    body += d.body.slice(cursor, at) + clean(token);
    cursor = at + token.raw.length;
  }
  body += d.body.slice(cursor);
  const options = [{ label: '放在文章最前面', value: '0' }];
  let offset = 0, number = 0;
  for (const token of marked.lexer(body)) {
    const at = body.indexOf(token.raw, offset);
    if (at < 0) throw new UserError('無法確認段落位置，草稿未修改。');
    offset = at + token.raw.length;
    if (token.type === 'space' || !token.raw.trim()) continue;
    options.push({ label: `放在第 ${++number} 段後面`, description: token.raw.replace(/\s+/g, ' ').slice(0, 90), value: String(offset) });
  }
  return { body, assets, options };
}
export function placementPanel(d, indices, page = 0) {
  indices = [...indices].sort((a, b) => a - b);
  const { options } = placementOptions(d, indices), key = indices.join(','), start = page * 25;
  if (!options.slice(start, start + 25).length) throw new UserError('找不到段落。');
  return { embeds: [{ title: `插入照片 ${indices.map(n => n + 1).join('、')}`, description: '選擇位置後會產生排版全文，請依指引複製貼回。選單附有段落開頭供你辨認。\n貼回後照片會移到指定位置，文章文字保留；尚不會發布。', color: 0x8b9cff }], attachments: [], components: [row(new StringSelectMenuBuilder().setCustomId(`photoplace:${d.id}:${d.revision}:${key}`).setPlaceholder('放在哪一段後面？').addOptions(options.slice(start, start + 25))), new ActionRowBuilder().addComponents(button(`phototarget:${d.id}:${d.revision}:${key}:${page - 1}`, '前面的段落', page === 0), button(`phototarget:${d.id}:${d.revision}:${key}:${page + 1}`, '後面的段落', start + 25 >= options.length), button(`photopage:${d.id}:${d.revision}:0`, '重新選照片'))] };
}
export function placePhotos(d, indices, offset) {
  const { body, assets, options } = placementOptions(d, indices);
  if (!options.some(option => option.value === String(offset))) throw new UserError('插入位置已失效，請重新選擇。');
  const images = assets.map(a => `![${a.alt.replace(/[\[\]\\\n]/g, ' ')}](${a.url})`).join('\n\n');
  return [body.slice(0, offset).trimEnd(), images, body.slice(offset).trimStart()].filter(Boolean).join('\n\n');
}
