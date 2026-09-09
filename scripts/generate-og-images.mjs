import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");
const outDir = path.join(root, "public/og");
const postsDir = path.join(root, "content/posts");
const talksDir = path.join(root, "content/talks");

function slugify(value) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "post";
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// librsvg (used by sharp) does NOT render <foreignObject>, so title/desc are
// drawn with native <text>/<tspan>. That means we wrap the text ourselves.
const isCjk = (ch) =>
  /[⺀-鿿　-〿＀-￯가-힯]/.test(ch);

// Split into tokens: each CJK char stands alone, Latin runs stay whole, spaces
// kept — so Latin words never break mid-word while CJK can wrap anywhere.
function tokenize(text) {
  const s = String(text).replace(/\s+/g, " ").trim();
  const tokens = [];
  let buf = "";
  for (const ch of s) {
    if (ch === " ") {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
      tokens.push(" ");
    } else if (isCjk(ch)) {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
      tokens.push(ch);
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

// Approximate width in em units (CJK ≈ 1, Latin char ≈ 0.55, space ≈ 0.35).
const tokenWidth = (t) => (t === " " ? 0.35 : isCjk(t) ? 1 : t.length * 0.55);

function wrapLines(text, maxUnits, maxLines) {
  const tokens = tokenize(text);
  const lines = [];
  let line = "";
  let units = 0;
  let truncated = false;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === " " && !line) continue; // no leading spaces
    const w = tokenWidth(t);
    if (units + w > maxUnits && line.trim()) {
      lines.push(line.trim());
      line = "";
      units = 0;
      if (lines.length === maxLines) {
        truncated = tokens.slice(i).some((x) => x !== " ");
        break;
      }
    }
    line += t;
    units += w;
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trim());
  if (truncated && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/\s+$/, "") + "…";
  }
  return lines;
}

function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// PingFang TC = macOS local dev; Noto Sans CJK TC = the family shipped by
// `fonts-noto-cjk`, installed on the CI runner (see .github/workflows).
const FONT = "PingFang TC, Noto Sans TC, Noto Sans CJK TC, Inter, Arial, sans-serif";

function textLines(lines, { x, step }) {
  return lines
    .map(
      (line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : step}">${escapeHtml(line)}</tspan>`,
    )
    .join("");
}

// Embed the local avatar so generated cards never depend on remote assets.
const avatar = await sharp(path.join(publicDir, "avatar.jpg"))
  .rotate()
  .resize(240, 240, { fit: "cover" })
  .png()
  .toBuffer();
const avatarUri = `data:image/png;base64,${avatar.toString("base64")}`;

function cardSvg({ eyebrow, title, desc, date, hasBanner = false }) {
  const titleSize = [52, 48, 44].find((size) =>
    !wrapLines(title, 700 / size, 3).at(-1)?.endsWith("…"),
  ) || 44;
  const titleLines = wrapLines(title, 700 / titleSize, 3);
  const titleTspans = textLines(titleLines, { x: 390, step: titleSize * 1.35 });
  const descY = 236 + (titleLines.length - 1) * titleSize * 1.35 + 58;
  const descTspans = textLines(wrapLines(desc, 26, 1), { x: 390, step: 36 });
  return `
  <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
        <stop stop-color="#252333"/><stop offset="1" stop-color="#101216"/>
      </linearGradient>
      <linearGradient id="accent" x1="64" y1="0" x2="1136" y2="0" gradientUnits="userSpaceOnUse">
        <stop stop-color="#a78bfa"/><stop offset="1" stop-color="#fbbf24"/>
      </linearGradient>
      <clipPath id="avatar"><circle cx="206" cy="256" r="100"/></clipPath>
    </defs>
    <rect width="1200" height="630" fill="url(#base)" fill-opacity="${hasBanner ? '0.18' : '1'}"/>
    <circle cx="60" cy="40" r="310" fill="#a78bfa" opacity="0.06"/>
    <circle cx="1160" cy="620" r="270" fill="#fbbf24" opacity="0.04"/>
    <rect x="48" y="48" width="1104" height="534" rx="28" fill="#181a20" fill-opacity="${hasBanner ? '0.68' : '0.90'}" stroke="#383640"/>
    <rect x="76" y="48" width="1048" height="3" rx="1.5" fill="url(#accent)"/>
    <path d="M344 112V518" stroke="#383640"/>
    <circle cx="206" cy="256" r="108" stroke="#a78bfa" stroke-opacity="0.45" stroke-width="2"/>
    <image x="106" y="156" width="200" height="200" href="${avatarUri}" clip-path="url(#avatar)"/>
    <!-- Match the homepage .header-wordmark: heavy type, outlined .TW, offset accent shadow. -->
    <g font-family="Inter, Arial, sans-serif" font-size="36" font-weight="950" letter-spacing="-2.7">
      <text x="206" y="410" text-anchor="middle" fill="#fbbf24" fill-opacity="0.18" transform="translate(3.24 2.16)">HAWKS<tspan dx="2.88" font-size="33.84">.TW</tspan></text>
      <text x="206" y="410" text-anchor="middle" fill="#f2eee7">HAWKS<tspan dx="2.88" font-size="33.84" fill="none" stroke="#f2eee7" stroke-opacity="0.76" stroke-width="1">.TW</tspan></text>
    </g>
    <text x="206" y="447" text-anchor="middle" fill="#b7aecb" font-family="${FONT}" font-size="22">記錄・分享・探索</text>
    <rect x="390" y="108" width="${eyebrow.length * 15 + 34}" height="42" rx="10" fill="#fbbf24" fill-opacity="0.10"/>
    <text x="407" y="137" fill="#fbbf24" font-family="${FONT}" font-size="21" font-weight="700" letter-spacing="2">${escapeHtml(eyebrow)}</text>
    <text x="390" y="236" fill="#f2eee7" font-family="${FONT}" font-size="${titleSize}" font-weight="800">${titleTspans}</text>
    <text x="390" y="${descY}" fill="#b5b0bb" font-family="${FONT}" font-size="26">${descTspans}</text>
    <path d="M390 480H1096" stroke="#383640"/>
    <text x="390" y="522" fill="#b5b0bb" font-family="${FONT}" font-size="23">${escapeHtml(formatDate(date))}</text>
    <path d="M1060 513H1090M1080 503L1090 513L1080 523" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function resolveBannerPath(value) {
  if (typeof value !== "string") return null;

  let banner = value.trim();
  const wikiLink = banner.match(/^\[\[(.*?)(?:\|.*?)?\]\]$/);
  if (wikiLink) banner = wikiLink[1];
  if (!banner || /^https?:\/\//.test(banner)) return null;

  const relativePath = banner.startsWith("/")
    ? banner.slice(1)
    : banner.startsWith("images/")
      ? banner
      : path.join("images", banner);
  const resolved = path.resolve(publicDir, relativePath);
  if (!resolved.startsWith(`${publicDir}${path.sep}`) || !fs.existsSync(resolved)) return null;
  return resolved;
}

async function renderPng(fileName, data) {
  // Use the homepage banner when an article has no usable local banner.
  const bannerPath = resolveBannerPath(data.banner) || resolveBannerPath("/banner.jpg");
  const svg = cardSvg({ ...data, hasBanner: Boolean(bannerPath) });
  const outputPath = path.join(outDir, fileName);

  if (!bannerPath) {
    await sharp(Buffer.from(svg)).png().toFile(outputPath);
    return;
  }

  const background = await sharp(bannerPath)
    .rotate()
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();

  await sharp(background)
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toFile(outputPath);
}

function readMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(dir, file);
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      return { file, data };
    });
}

fs.mkdirSync(outDir, { recursive: true });

await renderPng("default.png", {
  eyebrow: "HAWKS.TW",
  title: "Hawks",
  desc: "個人網站、Blog、Talk archive 和一些正在做的東西。",
  date: "Blog / Now / Projects",
});

for (const { file, data } of readMarkdownFiles(postsDir)) {
  const slug = slugify(data.slug || file.replace(/\.md$/, ""));
  await renderPng(`blog-${slug}.png`, {
    eyebrow: "BLOG",
    title: data.title || slug,
    desc: data.desc || "Hawks Blog",
    date: data.date || "",
    banner: data.banner,
  });
}

for (const { file, data } of readMarkdownFiles(talksDir)) {
  const id = file.replace(/\.md$/, "");
  await renderPng(`talk-${id}.png`, {
    eyebrow: "TALK ARCHIVE",
    title: data.title || id,
    desc: data.event || "分享、演講與近況紀錄。",
    date: data.date || "",
    banner: data.banner,
  });
}

console.log(`Generated OG images in ${path.relative(root, outDir)}`);
