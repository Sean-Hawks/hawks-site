# Hawks 留言服務

參考 [emtech.cc 的留言架構](https://emtech.cc/p/emtech-2026/)：靜態網站搭配獨立互動 API。這裡使用 WSL 上的 Node.js HTTP 服務與 SQLite，網站繼續由 GitHub Pages 提供。實際主機與啟動設定見 [目前部署](deploy/WSL-CURRENT.md)。

已支援匿名／暱稱、首頁與每篇文章各自的討論串、巢狀回覆、較早留言分頁、送出重試去重、Turnstile 後端驗證、IP 速率限制與管理員刪除。首頁兩種 GUI、Blog、Talk、Library 詳頁都使用同一個留言元件。

這一版未提供 GitHub OAuth、Email／Gravatar、通知、審核佇列或圖片上傳。暱稱不是已驗證身分；文字會直接公開。訊息以純文字顯示，不解譯 HTML 或 Markdown。留言列表在進入頁面、按「重新整理」時讀取，送出後立即顯示自己的留言。

## 本機預覽

需要 Node.js **22.13 以上**（使用內建 `node:sqlite`），無額外套件依賴。與網站、Discord bot 分開執行。

```sh
cd comments-server
npm ci
COMMENTS_ALLOW_UNVERIFIED=true \
COMMENTS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000 \
COMMENTS_DATA_DIR=.data \
npm start
```

另一個終端在網站根目錄執行：

```sh
NEXT_PUBLIC_COMMENTS_API_URL=http://127.0.0.1:8790 npm run dev
```

首頁底部及文章底部會顯示留言表單。開發時 `NEXT_PUBLIC_COMMENTS_TURNSTILE_SITE_KEY` 留空；若使用其他開發埠，需同步改 `COMMENTS_ORIGINS`。只有 localhost origin 可使用未驗證模式，正式環境請設定真正的 Turnstile key。未設定 API URL 時顯示「留言區準備中」，不發出請求。

## WSL：systemd 部署

已獨立部署在 `/home/sean8/apps/hawks-comments`，使用 `hawks-comments.service`；與 `/home/sean8/apps/hawks-agent` 的資料及服務分開。2026-10-07 確認 Ubuntu-24.04 原先為 Stopped，從 Windows 啟動後已恢復 SSH、Tailscale 與 bot。Node 為 `/home/sean8/.local/opt/hawks-agent-node/bin/node`（22.23.2），遠端留言測試 9 項通過。以下步驟供重新部署使用。

把本資料夾的程式碼帶到 WSL，**不複製本機 `.env`、`.data` 或 node_modules**；以下指令在 WSL 上執行：

```sh
cd ~/apps/hawks-comments
node --version
npm ci
npm test
cp .env.example .env
chmod 600 .env
```

以編輯器設定 `.env`：

```dotenv
COMMENTS_HOST=127.0.0.1
COMMENTS_PORT=8790
COMMENTS_DATA_DIR=.data
COMMENTS_ORIGINS=https://hawks.tw
COMMENTS_PROXY=tailscale
COMMENTS_TURNSTILE_SECRET=填入私密的 Turnstile secret key
COMMENTS_TURNSTILE_HOSTNAMES=hawks.tw
COMMENTS_ALLOW_UNVERIFIED=false
COMMENTS_ADMIN_TOKEN=填入隨機的 32-byte token
```

管理 token 可用 `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` 在 WSL 本機產生，填入私人的 `.env`；不要放進網站的 NEXT_PUBLIC 變數。Turnstile 必須驗證 `hostname=hawks.tw` 與 `action=comment`。若正式網站有其他 origin／hostname，明確加入兩個允許清單。

先 `npm start`，用另一個 WSL 終端 `curl -fsS http://127.0.0.1:8790/healthz` 確認 `{"ok":true}`，停止前景程序後才啟用服務：

```sh
mkdir -p ~/.config/systemd/user
cp deploy/hawks-comments.service.example ~/.config/systemd/user/hawks-comments.service
```

修改 service 的 `YOUR_USER`、`WorkingDirectory`、`ExecStart`。`ExecStart` 的 node 必須是 `command -v node` 的絕對路徑，版本須 >=22.13；既有 agent 有獨立 Node 路徑，只有版本符合時才能共用。然後：

```sh
systemctl --user daemon-reload
systemctl --user enable --now hawks-comments
systemctl --user status hawks-comments --no-pager
journalctl --user -u hawks-comments -n 50 --no-pager
```

## HTTPS：Tailscale Funnel（目前使用）

`hawks.tw` 的 DNS 使用 Gandi，目前未加入 Cloudflare 網域；因此採用既有 Tailscale Funnel 提供公開 HTTPS：

```sh
sudo tailscale funnel --bg --https=10000 --yes http://127.0.0.1:8790
```

API origin 是 **`https://hawks-wsl.tail5bdb5f.ts.net:10000`**，`/healthz` 已驗證回傳 `{"ok":true}`。此入口對一般網路訪客開放，不需要安裝 Tailscale。既有 443、9443、10443 的代理保持原設定。

服務綁定 `127.0.0.1:8790`，設定 `COMMENTS_PROXY=tailscale`。此模式只接受從 loopback 連入的代理，並使用 Tailscale Serve 覆寫的單一 `X-Forwarded-For` IP 進行限流；不接受訪客自行提供的 IP 清單。原生部署使用這個模式；Docker bridge 下請採用下方 Cloudflare Tunnel 方案，避免把非 loopback 的 Docker 網路當作可信 Tailscale 代理。

Cloudflare Turnstile widget 為 `hawks.tw comments`，採 managed 模式，只允許 `hawks.tw`。secret 只存遠端私人的 `.env`。GitHub Actions 需設定以下兩個公開 repository variables，並重新建置網站：

| Repository variable | 值 |
| --- | --- |
| `NEXT_PUBLIC_COMMENTS_API_URL` | `https://hawks-wsl.tail5bdb5f.ts.net:10000` |
| `NEXT_PUBLIC_COMMENTS_TURNSTILE_SITE_KEY` | widget 的公開 site key |

## HTTPS：Cloudflare Tunnel（替代方案）

此方案需要 Cloudflare 上的網域。在 WSL 安裝並啟動 `cloudflared`，依 [Cloudflare 官方的遠端 Tunnel 指南](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/get-started/create-remote-tunnel/)建立常駐 Tunnel，公開 hostname 可使用 **`comments.hawks.tw`**，service 指向 **`http://127.0.0.1:8790`**。此 hostname 尚未建立 DNS 或 Tunnel。

不需把 8790 開放到公網或設定路由器轉送。服務綁在 loopback，只透過 Tunnel 提供公網入口；只有這種架構才設定 `COMMENTS_PROXY=cloudflare`，依 Cloudflare 提供的 `CF-Connecting-IP` 分別限制訪客。其他代理設定 `none` 時會依 socket IP 限流，所有訪客可能共享代理 IP 的配額。避免直接暴露相信代理 header 的服務。

確認 HTTPS 的 `/healthz` 可讀，再在 GitHub repository 的 **Settings → Secrets and variables → Actions → Variables** 設定：

| Repository variable | 值 |
| --- | --- |
| `NEXT_PUBLIC_COMMENTS_API_URL` | `https://comments.hawks.tw`，或實際 API origin |
| `NEXT_PUBLIC_COMMENTS_TURNSTILE_SITE_KEY` | 允許 `hawks.tw` 的公開 Turnstile site key |

網站 workflow 已讀取這兩個變數；必須重新建置部署網站才會生效。Turnstile secret、管理 token 只放在 WSL。設定缺失時服務拒絕啟動／送出；不會自動略過正式環境驗證。正式驗證流程依 [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。

WSL／Windows 睡眠、關機會使留言服務離線，網站本身仍可閱讀。systemd 的自動重啟只在 WSL 正在執行時生效；systemd 本身不會保持 WSL VM 執行。Windows 的啟動排程使用 [wsl-keep-alive.ps1](deploy/wsl-keep-alive.ps1) 持續執行 `wsl.exe ... /bin/sleep infinity`，WSL 被手動停止時會在 15 秒後重新啟動。排程的 72 小時上限與 Windows Tailscale unattended 模式需由管理員執行 [repair-wsl-startup.ps1](deploy/repair-wsl-startup.ps1) 修正。若要停機維護，先停止兩個 Windows 啟動排程。裝置不需定期重新登入的設定是 Tailscale 管理頁的 Disable key expiry，與 VM 常駐、管理網頁登入期限各自獨立。

## Docker Compose（替代 systemd）

使用同一份正式 `.env`，在 WSL 的 comments-server 目錄執行：

```sh
docker compose up -d --build
docker compose ps
docker compose logs --tail=50
```

SQLite 存在 `comments-data` named volume；8790 只發布到主機 loopback。Cloudflare Tunnel 仍指向主機的 `127.0.0.1:8790`，設定 `COMMENTS_PROXY=cloudflare`。不要同時啟動 systemd 和 Compose。Docker image 已在本機 Linux 容器（Node 22）驗證啟動、健康檢查與 SQLite 寫入；Compose 設定已通過解析檢查。實際 WSL 使用原生 systemd，未在 WSL 改用 Docker。

## 刪除與備份

網站每則留言顯示 `#ID`。在 WSL 的服務目錄：

```sh
npm run delete -- 123
```

使用 `.env` 的管理 token 呼叫本機 API。刪除會清空名稱與內文，留下「留言已刪除」佔位，保留其他人的回覆；訪客重新整理後會看到變更。沒有一般使用者編輯或刪除功能。

SQLite 使用 WAL；直接複製正在使用的單一 `.sqlite` 檔可能漏掉最近留言。systemd 版本先停止服務，備份整個 `.data`，再啟動：

```sh
systemctl --user stop hawks-comments
tar -czf ~/hawks-comments-data-backup.tar.gz .data
systemctl --user start hawks-comments
```

將備份保存在另一台主機；`.env` 另行私密保存。Docker 版本請先 `docker compose stop comments`，備份完整 named volume，再啟動；不要使用 `docker compose down -v`，會移除留言資料。一次只執行一個實例。

## API 與限制

- `GET /healthz`：讀取 SQLite 的健康檢查。
- `GET /v1/comments/messages?page=/blog/slug/`：最近 100 則，包含刪除佔位；`hasMore` 表示還有更早留言。
- `GET ...&before=123`：載入 ID 小於 123 的留言。
- `POST /v1/comments/messages?page=...`：JSON `{requestId, name, body, replyTo, token, website}`。`requestId` 是客戶端 UUID，用於結果不明時的重試；不同內容不能重用。`replyTo` 可為 null，回覆必須屬於同一頁。
- `DELETE /v1/comments/messages/:id`：需 Bearer 管理 token。

單一來源 IP 每分鐘最多 6 次送出嘗試、120 次 API 請求，跨頁共用。速率限制保存在記憶體，服務重啟會重置；原始 IP 與 token 不保存到 SQLite，也不記錄留言內文。這不是完整的反垃圾內容審核系統。留言與暱稱會持續保留，直到管理員刪除；備份可能仍含刪除前內容。

```sh
npm test
```

後端測試使用暫存／記憶體 SQLite，Turnstile 使用模擬 API，不會對正式站發送留言。
