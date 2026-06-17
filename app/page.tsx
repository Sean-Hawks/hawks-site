import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "hawks.tw",
  description:
    "Hawks 的個人網站：Blog、Talk、Library、Project，以及關於程式、音樂、ACGM 和生活的筆記。",
  alternates: {
    canonical: "https://hawks.tw",
  },
  openGraph: {
    type: "website",
    url: "https://hawks.tw",
    title: "hawks.tw",
    description:
      "Hawks 的個人網站：Blog、Talk、Library、Project，以及關於程式、音樂、ACGM 和生活的筆記。",
    images: [
      {
        url: "/og/default.png",
        width: 1200,
        height: 630,
        alt: "hawks.tw",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "hawks.tw",
    description:
      "Hawks 的個人網站：Blog、Talk、Library、Project，以及關於程式、音樂、ACGM 和生活的筆記。",
    images: ["/og/default.png"],
  },
};

export const dynamic = "force-static"; // 靜態輸出/部署到 GitHub Pages 時維持穩定
// NOTE: 若 GitHub Actions 出現多個 deploy workflow 衝突，請刪除 .github/workflows/ 下多餘的 yml
// NOTE: 若 next build 因 PageProps/params 失敗，先檢查 app/**/[slug]/page.tsx 的 params 是否為 Promise（Next.js 15）
// NOTE: 如果 GitHub Actions build 失敗，先看 Actions log（常見是 lint/type errors）
// NOTE: 部署到 GitHub Pages + 自訂網域（含 Gandi）流程請看 /DEPLOYMENT.md

import { getSortedPostsData } from "./lib/posts";
import { getSortedTalksData } from "./lib/talks";
import { getAllLibraryItems } from "./lib/library";
import HomeClient from "./components/HomeClient";

export default function Page() {
	const posts = getSortedPostsData();
	const talks = getSortedTalksData();
	const libraryItems = getAllLibraryItems();

	return <HomeClient posts={posts} talks={talks} libraryItems={libraryItems} />;
}
