import { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import { excerpt, stripMarkdown } from "./content";

export type SearchItem = {
  id: string;
  type: "post" | "talk" | "library";
  title: string;
  desc: string;
  date: string;
  href: string;
  tags: string[];
  haystack: string;
};

function displayTag(tag: string) {
  const value = tag.trim().replace(/^#+/, "");
  return value ? `#${value}` : "";
}

function compactSearchTerm(value: string) {
  return stripMarkdown(value)
    .toLowerCase()
    .replace(/\s+/g, "");
}

function compactHyphenatedTerms(value: string) {
  return Array.from(value.matchAll(/[#\p{L}\p{N}]+(?:-[#\p{L}\p{N}]+)+/gu))
    .map((match) => compactSearchTerm(match[0].replace(/^#+/, "")))
    .filter(Boolean)
    .join(" ");
}

function searchHaystack(parts: Array<string | number | null | undefined>) {
  const raw = parts.filter((part) => part !== null && part !== undefined).join(" ");
  return `${stripMarkdown(raw).toLowerCase()} ${compactHyphenatedTerms(raw)}`;
}

export function buildSearchIndex(
  posts: Post[],
  talks: Talk[],
  libraryItems: LibraryItem[] = []
): SearchItem[] {
  const postItems = posts.map((post) => {
    const desc = post.desc || excerpt(post.content);
    return {
      id: `post-${post.slug}`,
      type: "post" as const,
      title: post.title,
      desc,
      date: post.date,
      href: `/blog/${post.slug}`,
      tags: post.tags,
      haystack: searchHaystack([post.title, desc, post.tags.join(" "), post.content ?? ""]),
    };
  });

  const talkItems = talks.map((talk) => {
    const desc = excerpt(talk.desc);
    const tags = [talk.event, talk.year, "talk", "now"].filter(Boolean) as string[];
    return {
      id: `talk-${talk.id}`,
      type: "talk" as const,
      title: talk.title,
      desc,
      date: talk.date,
      href: `/talk/${talk.id}`,
      tags,
      haystack: searchHaystack([talk.title, desc, tags.join(" "), talk.desc]),
    };
  });

  const librarySearchItems = libraryItems.map((item) => {
    const desc = item.note || excerpt(item.content);
    const tags = item.tags.map(displayTag).filter(Boolean);
    const hasDetail = item.hasReview || item.category === "artist";
    return {
      id: `library-${item.slug}`,
      type: "library" as const,
      title: item.hasReview ? `評論：${item.title}` : item.title,
      desc,
      date: item.date,
      href: hasDetail ? `/library/${item.category}/${item.slug}` : `/library/${item.category}`,
      tags,
      haystack: searchHaystack([
        item.title,
        item.subtitle,
        item.category,
        item.year,
        item.status,
        item.recommendation,
        item.rating === null ? "n/a unrated" : item.rating?.toString() ?? "",
        desc,
        item.tags.join(" "),
        item.recommendedWorks.map((work) => work.title).join(" "),
        tags.join(" "),
        item.content ?? "",
      ]),
    };
  });

  return [...postItems, ...talkItems, ...librarySearchItems].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );
}
