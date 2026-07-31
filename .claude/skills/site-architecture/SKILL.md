---
name: site-architecture
description: >
  Reference for hawks-site's overall code architecture, page layout, and how it compares
  to emtech.cc (毛哥EM). Use when working on site-wide structure, adding pages/features,
  refactoring the article page layout, deployment, or deciding whether to adopt something
  emtech does (comments, code-copy, reading time, Astro-style perf). Grounded in the real
  hawks-site codebase (Next.js 15 App Router) vs emtech's Astro monorepo.
---

# Hawks Site：架構、頁面排版對照（Code 篇）

把 **hawks-site（你）** 的整體程式架構與頁面排版，對照你欣賞的 **emtech.cc（毛哥EM）**。
重點：你的架構其實已經很完整，**不需要打掉重練**。這份只標出「差在哪、哪些值得借、哪些別學」。

---

## TL;DR

- **你** = Next.js 15 靜態單體：component-driven、純前端、static export 到 GitHub Pages（`hawks.tw`）。
- **毛哥** = Astro monorepo + Cloudflare 後端：islands 架構、自建留言系統（Worker + D1 + OAuth + CAPTCHA + `/admin`）。
- 你贏在**輕量、好維護、SEO 完整**；毛哥贏在**互動性（留言）與閱讀體驗細節**。

---

## 框架與部署對照

| 面向 | 你（hawks-site） | 毛哥（emtech） |
|---|---|---|
| 框架 | Next.js 15 App Router + React 19 | Astro（islands） |
| 專案結構 | 單一 app | pnpm workspace monorepo（`apps/blog`, `apps/comments-worker`, `packages/*`） |
| 後端 | 無，純靜態 | Cloudflare Worker + D1 資料庫 |
| 部署 | GitHub Pages（`force-static` 靜態輸出） | Cloudflare（blog + worker） |
| 前端 JS 量 | React 全站 hydrate，JS 較多 | Astro 預設幾乎 0 JS，只有 island 才載 |
| 樣式 | Tailwind 4 + CSS 變數，dark-first、Discord 風漸層＋格線背景 | 偏文件/閱讀導向主題 |

**觀念差異**：Astro 對「內容型部落格」天生較省 JS；Next 靜態輸出仍會 hydrate。
但你已經是 static export，差距對讀者其實有限——**不值得為此換框架**。

---

## 頁面 / 路由對照

- **你**：`/`、`/blog`、`/blog/[slug]`、`/blog/tag/[tag]`、`/talk`、`/talk/[slug]`、
  `/library/[category]/[slug]`、`/project`、`/search`、`/now`、`/contact`、`/subscribe`、
  `/rss.xml`、`sitemap.ts`、`robots.ts`、`manifest.ts`（PWA）。
- **毛哥**：`/p/<slug>`（扁平短網址、好分享）＋ `/course/<track>/<lesson>`（結構化課程）。

**可借鏡**：
1. **更短的文章網址**。你現在是 `/blog/<slug>`，毛哥用 `/p/<slug>`——短、好記、好貼。
   若在意連結美感，可考慮加一層 `/p/` route 或縮短。（非必要，權衡 SEO 既有連結）
2. **「系列 / 課程」的層級**。你之後若有多篇成套的內容（例如資安筆記、演算法系列），
   可仿 `/course/<track>/` 做一個 series 分類，比純 tag 更有導覽感。

---

## 文章頁排版功能對照（重點）

| 功能 | 你有嗎 | 毛哥 | 備註 |
|---|---|---|---|
| 目錄 TOC | ✅ 有（`buildToc` + 左側 `aside`，`blog/[slug]/page.tsx`） | ✅ | 你已經做了，讚 |
| Admonition / callout | ✅ 有（`remarkAdmonitions` + `.admonition` CSS，支援 note/info/warning/danger/success/tip） | ✅ blockquote 定義 | 你的更完整 |
| 相關內容連結 | ✅ 有（related talks） | ✅ | 對等 |
| 完整 SEO / OG | ✅ 很強（per-post OG 圖、sitemap、robots、RSS、twitter card、PWA manifest） | ✅ | **你這塊贏面大** |
| **閱讀時間** | ✅ 已有（`blog/[slug]/page.tsx` 的 `readingMinutes` → 顯示 min read） | ✅ | 本來就有 |
| **程式碼 copy 按鈕** | ✅ 已實作（`CopyButton.tsx` + `MarkdownContent.tsx` 的 pre，含 execCommand fallback） | ✅ | 2026-07 大改補上 |
| **留言系統** | ⚙️ 已接 Giscus（`Comments.tsx` + `lib/comments-config.ts`），填 repoId/categoryId 才顯示 | ✅ 自建（Worker+D1+OAuth+Turnstile+admin） | 用 Giscus，不自建後端 |

---

## 值得借鏡（進度）

1. ✅ **程式碼 copy 按鈕**（2026-07 完成）
   `app/components/CopyButton.tsx`（`"use client"`）+ `MarkdownContent.tsx` 的 pre 包一層
   `group relative` 容器，hover 顯示、含 `execCommand` fallback。

2. ✅ **閱讀時間**——原本就有（`blog/[slug]/page.tsx` 的 `readingMinutes`）。

3. ⚙️ **留言：Giscus 已接好，等設定**（2026-07 完成元件）
   `app/components/Comments.tsx` + `app/lib/comments-config.ts`。**啟用只差填兩個值**：
   到 GitHub repo 開 Discussions → 裝 giscus app → 上 giscus.app 拿 `repoId` / `categoryId`
   → 填進 `comments-config.ts`。未填時留言區安全隱藏（不會顯示破圖）。
   刻意不學毛哥自建 Worker+D1+OAuth+CAPTCHA——那是重造大輪子。

4. **更短的分享網址**（可選，尚未做）
   若想要 `/p/<slug>` 那種簡潔感，評估對既有 `/blog/<slug>` 連結與 SEO 的影響再決定。

---

## 不建議照抄（避免過度工程）

- ❌ **不要為了 Astro 換框架**。你已經 static export，收益不抵重寫成本。
- ❌ **不要自建留言後端**（Worker+D1+OAuth+CAPTCHA）。維護負擔大，Giscus 就夠。
- ❌ **不要盲目 monorepo 化**。你目前單體剛好，沒有第二個 app 就不需要 pnpm workspace。

---

## 順手該修的（在你自己 repo 看到的）

- ~~兩個 deploy workflow 衝突~~ → **其實已處理**：`nextjs.yml` 只剩 `workflow_dispatch`
  （手動 fallback），註解也寫明 active 是 `deploy.yml`，不會同時觸發。可留著不動。
- **把 `page.tsx` 開頭那串 `// NOTE:` 移進 `docs/`**（尚未做）：build 眉角（Next 15 params 是
  Promise、GitHub Pages 自訂網域流程）寫在 `DEPLOYMENT.md` 比塞在頁面檔頭更好維護。

---

## 一句話總結

> 架構上你不缺料——**SEO、TOC、callout、閱讀時間、主題系統都到位**。
> 2026-07 大改補上 **code copy 按鈕**、接好 **Giscus 留言**（只差填 repoId/categoryId）。
> 剩下唯一待啟用的動作在你手上：開 GitHub Discussions、上 giscus.app 拿兩個 ID。
> 別學毛哥自建後端、也別為 Astro 重寫。
