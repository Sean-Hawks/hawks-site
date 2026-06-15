import { Post, Talk } from "../types";
import { excerpt, stripMarkdown } from "./content";

export type SearchItem = {
  id: string;
  type: "post" | "talk";
  title: string;
  desc: string;
  date: string;
  href: string;
  tags: string[];
  haystack: string;
};

export function buildSearchIndex(posts: Post[], talks: Talk[]): SearchItem[] {
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

  return [...postItems, ...talkItems].sort((a, b) => (a.date < b.date ? 1 : -1));
}
