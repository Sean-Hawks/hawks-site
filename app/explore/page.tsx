import type { Metadata } from "next";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { getAllLibraryItems } from "../lib/library";
import { buildExploreItems } from "../lib/explore";
import ExploreClient from "./ExploreClient";
export const metadata: Metadata = {
  title: "隨意讀一篇",
  description:
    "選擇空閒時間，從 Hawks 的文章、近況和作品評論中發現一篇沒預期的閱讀。",
  alternates: { canonical: "https://hawks.tw/explore/" },
  openGraph: {
    title: "留幾分鐘，讀點意外的",
    description: "選擇時間，隨意讀一篇。",
    url: "https://hawks.tw/explore/",
    images: ["/og/default.png"],
  },
};
export default function ExplorePage() {
  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"
      >
        <p className="text-xs font-bold tracking-widest text-[rgb(var(--accent))]">
          A LITTLE SERENDIPITY
        </p>
        <h1 className="mt-4 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          留幾分鐘，
          <br />
          讀點意外的。
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[rgb(var(--muted))]">
          沒有關鍵字，也沒有一定要找的答案。選個時間，讓一篇文章、近況或作品評論陪你一下。
        </p>
        <ExploreClient
          items={buildExploreItems(
            getSortedPostsData(),
            getSortedTalksData(),
            getAllLibraryItems(),
          )}
        />
      </main>
    </div>
  );
}
