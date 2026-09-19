# 網站流量紀錄

hawks.tw 沿用 Cloudflare Web Analytics，查看瀏覽趨勢、熱門頁面、流量來源與載入品質。網站原本已有公開的 beacon token；這次整理載入條件與操作方式，沒有另外加入一套追蹤服務。

載入設定在 [`CloudflareAnalytics.tsx`](../app/components/CloudflareAnalytics.tsx)。只有正式建置（`NODE_ENV=production`）且網址來源精確為 `https://hawks.tw` 時才載入 beacon，同一頁只初始化一次。本機開發、`localhost` 的正式建置預覽，以及其他預覽網域都不載入。站內換頁由 Cloudflare 原生 SPA 功能處理，網站不另外送出 pageview。[官方 SPA 說明](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)

## 查看統計

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)，切換到管理 hawks.tw 的帳號。
2. 開啟 **Web Analytics**，選擇 **hawks.tw**。
3. 選擇日期範圍，先看整體趨勢，再依頁面、來源或裝置篩選。

| 想知道的事 | 先看哪些資料 |
| --- | --- |
| 最近是否有更多人來看 | 比較不同日期的 Visits 與 Page views 趨勢。 |
| 哪些文章有人閱讀 | 依 Path 檢查 `/blog/`、`/talk/`、`/library/` 的頁面瀏覽情況。 |
| 讀者從哪裡進站 | 查看 Referer；Dashboard 提供來源網站主機名稱。 |
| 要優先改善哪些使用情境 | 依手機／桌面、瀏覽器或作業系統篩選。 |
| 讀取與操作是否順暢 | 看 Page load time、Core Web Vitals，再搭配裝置與頁面比較。 |

**Visits 不是不重複人數。** Cloudflare 依外部來源或直接進站判定一次 visit，一次 visit 可以有多次 page views；同一人多次進站也可能產生多次 visits。使用這些數字觀察趨勢，不把它們當成精確的人頭計數。[指標定義](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)、[可用篩選維度](https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/)

搜尋與篩選會更新網址參數；依瀏覽器使用的 SPA 偵測方式，這些更新可能被計為多次檢視。這是依導航機制推得的限制，目前尚未在 Dashboard 驗證其影響。閱讀熱門文章時，優先依文章路徑分析；整體 page views 不代表閱讀了同等數量的不同文章，也不是逐人閱讀紀錄。[Cloudflare SPA 偵測方式](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/)、[瀏覽器網址更新規範](https://html.spec.whatwg.org/multipage/nav-history-apis.html#shared-history-push/replace-state-steps)

## 找不到 hawks.tw 或看不到資料

先確認 Cloudflare 帳號與站點選擇是否正確。進入站點的 **Manage site** 查看安裝片段，與網站目前使用的 token 比對：

```text
430b038461df4770b3b0c08cea7572e6
```

這是會出現在網頁中的公開站點識別碼，不是 Cloudflare API token、帳號密碼或管理權限憑證。不可把 Cloudflare 的私人 API token 放進網站。

如果既有站點屬於另一個帳號，先取得正確帳號的存取權；歷史資料是否存在，必須在該帳號確認。若確定要建立新站點，在 Web Analytics 使用 **Add a site** 加入 `hawks.tw`，從 **Manage site** 取得新的公開 token，替換 [`CloudflareAnalytics.tsx`](../app/components/CloudflareAnalytics.tsx) 的 `analyticsToken`，提交後重新部署。新 token 不代表舊站點的歷史資料會自動轉移。[官方設定流程](https://developers.cloudflare.com/web-analytics/get-started/)

目前採手動嵌入 snippet。日後若讓網站經過 Cloudflare proxy，請維持手動安裝模式，或移除本專案的 snippet 後才改用自動注入；不要同時啟用兩種方式。保留官方的 `type="module"` 與 beacon URL，不另行呼叫接收端。[官方 FAQ](https://developers.cloudflare.com/web-analytics/faq/)

## 驗證方式

本機可以確認網站功能，但不應向正式分析服務送資料。正式站部署後，再確認完整流程：

1. 開啟瀏覽器開發者工具的 Network，清除舊紀錄，直接進入 `https://hawks.tw/`。確認 `beacon.min.js` 只建立一份載入，沒有重複 snippet。
2. 透過站內連結進入文章，再使用瀏覽器上一頁、下一頁；保留 Network 紀錄，觀察 `/cdn-cgi/rum` 的請求。手動安裝通常送往 `https://cloudflareinsights.com/cdn-cgi/rum`。
3. 切到另一個分頁，讓原頁面進入背景。部分品質資料及最後一個路由的資料會等到頁面隱藏時才送出；不要以每次點擊立即出現一個請求作為唯一判定。
4. 等待幾分鐘後，在 Dashboard 選擇包含這次測試的日期範圍，確認對應頁面有資料。若沒有，檢查帳號／token、阻擋擴充套件、網路請求與瀏覽器錯誤。
5. 回到 `localhost` 或其他預覽來源，確認沒有載入 beacon 或送出 RUM 請求；即使預覽的是正式建置輸出，也應保持停用。

Cloudflare 會依瀏覽器能力處理 SPA 導航，並可能在頁面離開或隱藏時補送資料。beacon 載入成功、請求被接收，以及 Dashboard 顯示資料是不同的驗證階段。[資料收集方式](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/)、[傳送時機 FAQ](https://developers.cloudflare.com/web-analytics/faq/)

## 隱私與資料範圍

Cloudflare 說明 RUM beacon 不讀寫 cookie、localStorage、sessionStorage 或 IndexedDB，資料以當前頁面的效能資訊為主。本站也不把匿名愛心的訪客金鑰、稍後閱讀清單或其他瀏覽器儲存內容交給分析服務。[RUM 隱私說明](https://developers.cloudflare.com/speed/observatory/rum-beacon/)

Cloudflare 官方表示 **不記錄 query strings**，以避免收集可能敏感的資訊。因此不要將這套服務當作站內搜尋詞或 UTM 參數的分析工具；這也不等於承諾所有網路資料都不會包含網址資訊。[官方 FAQ](https://developers.cloudflare.com/web-analytics/faq/)

它是瀏覽器端的流量與品質分析，不是完整的伺服器存取紀錄。廣告阻擋、停用 JavaScript、網路中斷等情況都可能缺少資料。它目前不提供 custom events，因此不會自動統計按愛心、收藏或分享按鈕的點擊；若啟用匿名愛心，共用總數由獨立的互動後端負責。[官方 FAQ](https://developers.cloudflare.com/web-analytics/faq/)

此文件不表示已連上 Cloudflare 帳號，也不宣稱已確認實際瀏覽量、歷史資料或 Dashboard 入帳。這些結果需要登入管理帳號後核對。
