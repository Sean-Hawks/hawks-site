# Hawks 留言服務

參考 [emtech.cc 的留言架構](https://emtech.cc/p/emtech-2026/)：靜態網站搭配獨立互動 API。這裡使用 WSL 上的 Node.js HTTP 服務與 SQLite，網站繼續由 GitHub Pages 提供。實際主機與啟動設定見 [目前部署](deploy/WSL-CURRENT.md)。

已支援匿名／暱稱、GitHub 身份與頭像、Email 回覆通知、首頁與每篇文章各自的討論串、巢狀回覆、較早留言分頁、送出重試去重、Turnstile 後端驗證、IP 速率限制與管理員刪除。首頁兩種 GUI、Blog、Talk、Library 詳頁都使用同一個留言元件。

GitHub 與 Email 功能可各自啟用，缺少設定時不影響匿名留言。正式環境已設定 GitHub OAuth App，Email 使用 WSL 自架 Postfix／Rspamd，見 [啟用指南](deploy/INTEGRATIONS-SETUP.md)。勾選「接收此討論串的回覆通知」才會訂閱；GitHub 帳號驗證一次信箱後，可在其他討論串沿用，匿名訂閱或新信箱仍需收信確認。可取消單串通知，或移除帳號信箱並取消所有通知，Email 不會出現在公開資料中。未登入者的暱稱不是已驗證身分；文字會直接公開。訊息以純文字顯示，不解譯 HTML 或 Markdown。未提供 Gravatar、審核佇列或圖片上傳。留言列表在進入頁面、按「重新整理」時讀取，送出後會定位到新留言並顯示結果；錯誤會保留內容並提示下一步。

## 本機預覽

需要 Node.js **22.13 以上**（使用內建 `node:sqlite`）；Nodemailer 負責 SMTP 與郵件編碼。與網站、Discord bot 分開執行。

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

已獨立部署在 `/home/sean8/apps/hawks-comments`，使用 `hawks-comments.service`；與 `/home/sean8/apps/hawks-agent` 的資料及服務分開。2026-10-07 確認 Ubuntu-24.04 原先為 Stopped，從 Windows 啟動後已恢復 SSH、Tailscale 與 bot。Node 為 `/home/sean8/.local/opt/hawks-agent-node/bin/node`（22.23.2），留言、登入、通知、SMTP 與 gateway 測試 37 項通過。以下步驟供重新部署使用。

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
COMMENTS_PROXY=cloudflare
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

## HTTPS：Cloudflare Worker → VPC Tunnel → WSL（目前使用）

公開 API 是 **`https://hawks-comments.sean-hawks.workers.dev`**。Worker 只代理留言與健康檢查；Node.js、SQLite 與管理刪除仍在 WSL。`hawks.tw` 的 DNS 維持 Gandi，無需搬移網域或開放 8790 公網埠。

WSL 的 `hawks-comments-tunnel.service` 使用 Cloudflare 官方 `cloudflared`，透過 QUIC 連到 named Tunnel `hawks-comments-wsl`。Worker 的 VPC Service binding 只指向 `127.0.0.1:8790`，不提供其他 WSL 網路服務。相關程式與設定在 [gateway](gateway/)，systemd 範例在 [hawks-comments-tunnel.service.example](deploy/hawks-comments-tunnel.service.example)。

Tunnel token 存在 `/etc/hawks-comments/tunnel-token`，root 0600；不要提交或印出。安裝 cloudflared 後，把範例 service 複製到 `/etc/systemd/system/hawks-comments-tunnel.service`，執行 `sudo systemctl daemon-reload` 與 `sudo systemctl enable --now hawks-comments-tunnel`。Node API 設定 `COMMENTS_PROXY=cloudflare`，使用 gateway 轉送的 Cloudflare `CF-Connecting-IP` 限流。必須維持 loopback 綁定，且不能另開相信訪客 header 的公網代理。

部署 Worker（先完成 Cloudflare 登入及 VPC Service 建立；目前 service ID 已記錄在設定中）：

```sh
npm --prefix hearts-worker ci
hearts-worker/node_modules/.bin/wrangler deploy --config comments-server/gateway/wrangler.jsonc
curl -fsS -A 'Mozilla/5.0' https://hawks-comments.sean-hawks.workers.dev/healthz
```

新建通道／搬家時依 [Cloudflare Workers VPC 指南](https://developers.cloudflare.com/workers-vpc/get-started/)建立 named Tunnel，再用 `wrangler vpc service create hawks-comments-wsl --type http --tunnel-id TUNNEL_ID --ipv4 127.0.0.1 --http-port 8790` 建立服務，更新 `gateway/wrangler.jsonc` 的 binding ID。Workers VPC 目前為免費 beta，功能與價格仍可能改變，見 [官方說明](https://developers.cloudflare.com/workers-vpc/platform/pricing/)；Worker 本身依帳號方案配額運作。

曾試用 Tailscale Funnel，但節點的公開 DNS 持續回傳 NXDOMAIN，tailnet 內測試成功不能代表訪客可連線。因此已移除本次留言新增的 Funnel port 10000；既有 443、9443、10443 的代理維持原設定。

Cloudflare Turnstile widget 為 `hawks.tw comments`，managed，只允許 `hawks.tw`，action `comment`。secret 與管理 token 只存在 WSL 私密 `.env`。GitHub Actions 使用以下公開 repository variables；修改後必須重新建置網站：

| Repository variable | 值 |
| --- | --- |
| `NEXT_PUBLIC_COMMENTS_API_URL` | `https://hawks-comments.sean-hawks.workers.dev` |
| `NEXT_PUBLIC_COMMENTS_TURNSTILE_SITE_KEY` | widget 的公開 site key |

設定缺失時服務拒絕啟動／送出，不會略過正式環境驗證。驗證流程依 [Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。Worker 不公開 DELETE 路由，只轉送 hcs_ 網站 session 的 Authorization；不轉送管理 token、Cookie 或 X-Forwarded-For。WSL 離線時回傳可供前端顯示的 503，保留 `hawks.tw` CORS header，不快取留言或錯誤。

WSL／Windows 睡眠、關機會使留言服務離線，網站本身仍可閱讀。systemd 的自動重啟只在 WSL 正在執行時生效；systemd 本身不會保持 WSL VM 執行。Windows 的啟動排程使用 [wsl-keep-alive.ps1](deploy/wsl-keep-alive.ps1) 持續執行 `wsl.exe ... /bin/sleep infinity`，WSL 被手動停止時會在 15 秒後重新啟動。[repair-wsl-startup.ps1](deploy/repair-wsl-startup.ps1) 已由管理員執行並核對：排程無執行時限、失敗重試 3 次，Windows Tailscale unattended 已啟用。若要停機維護，先停止兩個 Windows 啟動排程。兩台裝置的 Tailscale 金鑰到期皆已停用；這與 VM 常駐、管理網頁登入期限各自獨立。

若日後需要再次執行修正腳本，在管理員 PowerShell 使用以下單次執行參數（不改永久執行原則）：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Hawks\repair-wsl-startup.ps1"
```

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

## 留言操作與前端驗證

前端將留言列表、回饋提示、草稿與登入狀態分開維護。恢復登入期間不能送出；暫時的服務故障不會默默切換成匿名。回覆會帶到表單並顯示對象，登出保留內容並清除通知選項。草稿只保留在目前分頁，送出成功後移除；回應逾時後重試仍使用同一 request ID，避免重複留言。

`npm test` 包含 `tests/comments-flow.test.mjs` 的真實 React DOM 操作及草稿解析測試。這些測試使用隔離 API 回應，並未向 GitHub 或真人寄信。正式 GitHub 授權、信箱確認及 WSL 隔離 SMTP／IMAP 收信驗證範圍記錄於 [整合設定](deploy/INTEGRATIONS-SETUP.md)；新版手機畫面與授權視窗操作仍待人工確認。

留言者可填寫公開的個人網站，名稱會連至該網址；網址驗證由前後端共用 `shared/author-website.mjs`。公開欄位為 `authorWebsite`；既有 `website` 是蜜罐欄位，兩者不可互換。管理刪除會一併清除網站資料。部署時須包含 `shared/` 資料夾。
