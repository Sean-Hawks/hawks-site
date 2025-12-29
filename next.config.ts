import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 啟用靜態輸出：這會讓 `next build` 產生 `out/` 資料夾，裡面全是 HTML
  output: "export",
  
  // 2. 關閉圖片優化：GitHub Pages 不支援 Next.js 的即時圖片處理伺服器
  images: {
    unoptimized: true,
  },

  // 3. [重要] 如果你的 GitHub Repo 名稱不是 <帳號>.github.io (例如是 hawks-site)
  // 請取消下面這行的註解，否則 CSS 和圖片路徑會壞掉
  // basePath: "/hawks-site",
};

export default nextConfig;
