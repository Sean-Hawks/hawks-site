import { Post } from "../types";

// NOTE: 這些內容會在 build 時被打包進靜態輸出（GitHub Pages 友善）；date 建議固定 YYYY-MM-DD（避免 CI/環境差異）
// NOTE: slug 必須唯一（對應 /blog/[slug]）
export const posts: Post[] = [
  // 範例：複製這個區塊來新增文章
  {
    date: "2024-05-20",
    title: "第一篇 Markdown 文章",
    desc: "這是一個範例，展示如何使用 Markdown 撰寫內容。",
    slug: "first-markdown-post", // 網址會是 /blog/first-markdown-post
    tags: ["#Demo", "#Markdown"],
    content: `
## 歡迎使用 Markdown

你現在可以直接在 \`content\` 欄位撰寫 **Markdown** 語法。

### 支援的功能

1. **粗體** 與 *斜體*
2. 列表項目
3. 連結與引用

> 這是一個引用區塊，用來強調重點。

\`\`\`javascript
// 也可以顯示程式碼區塊
console.log("Hello, Blog!");
\`\`\`
    `,
  },
  {
    date: "2025-12-28",
    title: "我把首頁做成 Discord Profile…",
    desc: "想把 README 當成個人檔案，右邊放新文章，左邊是社群身分。",
    slug: "discord-profile-homepage",
    tags: ["#UI", "#React", "#PersonalSite"],
    content: `## 設計靈感
我一直想要一個看起來像 Discord 個人檔案的首頁。

> 小提醒：右側是文章列表，左側是身份識別。

- 調整主色：\`--accent\`
- 保留 README 中的段落`,
  },
  {
    date: "2025-12-20",
    title: "我的工具箱：Arch + Neovim + 隨身螢幕",
    desc: "比較像碎念文：最近的裝備、快捷鍵、還有踩雷記。",
    slug: "setup-arch-neovim",
    tags: ["#Linux", "#Setup"],
    content: `## 系統配置
最近重新裝了 **Arch Linux**，並把 Neovim 配成 IDE。

1. Hyprland 做視窗管理
2. Tmux 對應不同專案
3. 15.6 吋的便攜螢幕當副螢幕`,
  },
  {
    date: "2025-12-15",
    title: "這週在忙什麼",
    desc: "一些小進度、一些小坑。把生活寫成 changelog。",
    slug: "weekly-notes",
    tags: ["#Weekly", "#Notes"],
    content: `## 本週進度
- 完成 blog 系統初版
- 寫了 Markdown Render
- 設計新段落樣式`,
  },
];
