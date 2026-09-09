# hawks.tw — Hawks 的個人網站

[hawks.tw](https://hawks.tw/) 是我記錄學習與生活的地方。這裡有程式開發、機器學習與資安的學習筆記，參與營隊、競賽和社群活動的心得，也有管樂生活，以及喜歡的動畫、電影、音樂與遊戲。

這個儲存庫包含網站原始碼、Markdown 文章與作品收藏。內容可以用一般文字編輯器或 Obsidian 維護；網站以 Next.js 建置成靜態檔，再透過 GitHub Actions 發布到 GitHub Pages。

## 網站裡有什麼

| 入口 | 內容 |
| --- | --- |
| [首頁](https://hawks.tw/) | 個人簡介、最新文章與短筆記、精選作品和近期經歷。 |
| [Blog](https://hawks.tw/blog/) | 學習筆記、活動心得與生活紀錄，同時收錄長文和短近況。 |
| [Talk](https://hawks.tw/talk/) | 獨立的短筆記與分享紀錄入口；內容也會出現在 Blog。 |
| [Library](https://hawks.tw/library/) | 動畫、電影、音樂人與遊戲收藏，包含個人評分、心得及推薦作品。 |
| [Project](https://hawks.tw/project/) | 程式作品與個人專案。 |
| [Timeline](https://hawks.tw/timeline/) | 學習、社團、活動與競賽經歷。 |
| [Search](https://hawks.tw/search/) | 搜尋文章、短筆記與收藏，或透過標籤找相關內容。 |
| [訂閱](https://hawks.tw/subscribe/) | 透過 [RSS](https://hawks.tw/rss.xml) 追蹤文章、短筆記與作品評論。 |
| [聯絡](https://hawks.tw/contact/) | 聯絡方式與社群入口。 |

舊的 `/now/` 入口目前會導向 Blog，近況不需要另外維護一份。網站支援淺色與深色佈景，首次瀏覽預設使用淺色。

## 在本機開啟網站

使用 Node.js 20 與 npm，與目前部署流程一致。在專案根目錄執行：

```bash
npm install
npm run dev
```

接著開啟 [http://localhost:3000](http://localhost:3000)。

### 常用指令

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 啟動本機開發伺服器，修改內容後可預覽結果。 |
| `npm run now` | 依台北日期，在 `content/talks/` 建立一篇短筆記草稿。 |
| `npm run now -- "今天想記下的內容"` | 建立已標記為 `published` 的短筆記；仍需提交與部署才會更新線上網站。 |
| `npm run lint` | 檢查程式碼；建置流程本身不會執行 ESLint。 |
| `npm run og` | 單獨產生網站、Blog 與 Talk 的分享預覽圖片，輸出至 `public/og/`。 |
| `npm run build` | 自動產生分享圖片、建置網站，並將可部署的靜態檔輸出至 `out/`。 |

本專案使用靜態匯出。日常預覽使用 `npm run dev`；`package.json` 中的 `npm run start` 執行的是 `next start`，不適用於這份靜態輸出。

## 新增與更新內容

Markdown 檔案開頭的 `---` 區塊是 frontmatter，用來設定標題、日期、網址與發布狀態；區塊下方則是正文。現成範本放在 [`content/templates/`](content/templates/)。

### Blog：長文與心得

在 `content/posts/` 新增 `.md` 檔案，可從 [`post-template.md`](content/templates/post-template.md) 複製，或使用以下格式：

```markdown
---
title: "我的學習筆記"
date: "2026-09-09"
desc: "整理這次學到的方法、遇到的問題，以及下一步想做的事。"
slug: "my-learning-notes"
tags:
  - "#notes"
  - "#web"
status: draft
---

從這裡開始寫正文。
```

- `desc` 是列表與分享時使用的摘要，建議用一兩句話說明重點。
- `slug` 決定網址，例如 `/blog/my-learning-notes/`。省略時會由檔名轉換；中文檔名建議明確填寫不重複的英文 `slug`，發布後保持固定。
- `tags` 用於搜尋與標籤索引，可依文章主題填寫。
- 寫完後將 `status: draft` 改成 `status: published`。

### Talk：短近況與隨手記

在 `content/talks/` 新增 `.md`，或執行 `npm run now` 建立草稿：

```markdown
---
title: "今天的小進展"
date: "2026-09-09"
status: draft
---

記下今天做了什麼、想到什麼，或想分享的連結。
```

Talk 使用檔名作為網址識別，例如 `2026-09-09.md` 對應 `/talk/2026-09-09/`。也可以使用 [`talk-template.md`](content/templates/talk-template.md) 補上活動名稱、封面、投影片或影片。

Blog 可透過 `relatedTalks` 指定相關 Talk 的檔名（不含 `.md`）；Talk 可透過 `relatedPosts` 指定 Blog 的 `slug`。未指定時，網站會依內容比對相關文章。

### Library：收藏、評分與評論

複製 [`library-template.md`](content/templates/library-template.md) 到 `content/library/`，填寫作品資訊：

```yaml
---
title: "作品名稱"
category: anime
status: watched
rating: 8.5
note: "一句話說明喜歡這部作品的原因。"
featured: false
image:
  src: "/images/library/example.jpg"
  alt: "作品封面"
statusVisibility: draft
---
```

- `category` 支援 `anime`、`movie`、`artist`、`game`。
- `status` 表示觀看或遊玩狀態：`watched`、`listened`、`watching`、`playing`、`played`、`planned`、`recommended`。
- **Library 的公開狀態使用 `statusVisibility`**，準備好後改成 `published`；它與觀看狀態 `status` 是不同欄位。
- `rating` 是個人評分，推薦等級由分數推導：9.5 起為 Brilliant、9.0 起為 Favorite、8.5 起為 Recommended，其餘為 Casual。
- `featured: true` 將作品加入精選候選，`featuredOrder` 可指定排列順序。
- 正文可寫完整評論；音樂人也可透過 `recommendations` 列出推薦歌曲或作品，支援純標題或含 `title`、`image`、`link`、`source`、`note` 的物件。
- 有評論或推薦作品時，才會提供 `/library/<category>/<slug>/` 詳細頁；只有基本資料的收藏顯示在分類列表。

### 圖片與公開範圍

圖片放在 `public/images/`，文章內使用 `/images/檔名` 引用；作品封面集中在 `public/images/library/`。也支援 Obsidian 的 `![[圖片檔名.jpg]]` 寫法。

Blog 與 Talk 的 `status: draft`、`status: private`，以及 Library 的對應 `statusVisibility` 值，會讓內容排除於公開頁面。**省略公開狀態的內容會視為公開**。這些欄位只控制網站顯示，不會隱藏 Git 儲存庫中的原始檔；`public/` 下的檔案也會隨網站發布。

## 寫作方式

- **直接編輯 Markdown**：修改 `content/` 下的檔案，在本機預覽後提交。
- **Obsidian**：使用草稿、Daily Notes 與範本整理內容。資料夾與設定方式見 [Obsidian 寫作流程](docs/OBSIDIAN_WORKFLOW.md)。

## 專案結構與技術

```text
app/
  components/    首頁、導覽與共用介面
  data/          個人經歷、專案與其他靜態資料
  lib/           Markdown 讀取、搜尋與相關內容邏輯
  blog/          文章與近況列表、文章詳細頁、標籤頁
  talk/          短筆記列表與詳細頁
  library/       作品收藏分類與評論頁
  project/       專案列表
  timeline/      經歷時間軸
  search/        全站搜尋
  rss.xml/       RSS 訂閱內容
content/
  posts/         Blog 原稿
  talks/         Talk 原稿
  library/       收藏資訊與評論
  templates/     Markdown 與 Obsidian 範本
public/          隨網站發布的圖片、分享預覽圖與其他靜態檔
scripts/         建立短筆記、產生分享圖片與建置後處理
docs/            寫作與網域設定說明
.github/workflows/  GitHub Actions 部署流程
```

網站使用 Next.js 15 App Router、React 19、TypeScript 與 Tailwind CSS 4。Markdown 由 `gray-matter`、`react-markdown`、`remark-gfm` 和 `remark-directive` 等套件處理。所有公開內容在建置時產生，不依賴執行中的 Next.js 伺服器。

## 檢查與部署

發布前在專案根目錄執行：

```bash
npm run lint
npm run build
```

`build` 已包含分享圖片產生步驟，不需要再另外執行 `npm run og`。確認結果後提交需要發布的變更並推送至 `main`，由 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 建置 `out/` 並部署至 GitHub Pages。另一份 `nextjs.yml` 僅保留為手動備援。

- [部署指南](DEPLOYMENT.md)：靜態輸出、GitHub Pages 與自訂網域設定。
