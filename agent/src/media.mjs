import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { UserError } from './store.mjs';
export class MediaStore {
  constructor(dir, fetcher = fetch) {
    this.dir = path.join(dir, 'media'); this.fetcher = fetcher;
    fs.mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    this.indexFile = path.join(this.dir, 'index.json');
    this.index = fs.existsSync(this.indexFile) ? JSON.parse(fs.readFileSync(this.indexFile, 'utf8')) : {};
  }
  file(asset) {
    if (!/^[a-f0-9]{64}$/.test(asset.hash)) throw new UserError('圖片識別碼不正確。');
    return path.join(this.dir, `${asset.hash}.webp`);
  }
  async ingest(attachment) {
    const cached = this.index[attachment.id];
    if (cached && fs.existsSync(this.file(cached))) return cached;
    const url = new URL(attachment.url);
    if (url.protocol !== 'https:' || !['cdn.discordapp.com', 'media.discordapp.net'].includes(url.hostname)) throw new UserError('只接受直接上傳 Discord 的圖片附件。');
    if (attachment.size > 20 * 1024 * 1024) throw new UserError('每張照片上限 20 MB，請先縮小圖片。');
    const response = await this.fetcher(url, { signal: AbortSignal.timeout(30000), redirect: 'error' });
    if (!response.ok) throw new UserError('照片下載失敗，請重新上傳。');
    const reader = response.body.getReader(); const chunks = []; let size = 0;
    try {
      while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length;
        if (size > 20 * 1024 * 1024) throw new UserError('照片超過 20 MB 上限。'); chunks.push(value); }
    } finally { await reader.cancel(); }
    let result;
    try {
      const input = Buffer.concat(chunks);
      const metadata = await sharp(input, { limitInputPixels: 40000000 }).metadata();
      if (!['jpeg', 'png', 'webp', 'avif', 'heif'].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error('format');
      result = await sharp(input, { limitInputPixels: 40000000 }).rotate().resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    } catch { throw new UserError('圖片無法處理；請使用靜態 JPEG、PNG、WebP 或 AVIF（最多 4,000 萬畫素）。'); }
    const hash = createHash('sha256').update(result.data).digest('hex');
    const asset = { hash, url: `/images/blog/${hash}.webp`, width: result.info.width, height: result.info.height, bytes: result.data.length };
    fs.writeFileSync(this.file(asset), result.data, { mode: 0o600 });
    this.index[attachment.id] = asset;
    fs.writeFileSync(`${this.indexFile}.tmp`, JSON.stringify(this.index), { mode: 0o600 }); fs.renameSync(`${this.indexFile}.tmp`, this.indexFile);
    return asset;
  }
  read(asset) { try { return fs.readFileSync(this.file(asset)); } catch { throw new UserError('草稿照片缺少本機檔案，請重新上傳或還原 .data/media 備份。'); } }
  async renderMessage(message, { placedUrls = new Set() } = {}) {
    const images = [...(message.attachments?.values() || [])];
    if (images.length > 10) throw new UserError('一則訊息最多處理 10 張照片。');
    const caption = (message.content || '').split('\n').find(l => /^圖說[:：]/.test(l))?.replace(/^圖說[:：]\s*/, '').slice(0, 300) || '';
    const text = images.length ? (message.content || '').split('\n').filter(l => !/^圖說[:：]/.test(l)).join('\n') : (message.content || '');
    const assets = [];
    for (const attachment of images) {
      const asset = await this.ingest(attachment);
      assets.push({ ...asset, alt: attachment.description || caption || attachment.name?.replace(/\.[^.]+$/, '') || '文章照片' });
    }
    const used = new Set();
    const imageMarkdown = a => `![${a.alt.replace(/[\[\]\\\n]/g, ' ')}](${a.url})`;
    const placed = text.replace(/^[ \t]*\[\[圖(\d+)\]\][ \t]*$/gm, (_match, number) => {
      const index = Number(number) - 1;
      if (!assets[index]) throw new UserError(`找不到這則訊息的第 ${number} 張照片。請把照片附在同一則訊息，或從「照片與封面」複製插圖語法。`);
      used.add(index); return imageMarkdown(assets[index]);
    });
    return { text: [placed, ...assets.filter((a, index) => !used.has(index) && !placedUrls.has(a.url) && !text.includes(a.url)).map(imageMarkdown)].filter(Boolean).join('\n\n'), assets };
  }
}
