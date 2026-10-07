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

程式與資料庫 migration 已支援 GitHub OAuth、獨立分頁 session、Email 雙重確認、回覆通知與取消訂閱。正式環境未設定 OAuth App 或 Resend 憑證，`/v1/comments/config` 目前回傳兩項皆 false，介面明確顯示暫不可用。依使用者要求先完成程式與設定步驟；啟用操作見 [INTEGRATIONS-SETUP.md](INTEGRATIONS-SETUP.md)。測試使用假的 provider 回應，未進行真實 GitHub 授權或寄信。

## Windows／WSL 常駐

已備份並更新既有啟動腳本：
`C:\Users\sean8\Documents\Codex\2026-06-13\wsl-2-windows-subsystem-for-linux\outputs\start-wsl-tailscale.ps1`

舊版只啟動 tailscaled 後結束；新版內容見 [wsl-keep-alive.ps1](wsl-keep-alive.ps1)。既有兩個排程名稱為 `Start WSL Ubuntu Tailscale`（開機）與 `Start WSL Ubuntu Tailscale at Logon`（登入）。同時啟動時用全域 mutex 保持一個實例。

Windows 管理員修正腳本已放在：
`C:\Users\sean8\AppData\Local\Hawks\repair-wsl-startup.ps1`

已由使用者在管理員 PowerShell 執行修正腳本並核對：兩個排程的執行時限皆為 `PT0S`（無限制），失敗重試 3 次；開機排程改用 S4U 本機登入（不儲存密碼），狀態為 Running，WSL 的 `/bin/sleep infinity` 正在執行。Windows Tailscale `ForceDaemon=true`（unattended）。既有排程與啟動腳本皆有備份。未測試 Windows 重開機；不要以目前程序正在執行推定重開機驗證通過。

已核對 `hawks-wsl` 與 `Hawks-PC` 的 `KeyExpiry=null`，兩台裝置的金鑰到期已停用。管理網頁的登入期限不能藉此延長。Windows 睡眠／關機仍會讓 WSL 與留言 API 離線。
