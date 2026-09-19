import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const repo = "hawks-site";
const useSubpath = false; // 若用 https://<user>.github.io/hawks-site/，改成 true

const manifestPath = path.join(process.cwd(), "public/_img/manifest.json");
const imageManifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")).images : {};

const nextConfig: NextConfig = {
  // 1. 啟用靜態輸出：這會讓 `next build` 產生 `out/` 資料夾，裡面全是 HTML
  output: "export",

  // 重要：GitHub Pages 需要 trailingSlash: true 才能正確處理子路徑（如 /talk 變成 /talk/index.html）
  trailingSlash: true,

  // Prebuilt responsive images work on GitHub Pages without an image server.
  env: { NEXT_PUBLIC_IMAGE_MANIFEST: JSON.stringify(imageManifest) },
  images: {
    loader: "custom",
    loaderFile: "./app/lib/image-loader.ts",
    deviceSizes: [480, 960, 1600, 2000],
    imageSizes: [240],
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
