# hawks.tw 檢查紀錄（2026-09-19）

範圍：公開網站、GitHub Pages 靜態輸出、網站程式碼、Discord 寫作工具、依賴與部署流程。採用原始碼審查、實際瀏覽器操作、靜態輸出巡檢、回歸測試與 npm audit；沒有對正式服務進行破壞性掃描。這份紀錄不代表不存在未知漏洞。

## 已確認並修正

| 問題 | 影響 | 修正 |
| --- | --- | --- |
| Next.js 15.1.7 與舊依賴有 14 項 audit 告警 | 開發／建置依賴風險；GitHub Pages 沒有運行中的 Next 伺服器，不能據此推論正式站可被 React2Shell 遠端執行 | Next.js 15.5.25、Sharp 0.35.4、修補傳遞依賴，PostCSS 8.5.28 override；audit 0 |
| gray-matter 支援 JavaScript 標頭 | 匯入帶有 BOM 的 Markdown 可繞過前置檢查，在寫作工具執行標頭；網站建置讀取相同格式也有風險 | 所有解析入口禁用 JavaScript engine，加入 BOM/js/javascript 回歸測試 |
| draft/private 仍生成分享圖片 | 公開 `/og/` 可露出未發布標題、描述和封面 | 只生成公開文章圖片，清除失效的產生檔 |
| 保留舊資源的下載流程未限制路徑、來源、大小和等待時間 | 外部內容可影響建置寫入位置、下載目標或資源消耗 | 解碼後驗證靜態目錄及副檔名、同來源 sitemap、拒絕重新導向、大小上限及 10 秒逾時 |
| 手機選單收合但連結仍在 Tab 順序內 | 鍵盤可移到看不見的項目 | inert、ARIA 狀態、Escape、焦點回復、當前頁標示、跳到主內容 |
| 相簿缺少焦點管理 | 開啟照片後 Tab 可跑到背景、關閉後不知回到哪裡 | 移入／圈住／回復焦點、背景 inert、對話框名稱 |
| 搜尋截斷 24 筆且沒有更多結果入口 | 99 筆索引中多數內容無法瀏覽 | 顯示所有符合項目、結果狀態、無結果提示、欄位名稱 |
| Discord 聯絡卡連結是 `#` | 點擊沒有聯絡入口 | 指向現有的 `/discord/` 邀請頁 |
| 日期取決於建置電腦時區 | 西半球建置會讓 YAML 日期往前一天 | 統一使用 UTC 日期欄位並以洛杉磯時區測試 |
| Talk 讀取所有目錄項目 | `.DS_Store` 或子目錄可能造成錯誤 | 只讀取 Markdown 一般檔案 |
| 音樂推薦詳頁漏列 sitemap | 只有推薦作品、沒有評論的詳頁無法從 sitemap 發現 | sitemap 與詳頁產生規則一致 |
| 正式部署使用 npm install；備援略過前後建置步驟 | 依賴版本漂移、分享圖片或舊資源缺少 | npm ci、Node 22、備援完整執行 npm run build |
| 根目錄 `.env` 沒有被忽略 | 後續可能誤提交設定 | 忽略 env 檔並保留 example 範本 |
| Talk 最新項目錨點遺漏、舊文網址缺少 scheme | 目錄與站內連結無法正確跳轉 | 補上錨點及 HTTPS 網址 |

## 可選改善

以下五個 PR 分開提交，尚未合併，可獨立選擇：

| PR | 改善內容 |
| --- | --- |
| [#5 可分享的搜尋與收藏篩選](https://github.com/Sean-Hawks/hawks-site/pull/5) | 搜尋條件放入網址，返回、重新整理與分享連結保留條件。支援全形、重音和連字號，中文標籤不再碰撞，Library 搜尋結果直接定位作品。 |
| [#6 手機文章目錄與可靠的段落連結](https://github.com/Sean-Hawks/hawks-site/pull/6) | 同一套 Markdown 標題解析產生目錄和錨點，略過程式碼區塊、處理重複標題，提供手機目錄。 |
| [#7 找得到出口的 404 頁面](https://github.com/Sean-Hawks/hawks-site/pull/7) | 提供全站搜尋、返回首頁和文章列表入口，保留 noindex。 |
| [#8 自動網站健檢與依賴更新](https://github.com/Sean-Hawks/hawks-site/pull/8) | PR 自動執行 lint、型別、測試、完整靜態匯出與內部連結檢查，定期追蹤依賴更新；官方 Actions 使用 Node 24 執行環境並固定 commit SHA，runner 固定 Ubuntu 24.04，避免淘汰版本與預設系統遷移影響建置。 |
| [#9 響應式 WebP 圖片與更順暢的相簿](https://github.com/Sean-Hawks/hawks-site/pull/9) | 依照原有圖片最佳化草稿整理，處理 213 張來源圖片；按顯示寬度載入、提供真實尺寸、載入狀態和原圖入口，保留動畫和未知來源 fallback。原工作目錄未提交的修改完整保留。 |

圖片 PR 的 960px 樣本：13.86 MB 圖片變為 198 KB、10.06 MB 圖片變為 106 KB、1.69 MB 首頁封面變為 60 KB。這些是單一衍生圖片大小；原圖仍保留，全部衍生圖片合計約 88 MB，不代表部署總大小減少相同比例。

## 尚待選擇或外部設定

- 正式站回應未提供 CSP、HSTS、X-Content-Type-Options 等安全標頭。GitHub Pages 不會套用 Next.js headers 設定；需從支援標頭的代理或託管平台設定並驗證。不能把加一段 next.config 當作已保護。
- giscus 的 repo/category ID 尚未設定，因此留言功能刻意不顯示。需決定是否開啟 GitHub Discussions 與安裝授權。
- `draft`/`private` 只控制網站輸出，Git 儲存庫是公開的，原稿與 Git 歷史仍然公開；`public/` 下的原始圖片也會發布。機密內容應留在儲存庫外。
- 外部連結與封面服務會變動；本次內部連結全量巡檢不等於保證所有外站長期可用。
- 沒有量測真實訪客 Core Web Vitals 分位數；圖片壓縮數字是本機資產大小，不能直接當作真實網速改善百分比。
- 既有 ESLint 9、Next 15 的大版本升級應另行安排，這次安全修補保持 Next 15 靜態輸出架構。

## 安全檢查補充

已檢視 Discord owner allowlist、草稿擁有權與發布確認、GitHub 非強制更新、媒體下載來源及格式限制、Markdown HTML 清理。未在已追蹤檔案的常見私鑰/API token 模式掃描中找到憑證；這不是完整 Git 歷史或供應鏈鑑識。

官方公告：[Next.js React2Shell](https://nextjs.org/blog/CVE-2025-66478)、[Sharp libheif](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c)。實際套件修補以本次 lockfile 和 npm audit 為準。

## 最終交付與驗證

- 明確修正已直接推送 main：[`c8e91d3`](https://github.com/Sean-Hawks/hawks-site/commit/c8e91d3c6e6aedc9d55b2c3167e663a251258de3)、[`a856763`](https://github.com/Sean-Hawks/hawks-site/commit/a85676366f3b7170b9018c26de1681623084a1f2)。[GitHub Pages 正式部署成功](https://github.com/Sean-Hawks/hawks-site/actions/runs/35375108720)。
- 正式 Discord 寫作服務的四個 Markdown 解析入口亦已更新。更新前核對舊檔雜湊、備份程式與資料，以正式 Node 22 與現有依賴執行 65 項測試；重新啟動後確認新的健康狀態為 ready，後續心跳仍正常。備份留在原服務主機的私有目錄，沒有將憑證或資料上傳至儲存庫。
- 五個 PR 在本機整合分支可無衝突合併。以 Node 22.23.2 / npm 10 重新安裝依賴後，20 項網站測試、65 項寫作工具測試、5 項匯出檢查器測試、lint、完整靜態建置全部通過。網站與寫作工具的 npm audit 均為 0。
- 巡檢包含 fallback 的 351 個 HTML、sitemap 和 RSS；內部頁面、圖片與段落連結檢查為 0 問題。
- 實際瀏覽器驗證包含手機 390px 版面、搜尋連結還原與返回、手機文章目錄、404 導覽、相簿切換／關閉／原圖入口及響應式圖片選擇。這不是完整 WCAG 認證，也未量測真實訪客效能。
