import type { Post, Talk } from "../types";
import type { LibraryItem, LibraryCategory } from "../data/library";
import { buildExploreItems } from "./explore";

export function consoleStatistics(posts: Post[], talks: Talk[], library: LibraryItem[]) {
  const readings = buildExploreItems(posts, talks, library);
  const kinds = ["post", "talk", "library"] as const;
  const reading = {
    count: readings.length,
    minutes: readings.reduce((sum, item) => sum + item.minutes, 0),
    shortCount: readings.filter((item) => item.minutes <= 5).length,
    breakdown: kinds.map((kind) => ({
      kind,
      minutes: readings.filter((item) => item.kind === kind).reduce((sum, item) => sum + item.minutes, 0),
    })),
  };
  const publicLibrary = library.filter((item) => !["draft", "private"].includes(item.statusVisibility?.trim().toLowerCase() ?? ""));
  const ratings = publicLibrary.flatMap((item) =>
    typeof item.rating === "number" && Number.isFinite(item.rating) ? [item.rating] : [],
  );
  const collection = (["anime", "movie", "artist", "game"] as LibraryCategory[]).map((category) => ({
    category,
    count: publicLibrary.filter((item) => item.category === category).length,
  }));
  return {
    readings,
    reading,
    collection,
    averageRating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
  };
}
