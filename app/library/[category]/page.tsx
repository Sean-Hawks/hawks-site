import { notFound } from "next/navigation";
import Header from "../../components/Header";
import ThemeStyles from "../../components/ThemeStyles";
import {
  libraryCategories,
  type LibraryCategory,
} from "../../data/library";
import { getLibraryCategory, getLibraryItemsByCategory } from "../../lib/library";
import LibraryCategoryClient from "../LibraryCategoryClient";
import type { Metadata } from "next";

export function generateStaticParams() {
  return libraryCategories.map((category) => ({ category: category.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const currentCategory = getLibraryCategory(category);

  if (!currentCategory) {
    return {
      title: "Library",
    };
  }

  return {
    title: currentCategory.title,
    description: currentCategory.description,
    alternates: {
      canonical: `https://hawks.tw${currentCategory.href}/`,
    },
    openGraph: {
      title: currentCategory.title,
      description: currentCategory.description,
      url: `https://hawks.tw${currentCategory.href}/`,
      images: ["/og/default.png"],
    },
  };
}

export default async function LibraryCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const currentCategory = getLibraryCategory(category);

  if (!currentCategory) {
    notFound();
  }

  const items = getLibraryItemsByCategory(category as LibraryCategory);

  return (
    <div className="site-shell min-h-screen text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-3">
        <LibraryCategoryClient category={currentCategory} items={items} />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-[rgb(var(--muted))] sm:px-3">
        <div className="opacity-70">© {new Date().getFullYear()} Hawks</div>
      </footer>
    </div>
  );
}
