# Hawks Agent：Discord 寫作工作室

目前預設在私人 `blog-寫作` 頻道直接寫作，bot 用 Embed 回覆。只接受 `.env` 中列出的 Discord 使用者 ID；訊息和狀態卡對有權查看頻道的人可見（包含管理員），Slash 指令回覆則僅操作者可見。

## 直接在頻道寫作

1. 傳送新訊息，第一行是文章標題，其他行是 Markdown 內文。
2. 用 Discord「編輯訊息」直接修改，bot 更新同一張 Embed 卡，顯示版本、字數變化與儲存狀態。
3. 長文以 Discord「回覆」接在原訊息、續寫段落或狀態卡下方。段落按收到順序串接，每則訊息都能獨立修改。
4. 用 Embed 卡的預覽、匯出、歷史、複製、封存與發布按鈕操作。發布前會重新讀取所有來源訊息，內容若已改變必須重新確認。

```text
# 我的文章標題
標籤：生活, 技術
摘要：這篇文章想記下的事情
網址：my-first-post

這裡直接寫正文，設定行也可以全部省略。
```

標籤、摘要、網址設定行需緊接標題；空行之後都是正文。刪除「網址」設定行會保留草稿目前的網址，已發布文章不可改網址。回覆內容全部視為正文。

刪除被追蹤的原文或續寫訊息時，不清空草稿，而是保留最後內容與歷史，停用原卡的按鈕並阻擋發布。可用 `/blog open` 匯出、複製或還原。刪除 bot 狀態卡會重新產生卡片。

### 照片與封面

在原文或回覆上傳照片，會依訊息順序放在該段文字後面。`圖說：說明文字` 指定同則訊息照片的說明，也可使用 Discord 附件的替代文字欄位。照片先保存到 `.data/media/`，轉成最長邊 1920 像素的 WebP（不放大）、移除 EXIF，發布前不會公開。

要插在段落中間，在內文獨立一行寫 `[[圖1]]`、`[[圖2]]`，對應同則訊息附件順序；未指定位置的照片仍放在訊息結尾。已上傳的照片可從 Embed「照片與封面」一次看六張縮圖，多選照片或按「插入這一批全部」，再選段落後方（或文章最前面）即可批次排版。選中的照片會從原位置移到新位置，依編號排序，不需複製路徑。選好位置後依複製指引貼回自己的訊息，全部完成才同步草稿，不會發布。翻頁與選擇會更新同一張私人卡片。

支援靜態 JPEG、PNG、WebP、AVIF，每張最多 20 MB／4,000 萬畫素，每篇最多 30 張。GIF 動畫與不支援格式會顯示提示。Embed「照片與封面」提供批次縮圖與封面選單。替換或移除附件只更新草稿，第一張新照片預設作為封面。

發布時圖片放進 `public/images/blog/`，和文章組成同一次 Git 提交，只有整份提交成功更新分支才會觸發部署。移除圖片不會清除 Git 歷史，公開過的照片仍可能留在歷史。

### 舊文章與版本還原

在文章瀏覽器按「編輯這篇」，將原文章保留原檔名、網址、日期與 frontmatter 帶回寫作頻道。按「選段修改」，回覆該段 Embed 貼上完整替換文字；後續直接編輯自己的回覆。未修改的段落會保留原文，可回覆主要狀態卡續寫。設定也在第一段，不需表單。

Discord 不允許使用者編輯 bot 發出的訊息，所以不能直接改 bot 貼出的原文；回覆替換是此流程的一部分。段落可下載 `.txt` 取得精確原文。

「版本紀錄」提供最近 25 版選單、完整 `.diff` 檔與確認還原按鈕；總共保留 30 版，更早的保留版本可用 `/blog restore` 指定。還原不更新網站，且會停用舊來源訊息映射，改成選段編輯，避免舊訊息重新覆蓋還原內容。原發布網址保持不變。

### 發布前與部署結果

「預覽」產生完整 HTML 閱讀版附件，包含已保存的照片，不建立公開草稿網址。這不是網站完整 Next.js 介面，但可檢查 Markdown、圖片與閱讀排版。附件上限 8 MB，過大時會提示改用照片面板與 Markdown。

「發布前檢查」重新同步來源，檢查本機照片、暫時附件網址、空白內容，顯示摘要提示、圖片數量及變更 diff。按確認才會寫入 GitHub。外部圖片僅保留原連結，不會自動備份或保證可讀。

發布後寫作頻道會新增一張部署 Embed，區分等待、進行中、成功或失敗。同一張卡更新、不洗版；工作記錄存於 `.data/deployments/`，重啟後繼續追蹤。預設追蹤 `deploy.yml`，可用 `GITHUB_DEPLOY_WORKFLOW` 變更。GitHub token 需要 Actions 讀取權限。超過一小時未完成會提示人工查看。

`npm run setup:channel` 可建立作者與 bot 專用的私人文字頻道，設定 `DISCORD_BLOG_CHANNEL_ID`，送出 Embed 使用說明；此操作需要管理頻道權限，並須在 Discord Developer Portal 啟用 Message Content Intent。未設定寫作頻道時保留原本表單模式。

訊息映射持久化到 `.data/channel-writing/`，重啟或 Gateway 恢復連線後會補讀離線的新訊息及修改。草稿仍只儲存在 bot 主機，請一併備份 `.data/`。附件圖片會保存到本機，確認發布後託管到網站；外部連結不會自動備份。

## 日常使用

| 操作 | 功能 |
| --- | --- |
| `/blog new` | 新文章表單，支援 Blog 或近況 Talk |
| `/blog list` | 私人草稿匣，query 可搜尋標題、標籤與全文 |
| `/blog open` | 自動完成選草稿，或貼上草稿 ID |
| `/blog import` | 匯入 `.md` / `.txt` 附件，始終建立私人草稿 |
| `/blog restore` | 將指定的歷史版本還原成新版本 |
| `/blog help` | 顯示操作指南 |
| 編輯段落／續寫 | 長文以 4,000 字為一段，可翻頁選擇段落，全文上限 200,000 字 |
| 標題與設定 | 修改標題、摘要、網址代稱與標籤 |
| 預覽／匯出 | Discord 文字預覽，或下載完整 Markdown |
| 版本紀錄 | 最近 30 次修改快照，包含版本號 |
| 複製草稿 | 複製文章內容，使用新 ID 和新網址 |
| 封存／移回草稿匣 | 保留內容；用 ID 重新開啟封存文章即可恢復 |
| 發布到網站 | 確認後寫入 GitHub，觸發網站現有部署流程 |

儲存發生在表單**送出**時；尚未送出的表單文字由 Discord 管理。每個面板帶有版本號，舊面板不會覆蓋新內容。發布後的修改仍是草稿，必須重新確認發布。發布成功回覆表示 GitHub 已接受提交，網站是否上線請查看回覆中的 Actions 連結。

## 初次設定

需要 Node.js 22.12 以上、Discord application，以及有目標 GitHub repository Contents 讀寫權限的 token。建議使用只授權 `hawks-site` 的 fine-grained token。

```sh
cd agent
npm ci
cp .env.example .env
chmod 600 .env
# 用本機編輯器填寫 .env，不要把 token 貼到聊天或提交到 Git。
npm run register
npm start
```

`register` 只新增或更新 `/blog`，不清除 bot 的其他指令。可設定 `DISCORD_GUILD_ID` 立即註冊到指定伺服器；不設定則註冊全域指令。工具會印出邀請連結。此 bot 不需要 Administrator。頻道寫作模式需要 Message Content intent、查看頻道、讀取歷史、傳送訊息和嵌入連結權限；建立專用頻道另需管理頻道權限。

同一 application 的互動應由這個服務處理；若已有其他程式使用同一 token，需要把 handler 整合到原服務，避免兩個程序同時回覆互動。

## 目前這台 Mac 的執行方式

已驗證應用程式 `Shark Agent` 在「鯊窩」內，並註冊全域 `/blog`。目前使用背景程序執行：

```sh
npm run background:status
npm run background:stop
npm run background:start
```

這種方式不依賴終端持續開啟，但不會在重開機或程序退出後自動重啟。LaunchAgent 在本機測試時卡在讀取 Documents 檔案，因此未保持安裝；若 macOS 顯示 Node 存取 Documents 的提示，允許後可使用下列服務安裝方式。

本機 `.env` 使用已登入的 GitHub 帳號憑證，已驗證能寫入目標 repository；需要時可換成僅授權此 repository 的 fine-grained token。Discord token 重设後也在此更新。

## macOS 背景服務

```sh
npm run service:install
npm run service:stop
```

安裝登入後自動執行的 `tw.hawks.blog-agent` LaunchAgent。設定與草稿仍保存在此資料夾；不要在服務執行期間搬動專案。Node 升級或移動路徑後重跑安裝指令。請勿同時啟動第二份 `npm start`。

Mac 睡眠、關機、登出或離線時 bot 無法服務。要全天使用，將 `agent/` 與 `.data/` 備份移至常駐主機，設定新的 `.env`，在該主機用服務管理器執行 `npm start`。Linux 可使用 systemd，WorkingDirectory 指向 agent 目錄、ExecStart 指向 Node 並帶 `--env-file=.env src/bot.mjs`，設定 Restart=on-failure；一次只運行一個實例。

日誌在 `.data/service.log` 與 `.data/service-error.log`。更新 token 後重跑 `npm run service:install`，讓程序重新讀取設定。

## 儲存與發布

- `.env` 與 `.data/` 已排除 Git。草稿存在 `.data/*.json`，建立時使用私人檔案權限，原子替換檔案，保留 30 版歷史。請自行備份 `.data/`；它不是雲端同步儲存。
- 匯出的 Markdown 預設 `status: draft`，日期依台北時區產生。
- Blog 寫入 `content/posts/<slug>.md`，Talk 寫入 `content/talks/<slug>.md`。
- 第一次發布遇到同名檔案會拒絕覆寫；再次發布比對上次的 GitHub SHA，網站文章若在其他地方修改過，會停止並提醒。
- 已發布的文章不能更換網址代稱，避免留下重複的公開文章。可複製成新的草稿。
- 預覽提供完整 HTML 閱讀版附件與照片面板；Discord 文字卡片仍受字數限制。
- 已接入 Gemini 編輯助手；尚無排程發布功能。

## 驗證

```sh
npm test
```

涵蓋持久化、擁有者隔離、路徑驗證、版本衝突、歷史還原、YAML 匯入／匯出、發布衝突及 GitHub 失敗處理。發布測試使用模擬 GitHub API，不會建立公開測試文章。

Discord API 依據：[互動回覆](https://docs.discord.com/developers/interactions/receiving-and-responding)、[指令](https://docs.discord.com/developers/interactions/application-commands)。

## 指令未及時回應的排查

本版本透過 Discord Gateway 接收互動，Developer Portal 的 Interactions Endpoint URL 必須留空。若填有 webhook 網址，即使 bot 顯示上線，指令也不會送到此程序。啟動時會檢查此設定；不會自動覆寫外部服務設定。

`npm run background:status` 會檢查近期心跳、Discord ready 狀態及啟動時驗證的路由，不能只用程序存在或歷史「已上線」日誌判斷。服務日誌記錄收到及完成互動的時間與耗時，不記錄 token 或文章內文。

## 瀏覽以前的文章

寫作頻道的說明 Embed 提供「瀏覽以前的文章」按鈕，也可使用 `/blog browse`。可加 query 全文搜尋、kind 篩選 Blog 或近況。清單每頁 8 篇，選文章後以 Embed 分段閱讀，提供上一段、下一段、回列表、Markdown 下載與網站連結。

從 GitHub 目前分支讀取文章，排除 draft/private，快取 1 分鐘；剛發布的內容可能仍在等待網站部署。閱讀面板保留 30 分鐘，重啟後可由頻道入口重新開啟。瀏覽和匯出不會修改原文。

## WSL 部署

見 [WSL 搬移與部署](deploy/WSL.md)，包含資料搬移、npm、Docker Compose、systemd 與備份方式。此版本不會自動在 Mac 安裝常駐服務。

## 預設文章網址

新文章使用台北時區的日期作為網址：`YYYY-MM-DD`。同類型同一天已有本機草稿時，依現有近況慣例加上 `HHmm`；同分鐘再加流水號，避免覆寫。手動指定的網址與已發布文章的原網址維持不變。發布時仍會檢查 GitHub 同名檔案衝突，不會覆寫其他文章。

## 發布資料核對

發布前先顯示 Embed 核對表，列出標題、類型、日期、網址、標籤、摘要、封面、圖片圖說、公開範圍與其他保留 metadata。空白欄位明確提醒，可選擇補上或確認留空。從選單確認全部四組資料，才會出現最終發布按鈕。核對有效 10 分鐘，限定作者與該版本；取消、重啟、逾時或修改後需重新核對。舊版直接發布按鈕無法略過核對。

可從核對表前往原訊息修改，設定行新增 `日期：YYYY-MM-DD` 與 `類型：blog`／`類型：talk`。未來日期不是排程，確認後仍會立即發布；已發布文章不能更改類型或網址。

## 可複製模板

`/blog new` 或頻道說明卡「取得寫作模板」提供最小模板，日期與網址自動產生。「修改文章資料」會提供已填入目前標題、日期、標籤、摘要與網址的模板及原訊息入口；只包含該原訊息的內文，不重複串接回覆或已處理的照片。長文在 Embed 只顯示設定區，附上完整 `.txt`，並提示保留原內文與附件。

## Gemini 編輯助手

System Prompt 同時包含 Obsidian 格式契約：保留近況／文章類型、YAML 自訂欄位、圖片位置，以及 `:::info` 等三冒號提示框。模型只回傳所需 JSON 欄位，YAML 合併與 Obsidian 圖片語法轉換由程式處理。API 回傳的 token 用量保存在 `.data/ai-suggestions/usage.jsonl`，不記錄正文或金鑰；建議 Embed 顯示本次總 token。此紀錄不是剩餘額度，實際限制請看 AI Studio 專案的 Rate Limit 頁面。

System Prompt 在 `src/writing-style.mjs`，參照已發表的 `first-web.md`、`HiPAC.md` 與 `talks/2026-09-02.md` 的少量短句：第一人稱、台灣口語、保留原標題與吐槽程度，不用第三人稱導讀或浮誇情緒包裝。範例只供語氣參考，不作新文章事實來源，也不會自動上傳全部舊文。更新風格版本後，舊 AI 建議須重新產生。

文章狀態卡的「AI 編輯助手」提供：標題／摘要／標籤、保留語氣潤稿、待補內容檢查、照片圖說。先選功能才會送出本篇內文；照片圖說另外傳送前 3 張已保存且去除 EXIF 的照片。其他模式不會上傳照片。AI 不會自行發表文章，也不會更改日期、網址或發布資訊。

回覆以 Embed 顯示差異附件、「取得可複製全文」與「略過」。複製指引會提醒把想採用的內容貼回原訊息，每次修改即同步並保留版本紀錄；不自動發布、不切換為選段編輯。修改過內容、超過 30 分鐘或其他作者都不能使用該份建議。

設定 `GEMINI_API_KEY` 與 `GEMINI_MODEL`（目前驗證可用：`gemini-3.5-flash`）。每次最多 30,000 字，一位作者同時只送一個請求，請求逾時／額度不足／格式錯誤會顯示提示並保留原稿。Gemini 建議不代表已做事實查核，潤稿若改動 Markdown 連結或圖片標記會拒絕套用。

WSL 搬移時把私人的 `.env` 設定一起帶過去；金鑰不會打包到 Docker image。實際費用與額度以你的 Google AI Studio 專案為準。


## 近況分類、舊訊息修改與 AI 排版

狀態卡「近況／文章」可直接選分類；已發布內容下次確認發布時，以單一 Git 提交搬到新分類並移除舊位置，同名衝突或來源被外部修改會停止。搬移會改變公開網址，發布核對表會顯示來源與目的地。

舊版 AI 編輯或還原曾換過來源時，再次修改已確認屬於同一作者、同一草稿的原訊息，會自動恢復它作為來源，沿用原狀態卡並保留版本紀錄。

AI 編輯助手新增「Markdown 排版」，可適度使用重點、清單、小標題與 `:::info`、`:::tip`、`:::warning`（獨立一行 `:::` 結束），保留原文事實、第一人稱與照片位置。閱讀版預覽支援提示框。AI 建議需由作者複製貼回才會變更草稿。


## 統一的複製貼回流程

Gemini 建議的按鈕為「取得可複製全文」。建議只供參考，可以部分採用、改寫或略過，不會建立強制貼回核對或鎖住操作。原本 Discord 訊息和續寫始終是內容來源，編輯即同步；發布前重新讀取來源。建議卡重複使用，長文可回覆原文續寫。舊版等待貼回狀態會在重啟時自動解除，未貼上的 AI 內容不會套用。

批次排圖與更換近況／文章分類也使用這個貼回流程。封面選擇與發布核對仍保留各自按鈕。


## 固定工作狀態卡

每份草稿固定使用同一個 `panelId`。載入／還原、原訊息同步與複製貼回都更新原卡；只有原卡被刪除時才重建。網站部署進度顯示在這張卡的「網站部署」欄位，不再每次發布另外送出部署卡。過期提交的部署結果不覆蓋較新提交的狀態。


## 與目前 Obsidian Vault 的格式相容

依 `.obsidian/daily-notes.json`、`content/templates/daily-note.md` 核對：近況位於 `content/talks/YYYY-MM-DD.md`。整理全文與 Markdown 匯出使用 YAML 標頭，包含近況的 event、banner、slides、video、relatedPosts、ogImage、status 等欄位，保留自訂設定；舊的中文設定列仍可讀取。已保存圖片在複製版本使用 Obsidian `![[public/images/blog/檔名.webp|圖說]]`，一般 `![[檔名.png]]` 也可讀取；發布時轉成網站使用的圖片網址。Obsidian 顯示圖片仍需 Vault 中有對應圖片檔，這項格式支援本身不會自動拉取 GitHub 檔案。

複製偵測也接受這份草稿的歷史原訊息：若內容完全對應待貼回段落，自動接回原訊息並解除舊來源衝突；重新啟動後會重新核對，不要求重貼。
