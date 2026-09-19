import type { Metadata } from "next";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";
import { getReadingCatalog } from "../lib/reading-catalog";
import ReadingListClient from "./ReadingListClient";
export const metadata: Metadata = {
  title: "稍後閱讀",
  description: "留一份自己的閱讀清單，下次接著讀。",
  robots: { index: false, follow: true },
  alternates: { canonical: "https://hawks.tw/saved/" },
};
export default function SavedPage() {
  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto max-w-3xl px-4 py-12 sm:px-6"
      >
        <p className="text-xs font-bold tracking-widest text-[rgb(var(--accent))]">
          YOUR READING SHELF
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">
          留著，下次讀
        </h1>
        <p className="mt-4 text-sm leading-7 text-[rgb(var(--muted))]">
          在文章、近況或收藏詳頁按「稍後閱讀」，就會出現在這裡。清單儲存在此瀏覽器，最多
          200 篇；不會同步到其他裝置，清除網站資料也會移除清單。
        </p>
        <ReadingListClient catalog={getReadingCatalog()} />
        <noscript>
          <p className="mt-8">
            閱讀清單需要 JavaScript
            才能儲存在瀏覽器。你仍可以使用瀏覽器書籤收藏文章。
          </p>
        </noscript>
      </main>
    </div>
  );
}
