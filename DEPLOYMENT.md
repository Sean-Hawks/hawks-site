# 部署指南：GitHub Pages + 自訂網域（Gandi）

## 重要觀念：GitHub Pages 只會「送靜態檔」
如果你是 Next.js / Vite / Astro 這類前端框架，**不能直接把原始碼當成 GitHub Pages 的發佈內容**。
GitHub Pages 不會替你跑 `npm install` / `npm run build`，所以直接把 `src/`、`app/` 這些原始碼丟上去，最後就會 404。

正確做法是：
- 用 GitHub Actions 在雲端建置
- 產出靜態檔（例如 Next.js 的 `out/`）
- 再把產物發佈到 Pages

---

## 1) GitHub Pages：改用 GitHub Actions 發佈
1. Repo → **Settings → Pages**
2. **Source** 選 **GitHub Actions**
3. 到 repo 的 **Actions** 分頁，確認有部署 workflow
   - 你應該會看到 build + deploy pages 的流程
   - 成功後會看到 Pages artifact / deploy 記錄
4. 部署成功後，GitHub Pages 才會提供可用的網站內容（而不是 404）

---

## 2) Next.js：靜態輸出（Static Export）
本專案使用 Next.js App Router，部署到 Pages 時需要靜態輸出：
- `next.config.ts` 設定 `output: "export"`
- build 後會產生 `out/` 資料夾（這就是要發佈的靜態檔）

此外建議：
- `trailingSlash: true`（Pages 對資料夾型路由更穩）
- `images.unoptimized: true`（GitHub Pages 沒有 Next Image 的伺服器端優化能力）

---

## 3) 自訂網域（hawks.tw）如何接上 GitHub Pages
### 3.1 Repo 設定
Repo → **Settings → Pages**
- **Custom domain**：填入 `hawks.tw`
- 開啟 **Enforce HTTPS**
- Repo 內需存在 `public/CNAME`，內容為你的網域（例如 `hawks.tw`）

### 3.2 Gandi（LiveDNS）設定
到 Gandi 的 DNS / LiveDNS，新增/確認以下記錄：

#### A) 使用頂級網域（apex）`hawks.tw`
新增 4 筆 A record（Host/Name 通常用 `@`）指向 GitHub Pages IP：
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

TTL 用預設即可（或 300/600）。

#### B) 使用 `www.hawks.tw`（建議加上）
新增 1 筆 CNAME（Host/Name 填 `www`）：
- `www` → `sean-hawks.github.io`

---

## 4) 常見坑
### 4.1 basePath 要不要開？
- 如果你使用 **自訂網域**（`https://hawks.tw/`）當根目錄：通常 **不要** 設 `basePath`。
- 如果你使用預設 **Project Pages** URL（`https://<user>.github.io/<repo>/`）：需要 `basePath` / `assetPrefix`。

### 4.2 DNS 生效時間
DNS 可能需要幾分鐘到數小時。
GitHub Pages 的設定頁面會顯示 DNS check 是否成功。

---

## 5) 驗收清單
- [ ] Actions build / deploy 都是綠燈
- [ ] GitHub Settings → Pages 顯示站點 URL
- [ ] Custom domain 顯示可用，且 HTTPS 已啟用
- [ ] `hawks.tw` 與 `www.hawks.tw` 都能正確打開（若有設）
