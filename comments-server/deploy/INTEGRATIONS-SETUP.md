# 啟用 GitHub 登入與 Email 回覆通知

程式與留言介面已完成。正式 WSL 尚未設定 OAuth App 與 Resend，兩項功能先顯示暫不可用；匿名留言與文章回覆正常運作。完成設定後重啟後端並重新整理網站即可啟用，不需修改網站公開 build variables。

## 1. GitHub OAuth App

在你的 GitHub 帳號開啟 [New OAuth App](https://github.com/settings/applications/new)：

| 欄位 | 值 |
| --- | --- |
| Application name | `Hawks 留言區` |
| Homepage URL | `https://hawks.tw` |
| Authorization callback URL | `https://hawks-comments.sean-hawks.workers.dev/v1/comments/auth/github/callback` |

建立後取得 **Client ID**，產生 **Client Secret**，稍後只填入 WSL 私密 `.env`。Secret 不要貼到聊天室或 repository。登入只讀取 GitHub 公開帳號資料，不請求 repository 或私人信箱權限。

流程使用 OAuth state 與 S256 PKCE。GitHub access token 不保存到 SQLite 或交給網站。網站取得獨立、可登出的 7 天 session，存在分頁 sessionStorage，不依賴跨站 Cookie。依 [GitHub 官方流程](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)。

## 2. Resend 寄信網域

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

GitHub ID／Secret、Resend API Key／寄件者各自須成對填寫，也可先只啟用其中一項。儲存後：

```sh
chmod 600 .env
systemctl --user restart hawks-comments
systemctl --user is-active hawks-comments
curl -fsS -A 'Mozilla/5.0' https://hawks-comments.sean-hawks.workers.dev/v1/comments/config
```

兩項都啟用時應回傳 `{"githubEnabled":true,"emailEnabled":true}`。這個公開端點只回傳啟用狀態，不回傳密鑰。

## 4. 實際確認

1. 重新整理 [留言區](https://hawks.tw/#comments)，點 GitHub 登入，授權後確認顯示自己的 `@帳號`。「登出，改用匿名」可撤銷網站 session。
2. 在討論串填寫自己的 Email 並送出留言。收到確認信後開連結，再按「確認訂閱」。只有開啟連結不會訂閱，避免郵件掃描器改變設定。
3. 由另一位使用者在**同一串**回覆，確認收到通知；另開討論串不應寄送這一串的通知。
4. 開信中的取消連結並按「取消訂閱」，確認後續新回覆不再通知。

Email 不出現在公開 API、留言或頭像網址；GitHub 帳號與頭像會公開顯示。確認連結有效 48 小時，單一信箱每小時最多 3 封確認信。通知以根留言分串，包含巢狀回覆；不通知回覆者本人填寫的同一信箱／GitHub 身份。

SQLite 保留訂閱與待寄資料，取消訂閱會移除該訂閱與相關寄信紀錄。寄送完成的 outbox 清空信件內容，7 天後清理紀錄。已寄出的通知無法隨刪除留言撤回；尚未寄送的已刪除回覆會略過。

目前 HTTP 測試使用假的 GitHub、Resend 回應，不會向真人寄信。真實授權、寄信與到達信箱的測試，需完成上述帳號設定後才能執行。
