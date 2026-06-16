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
      haystack: stripMarkdown(`${post.title} ${desc} ${post.tags.join(" ")} ${post.content ?? ""}`).toLowerCase(),
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
      haystack: stripMarkdown(`${talk.title} ${desc} ${tags.join(" ")} ${talk.desc}`).toLowerCase(),
    };
  });

  const librarySearchItems = libraryItems.map((item) => {
    const desc = item.note || excerpt(item.content);
    const tags = item.tags.map(displayTag).filter(Boolean);
    return {
      id: `library-${item.slug}`,
      type: "library" as const,
      title: item.hasReview ? `評論：${item.title}` : item.title,
      desc,
      date: item.date,
      href: item.hasReview ? `/library/${item.category}/${item.slug}` : `/library/${item.category}`,
      tags,
      haystack: stripMarkdown(
        [
          item.title,
          item.subtitle,
          item.category,
          item.year,
          item.status,
          item.recommendation,
          item.rating.toString(),
          desc,
          item.tags.join(" "),
          tags.join(" "),
          item.content ?? "",
        ].join(" ")
      ).toLowerCase(),
    };
  });

  return [...postItems, ...talkItems, ...librarySearchItems].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );
}
