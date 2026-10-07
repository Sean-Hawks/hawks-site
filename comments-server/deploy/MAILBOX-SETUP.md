# WSL 自架信箱：me@hawks.tw

2026-10-07（Asia/Taipei）。使用既有 Postfix 3.8、Dovecot 2.3、Rspamd 與虛擬使用者 `me@hawks.tw`。信件保存在 `/var/vmail/hawks.tw/me/Maildir`，啟用的 Sieve 為 `keep;`，目前不轉寄到 Gmail。使用者確認只有 `me@hawks.tw` 需要搬遷。`postmaster@hawks.tw`、`abuse@hawks.tw` 的既有別名保留；留言通知的 `comments@hawks.tw` 已新增為 `me@hawks.tw` 的收件別名，回信與退信進入此信箱。修改前的 alias map 備份在 `/etc/hawks-mail/backups/`（root 私密目錄），公開 SMTP 收件地址測試通過。

## 收信客戶端

客戶端須先連上此帳號的 Tailscale。

| 項目 | 設定 |
| --- | --- |
| Email／登入帳號 | `me@hawks.tw` |
| IMAP 主機 | `hawks-wsl.tail5bdb5f.ts.net` |
| IMAP 埠／加密 | `993`，SSL/TLS |
| SMTP 主機 | `hawks-wsl.tail5bdb5f.ts.net` |
| SMTP 埠／加密 | `587`，STARTTLS |
| SMTP 驗證 | 使用與 IMAP 相同的完整帳號及密碼 |

憑證由 Let's Encrypt 簽發，名稱是上述 Tailscale 主機名；客戶端使用 `mail.hawks.tw` 會遇到憑證名稱不符。既有每日 `hawks-mail-renew-tls.timer` 負責更新憑證。993 與 587 僅綁定 WSL loopback／Tailscale，無須開放到 Internet。

密碼保留在 WSL `/etc/hawks-mail/initial-password`（root 0600）；沒有寫入 Git 或本文件。在自己 Windows 的 PowerShell 查看：

```powershell
wsl -d Ubuntu-24.04 -u root -- cat /etc/hawks-mail/initial-password
```

只在自己的終端取得並填入郵件客戶端，無須貼回聊天室。

## Roundcube 網頁信箱

使用者選擇免費開源的 Roundcube。入口：**https://hawks-wsl.tail5bdb5f.ts.net:9443/**，須先連上 Tailscale，帳號為 `me@hawks.tw`，密碼與 IMAP 相同。這是網頁信箱網址；上方未帶埠號的主機名則供郵件軟體填寫伺服器。

沿用 WSL 既有 Roundcube **1.7.4**（[官方穩定版](https://roundcube.net/download/)）、PHP 8.3 FPM 與 Caddy：

- 程式：`/opt/hawks-webmail/current` → `/opt/hawks-webmail/releases/1.7.4`。
- 設定：`/etc/hawks-webmail/config.inc.php`；session 加密 key 留在 WSL 私密檔案。
- SQLite：`/var/lib/hawks-webmail/roundcube.sqlite`（webmail 0600），儲存使用者偏好／通訊錄等，信件仍在 Dovecot Maildir。
- 網頁：Tailscale Serve **9443（tailnet only）** → Caddy `127.0.0.1:9080` → `/run/php/hawks-webmail.sock` → PHP FPM 的 `webmail` 使用者。
- HTTP document root 為 `public_html`；installer、config 等路徑回覆 404。Session cookie 帶 Secure／HttpOnly／SameSite=Lax，介面為繁體中文 Elastic。
- IMAP `ssl://hawks-wsl.tail5bdb5f.ts.net:993`、SMTP `tls://hawks-wsl.tail5bdb5f.ts.net:587`，兩者均保留憑證與主機名驗證；使用登入者自己的帳密，不將密碼寫入程式碼。

發現 Caddy 開機時嘗試綁定尚未出現的 Tailscale IP `100.122.23.119:9081`，導致整個 Caddy 服務失敗，包括 Roundcube。已新增 [caddy-webmail-retry.conf.example](caddy-webmail-retry.conf.example) 對應的 systemd drop-in，等待 tailscaled／PHP FPM 並在失敗後每 15 秒重試，恢復 Caddy；既有網站設定沿用。修改前的設定備份在 `/etc/hawks-webmail/backups/`（root 私密目錄）。未新增公開 Funnel 或路由器 HTTP 埠。

```sh
ssh hawks-wsl 'sudo systemctl status caddy php8.3-fpm --no-pager'
ssh hawks-wsl 'sudo systemctl restart caddy'
```

驗證：HTTPS 首頁與 CSS 回覆 200，installer／config 回覆 404；以 PHP FPM 相同的 `webmail` 使用者透過 **Roundcube 自身的 PHP 類別**確認 SQLite、TLS IMAP 登入與讀取 Gmail 測試信，SMTP STARTTLS 驗證及本機投遞通過，新測試信的 DKIM 簽章與 IMAP 讀回通過（UID 7）。Chrome 控制操作逾時，沒有用替代瀏覽器自動化繞過控制連線。使用者已親自確認網頁登入成功並看到「hi」；Roundcube SQLite 的 `me@hawks.tw` last_login 為 2026-10-07 15:19:12 UTC（23:19:12 Taipei），與使用者確認一致。

## 手機 Gmail App

使用者表示手機一直連著 Tailscale，可以加入此 IMAP 信箱。Gmail App → 頭像 → 新增其他帳戶 → 其他 → 輸入 `me@hawks.tw` → 個人（IMAP），使用本文件的收信／寄信主機、埠、加密方式及完整帳密。參考 [Google 官方手動設定步驟](https://support.google.com/mail/answer/6078445?hl=zh-Hant&co=GENIE.Platform%3DAndroid)。這是手機 App 直接讀取 WSL 信箱，目前沒有把信件轉寄到 Gmail 網頁版。

## Windows 收信入口

Internet TCP 25 → ASUS 路由器 → Windows TCP 25 → Tailscale → Postfix `100.122.23.119:2525` → Rspamd → Dovecot LMTP → Maildir。

[windows-mail-ingress.ps1](windows-mail-ingress.ps1) 用 Windows PowerShell 5.1 的 .NET TCP 代理傳遞 PROXY v1 原始來源 IP；WSL 防火牆只允許 Windows 的 Tailscale IP 與 loopback 連入 2525。代理限制 64 個並行連線、10 秒後端連線逾時與 120 秒串流閒置逾時，內容及 TLS 位元組不經修改。Postfix 負責收件地址與 relay 限制。

[install-windows-mail-ingress.ps1](install-windows-mail-ingress.ps1) 已放到 Windows 使用者的 `%LOCALAPPDATA%\Hawks`。在 Windows **管理員 PowerShell** 執行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\Hawks\install-windows-mail-ingress.ps1"
```

安裝程式將代理放進 `%ProgramData%\Hawks\Mail`，目錄僅 SYSTEM／管理員可修改，建立 SYSTEM 開機排程 `Hawks Mail SMTP Ingress`（不限執行時間、失敗重試）與單一 TCP 25 防火牆規則 `Hawks-Mail-SMTP-Ingress`。更新前會備份既有同名排程與腳本，遇到其他 TCP 25 listener 會停止安裝而保留它。這個腳本不修改路由器或 DNS。

路由器 UPnP 對 TCP 25 回覆 `718 ConflictInMappingEntry`，沒有成功建立映射。需要在 ASUS `192.168.50.1` 手動設定：

- 外部 TCP 25 → Windows Ethernet `192.168.50.52` 的 TCP 25。
- 對 Hawks-PC Ethernet 設定 DHCP 固定配給，避免轉送目的 IP 改變。
- 若已有 TCP 25 規則，先核對用途及目的 IP，不要直接覆蓋。

先驗證從外部網路連線 `114.32.161.42:25` 能收到 `220 mail.hawks.tw ESMTP`，並測試寄給 `me@hawks.tw` 可由 IMAP 讀取，才進行 MX 切換。若路由器正確轉送仍無法連入，需要查 Windows 防火牆或 ISP 入站 25 埠限制。

## Gandi MX 切換與回復

**MX 已切換。** 2026-10-07 已確認三台 Gandi 權威 DNS，以及 Cloudflare `1.1.1.1`、Google `8.8.8.8` 都只回傳 `10 mail.hawks.tw.`，`mail.hawks.tw` 的 A 為 `114.32.161.42`。Windows 安裝與路由器轉送已由使用者完成，公開 TCP 25 已通過美國、瑞士節點連線測試，Postfix 也記錄到這兩個實際外部來源 IP。收信入口接受 `me@hawks.tw`（SMTP RCPT 250），使用者從 Gmail 寄來的測試信已實際投遞至 WSL INBOX，IMAP 讀回正文成功，完整外部收信已驗證。

先在 Gandi 匯出／備份 DNS 記錄，再於 `hawks.tw` 的 DNS records 編輯 **MX 記錄組**，改為：

```dns
@ 300 IN MX 10 mail.hawks.tw.
```

`mail.hawks.tw` 的 A 已為 `114.32.161.42`，現有 SPF、DKIM、DMARC 可保留。Gandi 的 [DNS 記錄管理說明](https://docs.gandi.net/en/domain_names/common_operations/dns_records.html) 提供操作與備份方法。不要改動網站 A／CNAME、NS 或其他 TXT。

切換後等待舊 MX 的快取 TTL，從外部信箱寄到 `me@hawks.tw`，檢查 WSL IMAP 收件與 Postfix／Dovecot 紀錄，再申請 Spamhaus 驗證信。原 Gandi 轉址先保留，待過渡完成再整理。

若自架入口故障，將 MX 記錄組恢復為：

```dns
@ IN MX 10 spool.mail.gandi.net.
@ IN MX 50 fb.mail.gandi.net.
```

DNS 回復仍需等待快取過期。停用 Windows 代理可在管理員 PowerShell 執行：

```powershell
Stop-ScheduledTask -TaskName 'Hawks Mail SMTP Ingress'
Unregister-ScheduledTask -TaskName 'Hawks Mail SMTP Ingress' -Confirm:$false
Remove-NetFirewallRule -Name 'Hawks-Mail-SMTP-Ingress'
```

## 驗證紀錄與目前限制

- WSL 與 Mac 都成功使用公開 CA 憑證驗證 IMAP 993 和 SMTP 587 STARTTLS，完整帳號密碼登入通過。
- 留言專用 SMTP → Postfix → Dovecot LMTP → INBOX → IMAP 讀回通過。
- Mac 的 SMTP 587 實際登入投遞至同一個自有信箱，DKIM 簽章 `d=hawks.tw; s=mail202609` 存在，IMAP 讀回通過。兩封本機測試信保留在 INBOX，未向外部收件者寄送。
- Windows 代理實際編譯與 TCP／STARTTLS 轉送通過；Postfix 紀錄保留 Mac 的原始 Tailscale 來源 IP。
- 收件者 `me@hawks.tw` 接受；不存在信箱回 `550`；未授權外部 relay 回 `554`，未提交測試信 DATA。
- 最終兩個 PowerShell 腳本語法檢查通過。臨時 Windows 測試程序已停止。
- 使用者在管理員 PowerShell 安裝後，輸出 `Hawks Mail SMTP Ingress Running`；目前 Windows `0.0.0.0:25` 正在監聽。非管理員 WSL interop 查詢該 SYSTEM 排程明確回覆 Access denied，因此沒有假設能讀到排程的詳細狀態。
- 使用者完成路由器轉送與 DHCP 固定配給；有線 MAC 為 `74:56:3C:BD:CB:35`，目前 Windows Ethernet 是 `192.168.50.52`。
- 真實外部 TCP 檢查：美國 Los Angeles（`38.145.202.12`）與瑞士 Zurich（`141.255.165.104`）均連上 `114.32.161.42:25`，WSL Postfix 日誌記錄兩個來源。見 [檢查報告](https://check-host.net/check-report/4f83b2b5k35b)。
- 經公開 IP 的 SMTP STARTTLS 使用 TLS 1.3，投遞一份自有已簽章的測試信後，成功由 IMAP 讀回（queue `B80D4666D7`、UID 5）。這次郵件投遞來自同一 LAN，路由器使用 NAT loopback，Postfix 看到來源 `192.168.50.1`；不能將它當成跨 Internet 的完整收信測試。外部節點檢查僅建立 TCP 連線，未寄送郵件。
- MX 切換已由權威與兩個公開 resolver 確認。使用者的 Gmail 測試信於 22:55:48 實際存入 INBOX，來源是 Google MTA `mail-vk1-f180.google.com [209.85.221.180]`，經 ESMTPS／STARTTLS → Postfix queue `C50B350FB9` → Dovecot LMTP Saved → IMAP UID 6；已讀回正文。這是實際跨 Internet 的郵件投遞，沒有經 Gandi 轉址。
- 未測試 Windows 重開機；目前服務運作不代表已驗證重開機後常駐。
- 現有 IP 的 Spamhaus PBL 排除尚未申請。`me@hawks.tw` 已可接收驗證信；透過 HiNet DNS 最新查詢仍回 `127.0.0.11`。使用者認為 IP 是固定配給，但仍須確認符合 [Spamhaus 的申請條件](https://www.spamhaus.org/faqs/policy-blocklist-pbl/)。
