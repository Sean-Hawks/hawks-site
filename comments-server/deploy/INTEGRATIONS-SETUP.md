# 啟用 GitHub 登入與 Email 回覆通知

程式與留言介面已完成。正式 WSL 已啟用 GitHub OAuth 與自架 Postfix Email 通知；Resend 是可選的替代方案。設定後重啟後端並重新整理網站即可啟用，不需修改網站公開 build variables。

## 1. GitHub OAuth App

在你的 GitHub 帳號開啟 [New OAuth App](https://github.com/settings/applications/new)：

| 欄位 | 值 |
| --- | --- |
| Application name | `Hawks 留言區` |
| Homepage URL | `https://hawks.tw` |
| Authorization callback URL | `https://hawks-comments.sean-hawks.workers.dev/v1/comments/auth/github/callback` |

建立後取得 **Client ID**，產生 **Client Secret**，稍後只填入 WSL 私密 `.env`。Secret 不要貼到聊天室或 repository。登入只讀取 GitHub 公開帳號資料，不請求 repository 或私人信箱權限。

流程使用 OAuth state 與 S256 PKCE。GitHub access token 不保存到 SQLite 或交給網站。網站取得獨立、可登出的 7 天 session，存在分頁 sessionStorage，不依賴跨站 Cookie。依 [GitHub 官方流程](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)。

## 2. WSL 自架寄信（目前使用）

現有 WSL 已有 Postfix 與 Rspamd，`hawks.tw` 的 SPF、DKIM、DMARC 與 `mail.hawks.tw` DNS 已設定。留言使用新增的本機 relay，不需要 Resend：

```dotenv
COMMENTS_MAIL_TRANSPORT=smtp
COMMENTS_MAIL_FROM="Hawks <comments@hawks.tw>"
COMMENTS_SMTP_HOST=127.0.0.1
COMMENTS_SMTP_PORT=2526
COMMENTS_SMTP_LOCAL_ADDRESS=127.2.4.7
COMMENTS_MAIL_DAILY_LIMIT=100
```

此入口只綁定 loopback，僅接受來源 `127.2.4.7`、寄件者 `comments@hawks.tw`，不開放公網或匿名轉寄。應用程式與 Postfix 之間使用本機 SMTP，Postfix 向外投遞時使用既有 TLS 設定，Rspamd 使用已發布的 `mail202609` DKIM selector 簽章。詳見 [Postfix 設定](https://www.postfix.org/BASIC_CONFIGURATION_README.html)、[Rspamd DKIM](https://docs.rspamd.com/modules/dkim_signing/)、[Nodemailer SMTP](https://nodemailer.com/smtp)。

既有 mail server 的重建步驟（需要先安裝及設定 Postfix、Rspamd 和相符的 DKIM key；腳本不會建立新私鑰）：

```sh
cd ~/apps/hawks-comments
sudo python3 deploy/configure-comments-postfix.py
```

SMTP 接受信件表示已進入 Postfix 佇列，仍需投遞到收件者 MX；`status=sent` 在 SMTP 模式表示 Postfix 已接受，不能當成已到收件匣。外部投遞失敗由 Postfix 的佇列重試與退信處理。SMTP 沒有 Resend 的 idempotency API；重試保留 Message-ID 與 Date，但在 SMTP 確認結果不明／接受後程序中斷時，仍可能重複寄送。預設每 24 小時最多 100 次應用程式投遞嘗試，含重試。

已確認本機 SMTP、DKIM 簽章及公開 DNS 驗證，也已寄到使用者提供的 Gmail 測試信箱。收件端確認 SPF、DKIM、DMARC 全部 PASS 與 TLS 1.3，但信件進入垃圾郵件匣。若更換公開 IP，須同步調整 SPF、mail 的 A 記錄及反向 DNS；收件端也可能因 IP 信譽或內容拒收／歸入垃圾郵件。Gmail 基本寄件需求見 [官方說明](https://support.google.com/mail/answer/81126)。

目前 IP 查到 Spamhaus PBL（HiNet DNS 查詢回傳 `127.0.0.11`，即 Spamhaus 維護的 PBL）；這是寄信政策名單，不能解讀為主機已被判定寄垃圾信。是否為固定 IP 尚待使用者確認。若是配給你的固定 IP，且郵件伺服器、正反向 DNS 等條件符合，可到 [官方查詢頁](https://check.spamhaus.org/query/ip/114.32.161.42) 查看排除步驟；申請確認信需要可收信、符合 mail server 網域的信箱，Gmail 等免費信箱不能用於 PBL 排除。若為浮動 IP，官方建議透過 ISP 寄信 relay。見 [PBL 官方條件](https://www.spamhaus.org/faqs/policy-blocklist-pbl/)。名單排除不保證 Gmail 收件匣分類；不要把三項驗證 PASS 或 SMTP 成功當成送達率已解決。

### Resend（替代方案）

登入 [Resend](https://resend.com/domains)，建立寄信網域 **`mail.hawks.tw`**。在管理 `hawks.tw` DNS 的 Gandi 加入 Resend 畫面提供的 DNS 記錄，再按 Verify，等狀態變成 **Verified**。使用畫面上的實際值，不需要變更 nameservers。依 [Resend 網域驗證指南](https://resend.com/docs/dashboard/domains/introduction)。

建立僅有 **Sending access**、限制在 `mail.hawks.tw` 的 API Key。寄件者建議 `Hawks <comments@mail.hawks.tw>`。API Key 也只填進 WSL `.env`。程式使用 [Resend Send Email API](https://resend.com/docs/api-reference/emails/send-email)，無需額外 npm 套件。

寄信 API 有失敗重試與持久化 idempotency key；預設每 24 小時最多 100 次 API 嘗試，含重試。實際寄送仍受 Resend 帳號方案、網域及收件端狀態影響。

## 3. 在 WSL 填入設定

Windows PowerShell：

```powershell
wsl -d Ubuntu-24.04 -u sean8
```

進入 WSL 後：

```sh
cd ~/apps/hawks-comments
nano .env
```

保留既有 Turnstile 與管理 token，填入以下設定（尖括號內文字須替換）：

```dotenv
COMMENTS_PUBLIC_API_URL=https://hawks-comments.sean-hawks.workers.dev
COMMENTS_SITE_ORIGIN=https://hawks.tw
COMMENTS_GITHUB_CLIENT_ID=<OAuth App Client ID>
COMMENTS_GITHUB_CLIENT_SECRET=<OAuth App Client Secret>
COMMENTS_RESEND_API_KEY=<Resend Sending API Key>
COMMENTS_MAIL_FROM="Hawks <comments@mail.hawks.tw>"
COMMENTS_MAIL_DAILY_LIMIT=100
```

上面是 Resend 替代方案：選用時另設 `COMMENTS_MAIL_TRANSPORT=resend`，API Key／寄件者須成對填寫。自架 SMTP 使用第 2 節的設定，`COMMENTS_RESEND_API_KEY` 可留空。GitHub ID／Secret 須成對填寫，也可先只啟用其中一項。儲存後：

```sh
chmod 600 .env
systemctl --user restart hawks-comments
systemctl --user is-active hawks-comments
curl -fsS -A 'Mozilla/5.0' https://hawks-comments.sean-hawks.workers.dev/v1/comments/config
```

兩項都啟用時應回傳 `{"githubEnabled":true,"emailEnabled":true}`。這個公開端點只回傳啟用狀態，不回傳密鑰。

## 4. 實際確認

1. 重新整理 [留言區](https://hawks.tw/#comments)，點 GitHub 登入，授權後確認顯示自己的 `@帳號`。「登出，改用匿名」可撤銷網站 session。
2. 勾選「接收此討論串的回覆通知」，填寫自己的 Email 並送出留言。第一次收到確認信後開連結，再按「確認訂閱」。使用 GitHub 登入時，確認頁會顯示綁定的帳號與信箱，確認一次後，同一帳號可在其他討論串沿用該信箱；未勾選通知的留言不會訂閱。只有開啟連結不會訂閱或驗證帳號信箱，避免郵件掃描器改變設定。
3. 由另一位使用者在**同一串**回覆，確認收到通知；另開討論串不應寄送這一串的通知。
4. 開信中的取消連結並按「取消訂閱」，確認後續新回覆不再通知。
5. 使用同一 GitHub 帳號在另一個討論串勾選通知，應直接顯示已訂閱、不再收到確認信。匿名留言、不同 GitHub 帳號或未驗證的其他信箱不能借用這個驗證。
6. 表單的「管理通知信箱 → 移除信箱並取消所有通知」可取消此 GitHub 帳號的全部討論串通知，並移除信箱驗證紀錄。之後使用該信箱要重新確認。這項操作需要有效的登入 session，不能以匿名或其他帳號移除你的信箱。

Email 不出現在公開 API、留言或頭像網址；GitHub 帳號與頭像會公開顯示。確認連結有效 48 小時，單一信箱每小時最多 3 封確認信。通知以根留言分串，包含巢狀回覆；不通知回覆者本人填寫的同一信箱／GitHub 身份。

SQLite 保留訂閱與待寄資料，取消單串訂閱會移除該訂閱與相關寄信紀錄；GitHub 帳號的信箱驗證紀錄保留供其他討論串沿用，直到你在管理通知信箱中移除。信箱只出現在帶有效 session 的私人登入回應，公開留言、設定與頭像 URL 均不包含 Email。寄送完成的 outbox 清空信件內容，7 天後清理紀錄。已寄出的通知無法隨刪除留言撤回；尚未寄送的已刪除回覆會略過。

HTTP 測試使用假的 GitHub、Resend 回應及本機 SMTP 測試伺服器，不會向真人寄信。Mac 與 WSL 的 37 項後端測試涵蓋帳號信箱驗證、跨討論串沿用、未選通知不訂閱、他人不能借用驗證、移除信箱會取消待寄通知、逾期與重複登出。正式環境已確認 `@Sean-Hawks` 的真實 GitHub 授權及文章留言成功，確認信實際投遞到 `me@hawks.tw` 並由 IMAP 讀回。2026-10-08 使用者重新開啟確認頁後完成訂閱，正式資料庫的訂閱與帳號信箱驗證皆已生效；正式網站的匿名回覆操作仍待人工確認；另以 WSL 隔離 SQLite 經留言 API 建立訂閱、POST 確認、再新增匿名回覆，由實際 Postfix 投遞到 `me@hawks.tw`，已從 IMAP 讀回通知（UID 9、主旨「你的 Hawks 討論串有新回覆」）。這次隔離測試沒有更動正式留言資料庫，並非正式瀏覽器操作驗證。

WSL 額外使用真實 Postfix hold 佇列驗證 DKIM，該測試信已刪除、未對外投遞。另經使用者提供測試收件信箱授權，單次寄出外部測試信，已確認 Gmail 到信與三項驗證 PASS，但進入垃圾郵件匣。

前端的 9 項流程測試包含 8 項真實 React DOM 操作測試，替代 Next 路由及測試 API 回應，另有草稿解析測試。範圍涵蓋登入恢復前禁止送出、暫時斷線不默默切匿名、明確切匿名、登出清除通知選項、草稿與回覆對象恢復、逾時重試沿用 request ID、暱稱及通知選項恢復。草稿只存於目前分頁的 sessionStorage（包括主動填寫的通知選項，不含登入 token），送出成功即清除；關閉分頁也會清除。

確認連結在原本 48 小時有效期內重複開啟或重送表單，會顯示「已確認訂閱」，不再次變更設定；首次確認仍須 POST。失效連結顯示 HTML 說明及返回網站入口。瀏覽器控制逾時，尚未完成新版手機畫面與 GitHub 授權視窗的人工操作驗證。

「你的網站」為選填公開資料，接受完整 HTTP(S) URL 或自動補上 HTTPS 的網域；留言者名稱連至該網站。前後端共用 `shared/author-website.mjs`，拒絕不支援的協定、帳密及超長網址；連結使用 `ugc nofollow noopener noreferrer`。網站隨分頁草稿保留，加入 request ID 的內容比對，刪除留言時也會清除。舊版 `website` 蜜罐欄位與公開的 `authorWebsite` 分開，避免合法網站留言被判為機器人。
