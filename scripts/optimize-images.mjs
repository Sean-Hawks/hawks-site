// Build responsive assets for GitHub Pages; keep originals for downloads/fallbacks.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');
const outDir = path.join(publicDir, '_img');
const widths = [240, 480, 960, 1600, 2000];
const sourceExt = /\.(?:jpe?g|png|webp)$/i;
const signature = createHash('sha256').update(await fs.readFile(new URL(import.meta.url))).digest('hex');
let previous = {};
try { previous = JSON.parse(await fs.readFile(path.join(outDir, 'manifest.json'), 'utf8')); } catch { /* first build */ }

async function filesIn(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(full));
    else if (entry.isFile() && sourceExt.test(entry.name)) files.push(full);
  }
  return files;
}
async function statOrNull(file) { try { return await fs.stat(file); } catch { return null; } }
const sources = await filesIn(path.join(publicDir, 'images'));
for (const name of ['avatar.jpg', 'banner.jpg']) {
  const file = path.join(publicDir, name);
  if (await statOrNull(file)) sources.push(file);
}
const images = {};
let generated = 0;
let skipped = 0;
const failures = [];
const queue = [...sources];
async function optimize(file) {
  const relative = path.relative(publicDir, file).split(path.sep).join('/');
  const metadata = await sharp(file).metadata();
  // Do not flatten animation. The manifest makes the loader use the original.
  if ((metadata.pages ?? 1) > 1) { skipped += 1; return; }
  const originalWidth = (metadata.orientation ?? 1) >= 5 ? metadata.height : metadata.width;
  if (!originalWidth) throw new Error('Image width is unavailable');
  const available = [...new Set(widths.map(width => Math.min(width, originalWidth)))];
  const source = await fs.stat(file);
  const targetDir = path.join(outDir, relative);
  await fs.mkdir(targetDir, { recursive: true });
  let changed = false;
  for (const width of available) {
    const target = path.join(targetDir, `${width}.webp`);
    const stat = await statOrNull(target);
    if (previous.signature === signature && stat && stat.mtimeMs >= source.mtimeMs) continue;
    await sharp(file).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78, effort: 4 }).toFile(target);
    changed = true;
  }
  images[`/${relative}`] = available;
  if (changed) generated += 1;
}
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const file = queue.shift();
    try { await optimize(file); } catch (error) { failures.push(`${path.relative(publicDir, file)}: ${error.message}`); }
  }
}));
if (failures.length) throw new Error(`Image optimization failed:\n${failures.join('\n')}`);
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, 'manifest.json.tmp'), JSON.stringify({ signature, images }));
await fs.rename(path.join(outDir, 'manifest.json.tmp'), path.join(outDir, 'manifest.json'));
// Only generated directories recorded in the old manifest are pruned.
for (const source of Object.keys(previous.images ?? {})) {
  if (images[source]) continue;
  const target = path.resolve(outDir, `.${source}`);
  if (target.startsWith(`${outDir}${path.sep}`)) await fs.rm(target, { recursive: true, force: true });
}
console.log(`Optimized ${Object.keys(images).length} images; ${generated} regenerated; ${skipped} animated images use originals.`);
