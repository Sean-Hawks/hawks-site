# Hawks 匿名愛心 API

網站維持 GitHub Pages 靜態部署；這個獨立 Cloudflare Worker 使用 D1 保存文章愛心。未完成設定時回傳 `503`，不會偷偷退回記憶體計數。網站的整體啟用流程見 [docs/HEARTS.md](../docs/HEARTS.md)。

## API 與資料

- `GET /v1/hearts/{encodeURIComponent(articleId)}` 讀取 `{count, liked}`。可不帶 token，此時 `liked` 為 `false`。
- `PUT` 同一路徑，必須帶允許的 `Origin`、`Authorization: Bearer <token>`、`Content-Type: application/json`，body 為 `{"liked":true}` 或 `{"liked":false}`；回傳相同格式。
- token 是瀏覽器用 32 隨機位元組產生的 43 字元 base64url 字串。重送相同狀態不會重複累計。D1 複合主鍵去重，新增／刪除與回傳計數在同一批交易內完成；GET 不寫入資料。
- 文章 ID 為 `post:slug`、`talk:id` 或 `library:category:slug`，且必須存在於網站的公開 `/hearts.json`。只抓設定的 `SITE_ORIGIN`，不依請求拼接任意遠端網址，不跟隨轉址；3 秒 timeout、256 KiB 上限、最多 60 秒快取。清單失效時不使用過期副本。
- DB 只保存文章 ID 及 `HMAC(secret, article ID, token)`。不同文章的雜湊不同；不保存原始 IP、token 或可跨文章辨識訪客的 ID。所有 API 回應皆 `Cache-Control: no-store`，不用 cookie。
- 每分鐘讀取上限 120、寫入上限 20。限流器分別使用每日輪替的 IP HMAC，以及寫入 token HMAC；IP 不存進 D1。缺少 secret、D1、限流器或可信的 Cloudflare IP 標頭時拒絕服務。

這是匿名瀏覽器互動數，不是「不重複人數」：清除瀏覽器資料、使用其他裝置或自行產生 token 都可能再按讚。Cloudflare 限流是每個網路節點的近似限制，共用網路也可能共用 IP 額度；不能取代嚴格防機器人機制。CORS 只限制瀏覽器，不是外部程式的身分驗證。

## 本機驗證

使用 Node 22.12 以上版本，在本目錄執行：

```sh
npm ci
npm test
npm audit
```

測試直接使用 Miniflare 的 Worker runtime 與 D1，涵蓋並發按讚／取消、交易回滾、匿名 hash、清單失效、錯誤請求、CORS 與限流拒絕。測試資料庫與 `wrangler dev` 的本機資料分離。Miniflare 版本與 Wrangler 4.135.0 自身依賴完全一致；官方 CLI 此版本使用 `5.20260918.0-alpha`，因此測試也固定同版。

整合前端預覽時，先在網站根目錄將 API 設為 `http://localhost:8787` 建置，並在 `http://localhost:4174` 提供 `out/`。Worker 本機設定預設從此網址抓 `/hearts.json`；若更換埠號，請一起調整 `wrangler.local.jsonc` 的來源與允許清單。

首次建立本機 secret，再啟動 Worker：

```sh
node --input-type=module -e 'import {randomBytes} from "node:crypto"; import {writeFileSync} from "node:fs"; writeFileSync(".dev.vars", "HEARTS_SECRET=" + randomBytes(32).toString("base64url") + "\n", {flag:"wx", mode:0o600});'
npm run db:local
npm run dev -- --port 8787
```

`.dev.vars` 已忽略，不要提交。`flag: "wx"` 會避免覆蓋既有 secret。本機 D1 的 `local-only-hearts` 是刻意無法用於遠端部署的識別值；不要將本機設定拿去 deploy。本機按讚可在 `.wrangler/state/` 保留，關閉 Worker 後仍在。

## 正式部署

先發布包含 `/hearts.json` 的網站，讓 API 可以驗證文章。保留網站 API 設定空白，直到以下步驟完成。

1. `npx wrangler login` 登入你自己的 Cloudflare 帳號，然後 `npx wrangler d1 create hawks-hearts` 建立資料庫。若有多個帳號，選擇你要使用的帳號。
2. 複製 `wrangler.jsonc` 為本機忽略的 `wrangler.production.jsonc`，加入指令回傳的 **真實** `account_id`（多帳號時）及 `d1_databases` 設定。binding 必須是 `HEARTS_DB`，`database_name` 為剛建立的名稱，`database_id` 為實際 UUID，`migrations_dir` 為 `migrations`。
3. 確認 `SITE_ORIGIN` 與 `ALLOWED_ORIGINS` 是 `https://hawks.tw`。若另加正式來源，使用逗號分隔的完整 origin，不能填 `*`、路徑或尾端斜線。檢查限流 namespace `47101`／`47102` 沒有與帳號其他 Worker 共用；若有，改用兩個未使用的正整數字串。
4. `npm run db:production` 套用 migration。用密碼管理器產生並保存至少 32 字元的隨機 secret，再執行 `npx wrangler secret put HEARTS_SECRET --config wrangler.production.jsonc`，在互動提示中貼入；不要放進程式碼、聊天或命令參數。
5. `npm run deploy` 發布。使用輸出的實際 HTTPS `workers.dev` 網址驗證公開 GET，再將該 origin 填到網站的 `NEXT_PUBLIC_HEARTS_API_URL` 設定並重新建置網站。正式 PUT 必須帶 `Origin: https://hawks.tw`。

`npm run deploy` 只讀 `wrangler.production.jsonc`；缺少該檔時直接失敗。儲存庫沒有捏造的 Cloudflare 帳號、資料庫 ID 或可部署 secret，也沒有自動執行遠端資源建立。Workers/D1 用量與費用由你的 Cloudflare 帳號承擔，正式啟用前可在該帳號設定用量通知。

## 維護與備份

- 保留 `HEARTS_SECRET`，不要在一般部署時重新產生。更換 secret 後，舊瀏覽器 token 無法認領或取消原有愛心，而既有總數仍保留；若必須輪替，請先規劃資料重置或另做遷移。
- 變更 DB schema 或人工資料操作前，執行 `npx wrangler d1 export HEARTS_DB --remote --config wrangler.production.jsonc --output <安全備份路徑.sql>`，將備份保存在儲存庫以外的受控位置。D1 export 不包含 Worker secret，secret 須由密碼管理器另行保管。
- 還原時先匯入另一個 D1 資料庫驗證，再切換 binding，避免直接覆蓋現行資料。Cloudflare D1 的 Time Travel 可作為額外還原選項，保留期限依帳號方案而異。
- 移除文章或改為 private/draft 後，Worker 在快取到期後拒絕該文章的讀寫；資料庫中舊雜湊不會自動刪除。若重新公開相同 ID，原有計數會再出現。不要把文章 ID 改配給另一篇文章。
- 程式不輸出請求 token/IP，也關閉 Worker observability；Cloudflare 基礎設施仍會處理網路請求。若另行開啟平台日誌、追蹤或代理，請避免記錄 Authorization、request body 或原始 IP。

實作依據：[Cloudflare Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)、[D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/)、[Miniflare D1](https://developers.cloudflare.com/workers/testing/miniflare/storage/d1/)。
