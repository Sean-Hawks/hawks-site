# hawks.tw — Hawks 的個人網站

[hawks.tw](https://hawks.tw/) 是我記錄學習與生活的地方。這裡有程式開發、機器學習與資安的學習筆記，參與營隊、競賽和社群活動的心得，也有管樂生活，以及喜歡的動畫、電影、音樂與遊戲。

這個儲存庫包含網站原始碼、Markdown 文章、作品收藏和寫作工具。內容可以用一般文字編輯器或 Obsidian 維護；網站以 Next.js 建置成靜態檔，再透過 GitHub Actions 發布到 GitHub Pages。

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

舊的 `/now/` 入口目前會導向 Blog，近況不需要另外維護一份。

預設保留原本的 GUI；快速連點導覽列的深淺色按鈕三下，可切換至 Cyberpunk 介面，再連點三下即可切回。點一下仍然切換深淺色。介面選擇與兩種介面的深淺色偏好都會記住，重新整理或換頁也會沿用；Cyberpunk 第一次開啟預設深色。

Cyberpunk 首頁的大字 HAWKS.TW 保留在個人檔案面板內。閱讀存量顯示公開正文的預估閱讀總時間、分類時間與五分鐘內可讀完的篇數；收藏面板顯示四類收藏的占比與平均個人評分，未評分項目不計入平均。全站按 `⌘ K`／`Ctrl K`，或點擊搜尋按鈕，可開啟快速前往選單；輸入頁面名稱會顯示相符入口，也能將關鍵字帶到全站搜尋。支援方向鍵、Enter 與 Esc。

點收藏分類量表可切換面板內的作品預覽，再點一次可回到全部分類；左右鍵按鈕每次翻看三件作品。上方統計保留全部收藏的數字。閱讀存量可直接抽一篇五分鐘內的正文，同一輪不重複，抽完後開始新的一輪。切換內容的短暫過場會尊重減少動態效果設定，分類、翻頁與抽選按鈕皆可用鍵盤操作。

Cyberpunk 的滑鼠回饋包含面板細框、標題列短線、HAWKS 字樣的淡金反光與頭像的微小位移；內文保持穩定。這些效果只在精確滑鼠與允許動態效果時啟用，觸控與減少動態模式維持靜態介面。滑鼠座標每幀合併更新，不會觸發 React 重繪；離開面板、捲動或切回原本 GUI 時會清除效果。

個人檔案內的 HAWKS.TW 採立體銘牌構圖：滑鼠讓銘牌產生最多 4 度傾斜，字樣保留淡金反光；底部按鈕可展開網站、公開紀錄數與記錄年份。內容索引使用共用的取景框，隨滑鼠或鍵盤焦點滑到對應數字，也會在窄畫面重排時重新對齊。收藏數字外的點陣環依四類收藏比例繪製，滑過區段會突出該分類，文字描述列出實際數量。識別資訊收起時不會進入鍵盤順序，減少動態模式停用傾斜及轉場。

這個設計實驗分支參考 Minerva 的儀表板構圖，採用窄桌面導覽、左側個人檔案與發布活動、右側內容總覽與閱讀面板：深灰藍背景、白色標題與等寬數字、1px 細框，黃藍只用於少量品牌標記與互動提示。健康狀態另用綠／琥珀／紅搭配文字表達，照片保留原色。首頁保留大字 HAWKS 與描邊 .TW；最近 12 個月的發布折線依真實文章與近況日期繪製，可透過滑鼠、月份滑桿或方向鍵查看每月數量。標題列以實色深灰藍區分層次，黃藍只出現在細線、選取與互動提示；面板短暫進場、照片與箭頭的輕微過場會尊重減少動態效果的設定。閱讀面板依自身可用寬度切換排版。內容索引、收藏評分覆蓋量表、進行中與待補數量皆由站內紀錄計算，面板依標題、摘要與細節、來源排列。全站沿用相同的導覽與閱讀樣式。Rajdhani 窄體標題搭配內文與等寬日期，字體在本機提供，授權位於 `public/fonts/rajdhani/OFL.txt`。

## 在本機開啟網站

使用 Node.js 22.12 以上與 npm，與目前部署流程一致。在專案根目錄執行：

```bash
npm install
npm run dev
```

接著開啟 [http://localhost:3000](http://localhost:3000)。一般網站預覽不需要啟動 Discord 寫作工具。

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

## 靜態圖片最佳化

`npm run dev` 和 `npm run build` 會先將本機圖片產生多尺寸 WebP，原圖保留。`npm run images` 可以單獨執行。產生檔與 manifest 放在 `public/_img/`，不提交 Git；首次建置較久，後續會快取沒有變更的來源。設定或產生腳本變更時會重建。

圖片載入器只使用 manifest 確認存在的尺寸，不放大小圖；動態 WebP、GIF、外部網址與未列入的來源保留原檔。壓縮失敗會停止建置，避免發布指向不存在資源的頁面。新增圖片後若開發伺服器正在運行，請重新啟動，讓 manifest 更新。

## 愛心互動

Blog、Talk 與 Library 詳頁可加入免登入愛心，支援取消與共用總數，和私人「稍後閱讀」清單分開。文章仍由 GitHub Pages 提供，互動資料由獨立的 Cloudflare Worker 與 D1 保存。

尚未設定 `NEXT_PUBLIC_HEARTS_API_URL` 時不顯示按鈕。完整本機預覽、測試、上線順序與匿名互動限制見 [愛心系統指南](docs/HEARTS.md)；後端程式與資料庫遷移在 [`hearts-worker/`](hearts-worker/)。

## 留言區

首頁、Blog、近況與收藏詳頁支援匿名／暱稱留言與巢狀回覆。網站維持靜態部署，互動 API 與 SQLite 獨立架在 WSL，目前透過 Tailscale Funnel 提供 HTTPS，也支援 Cloudflare Tunnel；包含 Turnstile 驗證、限流與管理員刪除。前端未設定 API 時顯示「留言區準備中」。本機預覽與部署步驟見 [留言服務指南](comments-server/README.md)。

## 寫作方式

- **直接編輯 Markdown**：修改 `content/` 下的檔案，在本機預覽後提交。
- **Obsidian**：使用草稿、Daily Notes 與範本整理內容。資料夾與設定方式見 [Obsidian 寫作流程](docs/OBSIDIAN_WORKFLOW.md)。
- **Discord**：選用 [Hawks Agent 寫作工具](agent/README.md)，在 Discord 建立、編輯、搜尋與匯出草稿，確認後發布 Blog 或 Talk。它是需要獨立設定與執行的服務。

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
agent/           Discord 寫作工具（獨立服務）
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
- [Discord 網域設定](docs/DISCORD_DOMAINS.md)：邀請頁及 `discord.hawks.tw`、`dc.hawks.tw` 的設定。
- [網站流量紀錄](docs/ANALYTICS.md)：Cloudflare Web Analytics 的查看方式、正式站載入條件與驗證限制。

## 自動品質檢查

每個 PR 的 Site quality 工作流程會執行 lint、網站和寫作工具測試、套件安全檢查、完整靜態建置，以及匯出 HTML／RSS／sitemap 的本機連結檢查。Deploy 在上傳前也會執行網站回歸測試和輸出檢查。

本機執行 `npm test`、`npm run test:export`、`npm run build`、`npm run check:export`（輸出檢查使用 Python 3 標準函式庫，不連線爬取外站）。GitHub Actions 已固定 commit SHA，Dependabot 每週提供套件和 Action 更新。若要禁止合併失敗的 PR，仍需在 GitHub 分支保護把 Site quality 設為必要檢查。

完整檢查範圍、已修正項目及外部設定限制，見 [2026-09-19 網站檢查紀錄](docs/SITE_AUDIT_2026-09-19.md)。
