import type { NextConfig } from "next";

const repo = "hawks-site";
const useSubpath = false; // 若用 https://<user>.github.io/hawks-site/，改成 true

const nextConfig: NextConfig = {
  // 1. 啟用靜態輸出：這會讓 `next build` 產生 `out/` 資料夾，裡面全是 HTML
  output: "export",

  trailingSlash: true,

  // 2. 關閉圖片優化：GitHub Pages 不支援 Next.js 的即時圖片處理伺服器
  images: {
    unoptimized: true,
  },

  // GitHub Pages 子路徑部署才需要
  ...(useSubpath
    ? {
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
      }
    : {}),

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
