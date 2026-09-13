# Discord 邀請子網域

目標：`https://discord.hawks.tw/` 與 `https://dc.hawks.tw/`，開啟後前往
`https://discord.gg/c2hPpyErDv`。

## 頁面

`public/discord/index.html` 是完整、獨立、無需建置的邀請頁：

- 初始 HTML 包含 Open Graph 與 Twitter Card，預覽標題為「魊窩｜Hawks Discord」。
- 預覽圖片使用邀請對應的 Discord 伺服器圖示，並提供絕對 HTTPS 圖片網址。
- 瀏覽器 3 秒後自動導向，提供「留在此頁」與手動加入按鈕。
- 停用 JavaScript 時仍可使用加入按鈕。
- 兩個域名共用 `https://discord.hawks.tw/` 作為 canonical / `og:url`。
- 靜態頁不宣稱即時人數；邀請失效或圖示更換時需更新 HTML。

主站正常建置也會包含 `https://hawks.tw/discord/`，但 **這不會自動啟用子網域**。
要讓子網域生效，必須先在託管平台綁定兩個域名、設定 DNS，再完成 HTTPS。

## Gandi DNS + 獨立靜態託管

2026-09-09 查到 `hawks.tw` 的 authoritative nameservers 是 Gandi；
`discord.hawks.tw` 和 `dc.hawks.tw` 尚無解析記錄。主站使用 GitHub Pages。

可將 `public/discord/` 單獨部署到支援多個自訂網域的靜態主機，例如 Netlify。
不需要更動主站的 A 記錄或 nameservers。

以 Netlify 為例：

1. 手動上傳 **`public/discord/` 資料夾**，讓 `index.html` 位在部署根目錄。
   不要上傳整個 repo，也不需要執行 Next.js 建置。
2. 記下平台實際配置的 `xxxxx.netlify.app` 網域。
3. 在 Domain management 設定 `discord.hawks.tw` 為主網域，
   加入 `dc.hawks.tw` 作為 domain alias。
4. 在 Gandi LiveDNS 新增下列 CNAME，目標必須換成步驟 2 的真實值：

   | 名稱 | 類型 | 目標 | TTL |
   | --- | --- | --- | --- |
   | discord | CNAME | `xxxxx.netlify.app.` | 300 |
   | dc | CNAME | `xxxxx.netlify.app.` | 300 |

5. 等待 DNS 驗證，確認兩個網域的 HTTPS 憑證都完成。
6. 如平台將 alias 導向主網域，確認最終回應為邀請頁的 `200 text/html`，
   不是直接 HTTP 301/302 到 Discord。

如果使用其他平台，部署相同資料夾，先綁定兩個網域，再使用該平台提供的 DNS 值。
不要將 CNAME 設為 Discord 網址：DNS 記錄無法指定 `/c2hPpyErDv` 路徑。
不要在 Gandi 使用直接到 Discord 的 HTTP forwarding，否則無法提供此頁自訂 metadata。
不要把兩個子網域直接 CNAME 到目前的 GitHub Pages 主站，或往主站 `public/CNAME` 增加多行；
GitHub Pages 的 custom domain 設定不會因此替同一站加入這兩個獨立域名。

## 驗證

本機預覽：

```sh
python3 -m http.server 4173 --directory public/discord
```

開啟 `http://localhost:4173/`，確認自動導向、取消、手動加入與手機版排版。

上線後：

```sh
curl -IL https://discord.hawks.tw/
curl -IL https://dc.hawks.tw/
curl -sL -A Discordbot https://discord.hawks.tw/
curl -sL -A Discordbot https://dc.hawks.tw/
```

兩個網址最終都應回傳邀請頁的 HTML，內含 `og:title`、`og:description`、`og:image`。
分享預覽有平台快取，更新後可用 `?v=2` 這類新網址確認重新抓取。
實際卡片樣式、是否展開圖片由分享平台決定；自訂網址的 Open Graph 卡片不等於
`discord.gg` 原生邀請卡片，無法保證顯示 Discord 原生加入按鈕與即時人數。

參考：

- [Open Graph protocol](https://ogp.me/)
- [Netlify 外部 DNS 設定](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/)
- [GitHub Pages 自訂網域](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
