import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const root = process.cwd();
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

function short(value = "", length = 92) {
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
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
      if (buf) tokens.push(buf), (buf = "");
      tokens.push(" ");
    } else if (isCjk(ch)) {
      if (buf) tokens.push(buf), (buf = "");
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

function textLines(lines, { x, y, step }) {
  return lines
    .map(
      (line, i) =>
        `<tspan x="${x}" dy="${i === 0 ? 0 : step}">${escapeHtml(line)}</tspan>`,
    )
    .join("");
}

function cardSvg({ eyebrow, title, desc, date }) {
  const titleTspans = textLines(wrapLines(title, 13, 2), { x: 132, y: 250, step: 72 });
  const descTspans = textLines(wrapLines(desc, 26, 2), { x: 132, y: 410, step: 40 });
  return `
  <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#0f1014"/>
    <circle cx="210" cy="78" r="260" fill="#a78bfa" opacity="0.16"/>
    <circle cx="1020" cy="120" r="260" fill="#fbbf24" opacity="0.14"/>
    <path d="M0 472C188 430 325 470 494 431C670 391 820 328 1200 374V630H0V472Z" fill="#181a20"/>
    <g opacity="0.11">
      <path d="M0 110H1200M0 190H1200M0 270H1200M0 350H1200M0 430H1200M0 510H1200" stroke="white"/>
      <path d="M120 0V630M240 0V630M360 0V630M480 0V630M600 0V630M720 0V630M840 0V630M960 0V630M1080 0V630" stroke="white"/>
    </g>
    <rect x="88" y="82" width="1024" height="466" rx="34" fill="#181a20" fill-opacity="0.88" stroke="white" stroke-opacity="0.10"/>
    <text x="132" y="154" fill="#fbbf24" font-family="${FONT}" font-size="25" font-weight="800" letter-spacing="5">${escapeHtml(eyebrow)}</text>
    <text x="132" y="250" fill="#e8e4dc" font-family="${FONT}" font-size="58" font-weight="850">${titleTspans}</text>
    <text x="132" y="410" fill="#b2aca4" font-family="${FONT}" font-size="28" font-weight="500">${descTspans}</text>
    <text x="132" y="505" fill="#b2aca4" font-family="${FONT}" font-size="24">${escapeHtml(formatDate(date))}</text>
    <text x="930" y="505" fill="#e8e4dc" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="800">hawks.tw</text>
  </svg>`;
}

async function renderPng(fileName, data) {
  const svg = cardSvg(data);
  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, fileName));
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
  });
}

for (const { file, data } of readMarkdownFiles(talksDir)) {
  const id = file.replace(/\.md$/, "");
  await renderPng(`talk-${id}.png`, {
    eyebrow: "TALK ARCHIVE",
    title: data.title || id,
    desc: data.event || "分享、演講與近況紀錄。",
    date: data.date || "",
  });
}

console.log(`Generated OG images in ${path.relative(root, outDir)}`);
