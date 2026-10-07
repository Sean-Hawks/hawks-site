# 留言服務的目前主機

2026-10-07（Asia/Taipei）部署。

- SSH：`ssh hawks-wsl`（sean8，Tailscale 100.122.23.119，port 2222）
- WSL：Windows Hawks-PC 的 Ubuntu-24.04（WSL 2、systemd）
- 程式：`/home/sean8/apps/hawks-comments`
- Node：`/home/sean8/.local/opt/hawks-agent-node/bin/node`（22.23.2）
- 服務：systemd user `hawks-comments.service`，enabled，user linger 已啟用
- SQLite：`/home/sean8/apps/hawks-comments/.data/comments.sqlite`
- 私密設定：`/home/sean8/apps/hawks-comments/.env`（0600，不印出、不提交）
- 公開 API：`https://hawks-comments.sean-hawks.workers.dev`
- HTTPS：Cloudflare Worker → VPC Service → WSL named Tunnel → `http://127.0.0.1:8790`
- Tunnel：`hawks-comments-wsl`（`e9c83f06-1ca4-4c61-9a95-11afa34df6f2`）
- VPC Service：`01a11228-dc31-70f3-9d8f-f3d316b296c5`，HTTP loopback port 8790
- cloudflared：`/usr/local/bin/cloudflared`（2026.10.0），`hawks-comments-tunnel.service` enabled
- Tunnel token：`/etc/hawks-comments/tunnel-token`（root 0600）
- Proxy trust：`COMMENTS_PROXY=cloudflare`；只經 gateway 提供公開入口
- Turnstile：Cloudflare widget `hawks.tw comments`，managed，hostname `hawks.tw`，action `comment`

```sh
ssh hawks-wsl 'systemctl --user status hawks-comments --no-pager'
ssh hawks-wsl 'systemctl --user restart hawks-comments'
ssh hawks-wsl 'sudo systemctl status hawks-comments-tunnel --no-pager'
curl -fsS -A 'Mozilla/5.0' https://hawks-comments.sean-hawks.workers.dev/healthz
```

Tailscale Funnel 曾啟用，但公開 DNS 持續 NXDOMAIN；留言新增的 port 10000 已移除，既有其他代理未改動。

## GitHub 與 Email 設定

程式與資料庫 migration 已支援 GitHub OAuth、獨立分頁 session、Email 雙重確認、回覆通知與取消訂閱。正式環境已設定 OAuth App，Email 依使用者要求改為 WSL 自架 SMTP，不需要 Resend 帳號或 API Key。`/v1/comments/config` 回傳兩項皆 true。啟用操作見 [INTEGRATIONS-SETUP.md](INTEGRATIONS-SETUP.md)。

- 既有 Postfix／Rspamd 保留原本的收信、轉寄與 submission 設定。
- 新增留言專用 SMTP：`127.0.0.1:2526`，僅接受來源 `127.2.4.7/32`、寄件者 `comments@hawks.tw`；不公開此埠。
- 前端 → WSL 通知佇列 → Nodemailer → 本機 Postfix → 收件者 MX。寄件者為 `Hawks <comments@hawks.tw>`。
- 既有 Rspamd 為來源 `127.2.4.7` 簽署 DKIM，domain `hawks.tw`、selector `mail202609`，私鑰留在原本的 Rspamd 路徑。
- 現有公開 IP `114.32.161.42` 已列入 `hawks.tw` SPF，`mail.hawks.tw` 指向該 IP，PTR 及對應 A 記錄一致，DMARC 已發布。
- 發現 `postfix@-.service` 曾於開機失敗；已恢復服務，新增依賴 tailscaled 的啟動順序與每 15 秒失敗重啟。
- 設定腳本：[configure-comments-postfix.py](configure-comments-postfix.py)。修改前備份在 `/etc/hawks-comments/mail-backups/`（root 私密目錄）。
- Mac 與 WSL 的 31 項測試通過。WSL 真實 SMTP 測試信在 hold 佇列檢查 DKIM，再由 Rspamd 對公開 DNS 驗證，得到 `R_DKIM_ALLOW`，已移除測試信與 hold 規則，未對外投遞。
- 使用者提供的 Gmail 測試信箱已收到真實外部測試信；Gmail 回覆 `250 2.0.0 OK`，收件端原始郵件確認 SPF、DKIM、DMARC 全部 PASS，使用 TLS 1.3，但歸入垃圾郵件。GitHub 實際授權仍未驗證。
- 對目前 IP 的 Spamhaus ZEN 查詢（透過 HiNet DNS）回傳 `127.0.0.11`，TXT 指向 PBL 查詢頁：Spamhaus 維護的 PBL。先前透過公共 resolver 得到的 `127.255.255.254` 是查詢錯誤，不能當成名單結果。
- PBL 是一般用戶網段直接寄信的政策名單，不代表主機正在寄垃圾信。它可能影響收件端評分，但沒有證據能斷定 Gmail 本次分類的唯一原因。是否為配給此用戶的固定 IP 尚待確認；只有符合固定 IP、自有郵件伺服器、正反向 DNS 等條件才適合申請排除，且移除後仍不保證進入收件匣。見 [Spamhaus PBL 條件](https://www.spamhaus.org/faqs/policy-blocklist-pbl/)。

## Windows／WSL 常駐

已備份並更新既有啟動腳本：
`C:\Users\sean8\Documents\Codex\2026-06-13\wsl-2-windows-subsystem-for-linux\outputs\start-wsl-tailscale.ps1`

舊版只啟動 tailscaled 後結束；新版內容見 [wsl-keep-alive.ps1](wsl-keep-alive.ps1)。既有兩個排程名稱為 `Start WSL Ubuntu Tailscale`（開機）與 `Start WSL Ubuntu Tailscale at Logon`（登入）。同時啟動時用全域 mutex 保持一個實例。

Windows 管理員修正腳本已放在：
`C:\Users\sean8\AppData\Local\Hawks\repair-wsl-startup.ps1`

已由使用者在管理員 PowerShell 執行修正腳本並核對：兩個排程的執行時限皆為 `PT0S`（無限制），失敗重試 3 次；開機排程改用 S4U 本機登入（不儲存密碼），狀態為 Running，WSL 的 `/bin/sleep infinity` 正在執行。Windows Tailscale `ForceDaemon=true`（unattended）。既有排程與啟動腳本皆有備份。未測試 Windows 重開機；不要以目前程序正在執行推定重開機驗證通過。

已核對 `hawks-wsl` 與 `Hawks-PC` 的 `KeyExpiry=null`，兩台裝置的金鑰到期已停用。管理網頁的登入期限不能藉此延長。Windows 睡眠／關機仍會讓 WSL 與留言 API 離線。

## 自架收信信箱

使用者要求將 `me@hawks.tw` 由轉址改為 WSL 實際信箱，並確認沒有其他轉址地址。已驗證既有 Dovecot 虛擬使用者、Maildir 儲存、IMAP 993、SMTP 587 STARTTLS 與 DKIM 簽署的本機投遞；從 Mac 連線也通過憑證驗證及登入。

Windows SMTP 代理已完成並測試接受自有收件者、拒絕未知地址與外部 relay，兩個安裝腳本已放到 `%LOCALAPPDATA%\Hawks`，臨時測試程序已停止。Windows 管理員常駐安裝、路由器手動 TCP 25 轉送與 Gandi MX 切換尚未完成。公開 TCP 25 目前不能連入；MX 仍指向 Gandi，不能宣稱外部收信已完成。操作與回復見 [MAILBOX-SETUP.md](MAILBOX-SETUP.md)。
