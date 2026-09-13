# 搬到 WSL

使用 Node.js 22.12 以上。建議將專案放在 WSL 的 Linux 家目錄，避免放在 `/mnt/c`；照片處理的 sharp 必須在 Linux 重新安裝，不能複製 Mac 的 node_modules。

## 搬移資料

1. 在 Mac 的 agent 目錄執行 `npm run background:stop`，確認舊程序已停止。
2. 複製 agent 程式、`.env` 與完整 `.data/` 到 WSL。`.data/media` 是草稿照片、`.data/channel-writing` 是訊息映射、`.data/deployments` 是待完成的部署通知，缺任何一項都可能丟失寫作狀態。不要把憑證與草稿加入 Git。
3. 在 WSL 的 agent 目錄執行：

```sh
npm ci
chmod 600 .env
npm test
npm start
```

`.env` 的 `AGENT_DATA_DIR=.data` 可保持不變；不要填 Mac 的絕對路徑。此 bot 用 Gateway 收指令，Developer Portal 的 Interactions Endpoint URL 保持空白，Message Content Intent 保持啟用。不需要架設公網 HTTP endpoint。

如果 Discord application 與伺服器沒有改，不必重新註冊指令。`DISCORD_GUILD_ID`、`DISCORD_BLOG_CHANNEL_ID` 與 `DISCORD_OWNER_IDS` 原樣搬移即可。GitHub token 需對網站 repository 有 Contents 讀寫與 Actions 讀取權限。

## 使用 Docker Compose（可選）

從 agent 目錄執行，先確定 `.data` 可由容器中的 node 使用者（UID 1000）讀寫：

```sh
mkdir -p .data
# 僅在備份完成、確認這是 bot 資料目錄後調整擁有者：
sudo chown -R 1000:1000 .data
docker compose up -d --build
docker compose logs --tail=50 -f
```

`.env` 與 `.data` 不會打包進 Docker image；照片與草稿使用 `.data` 掛載。停止：`docker compose down`。不要同時執行 npm start 與容器。

## 使用 systemd（可選）

若 WSL 已啟用 systemd，可把 `hawks-blog.service.example` 複製到 `~/.config/systemd/user/hawks-blog.service`，將 `YOUR_USER`、工作目錄及 `/usr/bin/node` 改成實際位置（用 `command -v node` 查詢）。然後執行：

```sh
systemctl --user daemon-reload
systemctl --user enable --now hawks-blog
journalctl --user -u hawks-blog -f
```

使用者服務是否能在未登入時啟動取決於 WSL／systemd 的 linger 設定。Windows 關機、睡眠或 WSL 被停止時 bot 仍會離線，容器也不例外。

## 簡單備份

停掉 bot 後，在 agent 目錄執行 `tar -czf ../hawks-blog-data-backup.tar.gz .data`，並把備份放在另一個磁碟／主機。`.env` 請另外以私密方式保管。復原前停止 bot，還原整個 `.data` 後再啟動；同一份資料與 token 同時只運行一個實例。

Docker 和 systemd 範本尚未在你的 WSL 主機實際驗證；搬移後先用 npm start 確認上線及指令正常，再選一種背景執行方式。
