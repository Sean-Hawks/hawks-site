import type { LibraryItem, LibraryCategory } from "../data/library";

type SortableItem = Pick<LibraryItem, "category" | "featured" | "featuredOrder" | "rating">;

export function consoleLibraryPage<T extends SortableItem>(items: T[], category: LibraryCategory | "all", requestedPage: number) {
  const matching = items.filter((item) => category === "all" || item.category === category).sort((a, b) =>
    Number(b.featured) - Number(a.featured)
    || (a.featuredOrder ?? Infinity) - (b.featuredOrder ?? Infinity)
    || (b.rating ?? -1) - (a.rating ?? -1),
  );
  const pageCount = Math.ceil(matching.length / 3);
  const page = Math.max(0, Math.min(Math.max(0, pageCount - 1), Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 0));
  return {
    items: matching.slice(page * 3, page * 3 + 3),
    page,
    pageCount,
    total: matching.length,
    from: matching.length ? page * 3 + 1 : 0,
    to: Math.min(matching.length, page * 3 + 3),
  };
}
