import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "hawks.tw",
    short_name: "hawks.tw",
    description:
      "Hawks 的個人網站，收集 Blog、Talk、Library、Project，以及一些生活和技術筆記。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#111114",
    theme_color: "#111114",
    lang: "zh-TW",
    icons: [
      {
        src: "/avatar.jpg",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/avatar.jpg",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
