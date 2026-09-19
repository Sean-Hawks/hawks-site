# 免登入愛心

Blog、Talk 與 Library 的公開詳頁可以按「喜歡」、取消，以及查看所有訪客共用的愛心總數。愛心與私人「稍後閱讀」清單分開。文章仍由 GitHub Pages 提供；Cloudflare Worker 與 D1 負責互動資料。

喜歡、稍後閱讀與分享集中在正文結尾的操作區，標題與作品資訊區不放互動按鈕。Library 有推薦作品時，操作區會出現在推薦作品之後。複製連結、引用與列印收在「更多操作」，需要時再展開。

## 啟用狀態

沒有設定 `NEXT_PUBLIC_HEARTS_API_URL` 時，按鈕不會出現在網站。這讓程式可以先合併，待後端完成部署後再啟用，不會顯示假的計數。

需要的外部設定只有 Cloudflare 帳號、D1 資料庫、Worker 的伺服器密鑰，以及 GitHub repository variable `NEXT_PUBLIC_HEARTS_API_URL`。密鑰只放在 Worker 的 secret；網站公開變數只放 API 網址，不得放 token 或密碼。

## 本機預覽

1. 依照 [後端指南](../hearts-worker/README.md) 安裝套件、建立本機資料庫並啟動 Worker。
2. 網站根目錄的 `.env.local` 設定 `NEXT_PUBLIC_HEARTS_API_URL=http://127.0.0.1:8787`。API origin 不要包含 `/v1/hearts`。
3. 啟動網站；Worker 的 `SITE_ORIGIN` 和 `ALLOWED_ORIGINS` 必須對應這個本機網站網址。`localhost` 與 `127.0.0.1` 是不同的 origin，請使用一致的網址。
4. 開啟文章、Talk 與 Library 詳頁，確認點喜歡、重新整理、取消、第二個瀏覽器的共用計數，以及後端中斷時的重試提示。

本機 Worker 使用獨立的本機 D1；預覽互動不會寫進正式資料庫。

## 上線順序

1. 合併網站程式，先維持公開 API 變數空白，讓 `/hearts.json` 的公開文章清單隨網站部署。
2. 依 [後端指南](../hearts-worker/README.md) 在自己的 Cloudflare 帳號建立 D1、套用遷移、設定 `HEARTS_SECRET` 並部署 Worker。正式設定使用 `SITE_ORIGIN=https://hawks.tw`，允許來源使用 `https://hawks.tw`。
3. 驗證正式 API 可讀取公開文章，且不存在的文章、未授權來源、無效 token 都會被拒絕。
4. 在 GitHub 的 repository **Variables** 設定 `NEXT_PUBLIC_HEARTS_API_URL` 為 Worker 的 HTTPS origin，再重新執行網站部署。
5. 確認實際網站的共用計數、重新整理後狀態與取消功能。測試新增的愛心可以再取消。

兩份 Pages 部署工作流程都會讀取這個變數。Worker API 使用 Authorization header，無需第三方 cookie，也可以使用 HTTPS 的 `workers.dev` 網址。之後可再設定自己的 API 子網域。

若要停止顯示愛心，清空 repository variable 並重新部署網站即可；不要刪除資料庫。Worker 有獨立的版本與資料庫遷移，後端更新方式見其指南。

## 計數與隱私

- 第一次按愛心時才建立加密亂數訪客金鑰，保存在此瀏覽器。它不是帳號，不會跨裝置同步。
- 同一訪客金鑰在同一篇文章最多一顆愛心。重試相同動作不會增加計數；取消後可以再次喜歡。
- 清除瀏覽器資料、使用無痕視窗或換裝置會被視為新的訪客。數字代表愛心，不能當成精確的不重複人數。
- 無法保存瀏覽器資料時，只在目前頁面工作階段保留金鑰，畫面會提示。讀取或寫入失敗時會顯示重試提示，不會以本機數字假裝共用總數。
- D1 不儲存原始訪客金鑰或原始 IP。每篇文章使用不同的訪客雜湊，限流使用每日變更的 IP 雜湊。
- `HEARTS_SECRET` 應長期安全保存。直接更換會讓舊訪客無法認領或取消舊愛心，並可能再次計數；輪替需要先規劃資料遷移。

## 防濫用與驗證

後端只接受目前公開清單中的文章與有大小限制的請求，寫入必須來自明確允許的網站來源。公開讀取允許沒有 Origin 的請求。資料庫唯一鍵及原子操作確保重送、並發與取消不會產生重複或負數計數。

讀取與寫入都有基本限流。Cloudflare rate-limit binding 是各服務地點的近似防護，不是全球嚴格額度；共用網路可能暫時共用限制。它可以降低重複灌票，無法保證阻止所有匿名機器人。若日後遇到實際濫用，再加入挑戰驗證或提高身分門檻。

PR 檢查涵蓋網站測試、Worker 的本機 D1 測試、依賴安全檢查及完整靜態建置。正式資料庫不會在測試中使用。資料備份與匯出方式見後端指南。

官方參考：[Cloudflare D1](https://developers.cloudflare.com/d1/)、[Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)。
