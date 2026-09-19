import type { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import { excerpt, stripMarkdown } from "./content";
export type ExploreKind = "post" | "talk" | "library";
export type ExploreItem = {
  id: string;
  title: string;
  href: string;
  kind: ExploreKind;
  date: string;
  summary: string;
  minutes: number;
};
const isPublic = (status?: string) =>
  !["draft", "private"].includes(status?.trim().toLowerCase() ?? "");
function plain(content = "") {
  return stripMarkdown(
    content
      .replace(/(^|\s):::[a-z]*(?=\s|$)/g, " ")
      .replace(/!\[\[[^\]]+\]\]/g, " "),
  );
}
export function estimatedMinutes(content = "") {
  return Math.max(1, Math.ceil(plain(content).length / 500));
}
export function buildExploreItems(
  posts: Post[],
  talks: Talk[],
  library: LibraryItem[],
): ExploreItem[] {
  return [
    ...posts
      .filter((post) => isPublic(post.status) && plain(post.content).length > 0)
      .map((post) => ({
        id: `post:${post.slug}`,
        title: post.title,
        href: `/blog/${post.slug}/`,
        kind: "post" as const,
        date: post.date,
        summary: excerpt(plain(post.desc || post.content), 180),
        minutes: estimatedMinutes(post.content ?? ""),
      })),
    ...talks
      .filter((talk) => isPublic(talk.status) && plain(talk.desc).length > 0)
      .map((talk) => ({
        id: `talk:${talk.id}`,
        title: talk.title,
        href: `/talk/${talk.id}/`,
        kind: "talk" as const,
        date: talk.date,
        summary: excerpt(plain(talk.desc), 180),
        minutes: estimatedMinutes(talk.desc),
      })),
    ...library
      .filter(
        (item) =>
          isPublic(item.statusVisibility) &&
          item.hasReview &&
          plain(item.content).length > 0,
      )
      .map((item) => ({
        id: `library:${item.category}:${item.slug}`,
        title: `評論：${item.title}`,
        href: `/library/${item.category}/${item.slug}/`,
        kind: "library" as const,
        date: item.date,
        summary: excerpt(plain(item.note || item.content), 180),
        minutes: estimatedMinutes(item.content),
      })),
  ].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
export function filterExploreItems(
  items: ExploreItem[],
  minutes: number,
  kind: ExploreKind | "all",
) {
  return items.filter(
    (item) =>
      (minutes === 0 || item.minutes <= minutes) &&
      (kind === "all" || item.kind === kind),
  );
}
export function drawExploreItem(
  items: ExploreItem[],
  seen: string[],
  random = Math.random(),
) {
  let available = items.filter((item) => !seen.includes(item.id));
  const newRound = available.length === 0;
  if (newRound)
    available = items.filter(
      (item) => items.length === 1 || item.id !== seen.at(-1),
    );
  if (!available.length) return { item: undefined, seen, newRound: false };
  const fraction = Number.isFinite(random)
    ? Math.max(0, Math.min(0.999999999, random))
    : 0;
  const item = available[Math.floor(fraction * available.length)];
  return { item, seen: [...(newRound ? [] : seen), item.id], newRound };
}
