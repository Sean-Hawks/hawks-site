# 留言服務的目前主機

2026-10-07（Asia/Taipei）部署。

- SSH：`ssh hawks-wsl`（sean8，Tailscale 100.122.23.119，port 2222）
- WSL：Windows Hawks-PC 的 Ubuntu-24.04（WSL 2、systemd）
- 程式：`/home/sean8/apps/hawks-comments`
- Node：`/home/sean8/.local/opt/hawks-agent-node/bin/node`（22.23.2）
- 服務：systemd user `hawks-comments.service`，enabled，user linger 已啟用
- SQLite：`/home/sean8/apps/hawks-comments/.data/comments.sqlite`
- 私密設定：`/home/sean8/apps/hawks-comments/.env`（0600，不印出、不提交）
- 公開 API：`https://hawks-wsl.tail5bdb5f.ts.net:10000`
- HTTPS：Tailscale Funnel port 10000 → `http://127.0.0.1:8790`
- Turnstile：Cloudflare widget `hawks.tw comments`，managed，hostname `hawks.tw`，action `comment`

```sh
ssh hawks-wsl 'systemctl --user status hawks-comments --no-pager'
ssh hawks-wsl 'systemctl --user restart hawks-comments'
curl -fsS https://hawks-wsl.tail5bdb5f.ts.net:10000/healthz
```

## Windows／WSL 常駐

已備份並更新既有啟動腳本：
`C:\Users\sean8\Documents\Codex\2026-06-13\wsl-2-windows-subsystem-for-linux\outputs\start-wsl-tailscale.ps1`

舊版只啟動 tailscaled 後結束；新版內容見 [wsl-keep-alive.ps1](wsl-keep-alive.ps1)。既有兩個排程名稱為 `Start WSL Ubuntu Tailscale`（開機）與 `Start WSL Ubuntu Tailscale at Logon`（登入）。同時啟動時用全域 mutex 保持一個實例。

Windows 管理員修正腳本已放在：
`C:\Users\sean8\AppData\Local\Hawks\repair-wsl-startup.ps1`

腳本會備份排程、將執行時限改為無限制、失敗重試 3 次，啟用 Windows Tailscale unattended 模式，並啟動開機排程。目前透過 WSL 執行的 Windows 程序沒有管理員權限，尚需在管理員 PowerShell 執行後驗證。未測試 Windows 重開機；不要以部署完成推定重開機驗證通過。

Tailscale 裝置金鑰到期仍需在管理頁停用。管理網頁的登入期限不能藉此延長。Windows 睡眠／關機仍會讓 WSL 與留言 API 離線。
