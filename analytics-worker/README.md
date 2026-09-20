# 長期流量紀錄

獨立的私人報表與每日歸檔 Worker。網站繼續使用原有 Cloudflare Web Analytics beacon，愛心資料庫不受影響。D1 中的每日摘要沒有自動刪除期限，可累積多年；Cloudflare 帳號、資料庫及備份仍須持續維護。

## 資料與範圍

- 每天台灣時間 04:00（UTC 20:00）歸檔已結束的日子，重查最近三天以吸收延遲資料；每次另補一個歷史缺日。
- 依 `Asia/Taipei` 的午夜邊界，查詢 `[起日 00:00, 次日 00:00)`。只收指定 account、siteTag、`hawks.tw` hostname、`bot=0`。
- 保存每日 page views、visits、抽樣倍率、抓取時間、完整頁面路徑與來源主機分組。**Visits 不是不重複訪客**。不收 IP、cookie、訪客 ID、愛心 token 或 referrer 路徑；不另加訪客追蹤器。
- 數字沿用 Cloudflare 回傳的估計，不再次乘上 `sampleInterval`。歷史資料可能已被抽樣；各維度的估計總和不保證等於總計。
- Cloudflare 可查最近約六個月，Dashboard 一次最多看一個月；歸檔可跨年度查看，但無法找回上游已過期的資料。
- 每個維度以字典順序分頁，最多 5,000 群組／日；達到上限、逾時、上游錯誤或不完整回應都拒絕寫入，顯示失敗，不當成零。日快照上限 1 MiB；超過須調整儲存策略。
- 單日以一個 D1 row 原子替換，不累加；較舊的並行抓取不能覆蓋較新的版本。已歸檔的歷史日不自動重查，避免被較低精度的歷史抽樣覆蓋。
- 缺日、抽樣、尚未設定排程憑證、最近失敗或超過 48 小時未同步，都在私人報表顯示。

## 本機

使用 Node 22.12 以上：

```sh
npm ci
npm test
cp .dev.vars.example .dev.vars
npm run db:local
npm run dev -- --port 8788
```

開啟 `http://localhost:8788/`，輸入 `.dev.vars` 的本機報表金鑰。本機設定不含正式 API token、D1 ID 或排程。測試使用獨立 Miniflare D1，不讀寫正式資料。

## 正式部署

1. 使用自己的 Wrangler 登入狀態建立獨立 D1：`npx wrangler d1 create hawks-analytics`。
2. 複製 `wrangler.jsonc` 成 Git 忽略的 `wrangler.production.jsonc`。加入真實 `account_id` 與 `d1_databases`，binding 為 `ANALYTICS_DB`，`migrations_dir` 為 `migrations`。`vars` 加上 `CF_ACCOUNT_ID`、**Web Analytics siteTag（不是公開 beacon token）** `CF_SITE_TAG` 與最早確認收集日期 `ARCHIVE_START_DATE`。時區固定 `Asia/Taipei`。
3. 執行 `npm run db:production`。首次寫入會固定資料來源；更換 account、siteTag、hostname、時區或開始日期須另建資料庫／規劃遷移，不可混入舊歸檔。
4. 產生至少 32 字元隨機 `DASHBOARD_TOKEN`，存進自己的密碼管理器與 Worker secret；它只允許讀取報表，不能管理 Cloudflare。`npx wrangler secret put DASHBOARD_TOKEN --config wrangler.production.jsonc`。
5. 在 Cloudflare 建立僅具 **Account → Account Analytics → Read**、只限該帳號的 API token。用 `npx wrangler secret put CF_ANALYTICS_TOKEN --config wrangler.production.jsonc` 存入 Worker。**不可把個人的 Wrangler OAuth token 部署到 Worker**，也不要貼入聊天或 Git。
6. `npm run deploy`。確認 Worker 的 Cron Trigger 為 `0 20 * * *`。若尚無統計 API token，將正式設定的 `triggers.crons` 設為 `[]`，完成 secret 設定後恢復排程再部署；不要宣稱此時已自動歸檔。
7. 開啟實際的 `workers.dev` 網址，輸入報表金鑰查看。金鑰只存在分頁記憶體，不放 URL、cookie 或 localStorage；關閉／重新整理後需再次輸入。API 不開放跨來源 CORS，使用 `no-store`，所有資料與狀態都需認證。

帳號需要足夠的 Workers/D1 額度；這些步驟不替使用者升級付費方案。報表公開的登入外殼沒有流量資料；報表 API 金鑰與 Cloudflare API token 是不同憑證。

## 一次性補存與備份

先確認真實最早日期。以下命令只在本機使用明確指定的 Wrangler 憑證讀取來源與寫入 D1，不輸出 token，也不把 OAuth 存進 Worker。

```sh
npm run backfill -- --config wrangler.production.jsonc \
  --oauth-file /absolute/path/to/wrangler/config/default.toml \
  --from YYYY-MM-DD --to YYYY-MM-DD \
  --backup /private/path/outside/repository
```

只補上尚未歸檔的日期，已有日期匯出既有快照；每成功一天就保存，失敗可重跑續接。補存範圍不含今天，且限制在最近 179 天以避開上游滾動保留邊界。歷史 JSON 備份含站務資料，請私密保存，不提交到公開 GitHub。

Dashboard 可以匯出所選期間的每日 CSV 與單日完整 JSON。定期另行匯出 **整個 D1**，保存在儲存庫外的加密備份位置：

```sh
npx wrangler d1 export ANALYTICS_DB --remote --config wrangler.production.jsonc --output /private/path/archive-backup.sql
```

D1 備份不包含 Worker secrets，兩個 token 須另行保管。還原時匯入新的資料庫，驗證日期、資料來源與合計後才切換 binding，不覆蓋正在使用的資料庫。D1 的短期還原功能不能取代長期備份。

## 驗證

`npm test` 涵蓋台灣日期、所有分頁、重複／並行抓取、上游部分錯誤、原子替換、零與缺日區別、排程補缺、跨站來源隔離、私人 API 與真實 Worker/D1 runtime。CI 會執行這些測試與套件安全檢查。

API schema 已依 Cloudflare GraphQL introspection 核對：`AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject`、`count`、`sum.visits`、`avg.sampleInterval`、`requestPath`、`refererHost` 與對應排序／游標欄位。正式啟用前須用實際帳號驗證查詢。

依據：[Web Analytics 保留期及抽樣](https://developers.cloudflare.com/web-analytics/faq/)、[分析 API 讀取權限](https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/)、[Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)。

## 報表閱讀與情境試算

- 預設顯示每日瀏覽，跨 400 天以上改為每月，可手動切換；缺日不畫成零，月份只加總所選日期。
- 平均值以已保存天數為分母；兩週比較僅在區間最後 14 天皆完整時顯示。
- 漏記試算預設 0%，公式是已保存瀏覽數 ÷（1 − 假設漏記比例）。這不是實測修正、可信區間或保證下限，不會改動資料庫或匯出數字。
- Cloudflare GraphQL 的抽樣數值已是估計，不能再次乘上 sampleInterval。參考 https://developers.cloudflare.com/analytics/graphql-api/sampling/ 。
- 歸檔請求使用 Workers 支援的 `redirect: manual` 並拒絕非 2xx；不跟隨重新導向、不轉送權杖。部署驗證應包含 Cloudflare 遠端 scheduled 執行，僅在 Node.js 手動呼叫不足以覆蓋平台相容性。
