import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { getAllLibraryItems } from "../lib/library";
import { buildSearchIndex } from "../lib/search";
import { getAllSiteTags } from "../lib/site-tags";
import SearchClient from "./SearchClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "搜尋 Hawks 的文章、Talk、Library 與標籤。",
  alternates: {
    canonical: "https://hawks.tw/search/",
  },
  openGraph: {
    title: "Search",
    description: "搜尋 Hawks 的文章、Talk、Library 與標籤。",
    url: "https://hawks.tw/search/",
    images: ["/og/default.png"],
  },
};

export default function SearchPage() {
  const posts = getSortedPostsData();
  const talks = getSortedTalksData();
  const libraryItems = getAllLibraryItems();
  const items = buildSearchIndex(posts, talks, libraryItems);
  const tags = getAllSiteTags();

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-3">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
            Search
          </div>
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">搜尋</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
            從 Blog、Talk、Library、tag 和內文裡快速找到你想回頭看的東西。
          </p>
        </div>

        <SearchClient items={items} tags={tags} />
      </main>
    </div>
  );
}
