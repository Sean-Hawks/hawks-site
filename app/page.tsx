export const dynamic = "force-static"; // 靜態輸出/部署到 GitHub Pages 時維持穩定
// NOTE: 若 GitHub Actions 出現多個 deploy workflow 衝突，請刪除 .github/workflows/ 下多餘的 yml
// NOTE: 若 next build 因 PageProps/params 失敗，先檢查 app/**/[slug]/page.tsx 的 params 是否為 Promise（Next.js 15）
// NOTE: 如果 GitHub Actions build 失敗，先看 Actions log（常見是 lint/type errors）
// NOTE: 部署到 GitHub Pages + 自訂網域（含 Gandi）流程請看 /DEPLOYMENT.md

import { getSortedPostsData } from "./lib/posts";
import { getSortedTalksData } from "./lib/talks";
import HomeHydrationGate from "./components/HomeHydrationGate";

export default function Page() {
	const posts = getSortedPostsData();
	const talks = getSortedTalksData();

	return <HomeHydrationGate posts={posts} talks={talks} />;
}
