# Hawks Personal Site

這是一個模仿 Discord Profile 風格的個人網站與部落格系統。

## 🛠 技術棧

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + CSS Variables (Discord Theme)
- **Language**: TypeScript
- **Blog Engine**: Markdown files + gray-matter + react-markdown

## 🚀 如何開始

1. **安裝依賴**：
   ```bash
   npm install
   ```

2. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```
   開啟 [http://localhost:3000](http://localhost:3000) 查看結果。

## 📝 如何新增文章 (Blog Workflow)

不需要修改程式碼，只需要新增 Markdown 檔案。

1. **建立檔案**：
   前往 `content/posts/` 資料夾，建立一個新的 `.md` 檔案。檔名將成為網址的一部分 (Slug)。
   例如：`my-awesome-post.md` -> `/blog/my-awesome-post`

2. **加入 Frontmatter**：
   在檔案的最上方加入以下設定區塊：

   ```yaml
   ---
   title: "文章標題"
   date: "2025-01-01"
   desc: "這是一段簡短的描述，會顯示在文章列表中。"
   tags: ["#Tag1", "#Tag2"]
   banner: "/images/banner-name.jpg" # (選填) 圖片請放在 public/images/
   ---
   ```

3. **撰寫內容**：
   在 `---` 下方開始撰寫標準 Markdown。
   - 支援圖片：`![Alt](/images/pic.jpg)`
   - 支援程式碼區塊
   - 支援引用與列表

## 📂 專案結構說明

- **`app/`**: 應用程式主邏輯
  - **`blog/`**: 部落格頁面 (`page.tsx` 為列表, `[slug]/page.tsx` 為內文)
  - **`components/`**: 共用元件 (Header, Sidebar, ThemeStyles)
  - **`data/`**: 靜態資料 (如左側的角色身分 `roles.ts`)
  - **`lib/`**: 後端工具 (如 `posts.ts` 負責讀取 Markdown 檔案)
  - **`types/`**: TypeScript 型別定義
- **`content/posts/`**: **文章存放處** (Markdown 檔案)
- **`public/`**: 靜態資源 (圖片請放這裡)

## 🎨 風格系統

全站樣式變數定義在 `app/components/ThemeStyles.tsx` 中。
主要使用 CSS Variables (`--bg`, `--panel`, `--accent`) 來維持 Discord 風格的一致性。
