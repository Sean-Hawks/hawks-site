import type { Post } from "../types";
import { getSortedPostsData, tagToSlug } from "./posts";
import { getAllLibraryItems } from "./library";
import type { LibraryItem } from "../data/library";

export type SiteTag = {
  tag: string;
  slug: string;
  count: number;
  postCount: number;
  libraryCount: number;
};

export type TaggedSiteItem =
  | {
      id: string;
      type: "post";
      label: "Blog";
      href: string;
      title: string;
      desc: string;
      date: string;
      tags: string[];
      source: Post;
    }
  | {
      id: string;
      type: "library";
      label: "Library" | "Library Review";
      href?: string;
      title: string;
      desc: string;
      date: string;
      tags: string[];
      source: LibraryItem;
    };

function normalizeDisplayTag(tag: string) {
  const value = tag.trim().replace(/^#+/, "");
  return value ? `#${value}` : "";
}

function toTimestamp(date: string) {
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getTaggedItems(): TaggedSiteItem[] {
  const posts = getSortedPostsData().map((post) => ({
    id: `post-${post.slug}`,
    type: "post" as const,
    label: "Blog" as const,
    href: `/blog/${post.slug}`,
    title: post.title,
    desc: post.desc,
    date: post.date,
    tags: post.tags.map(normalizeDisplayTag).filter(Boolean),
    source: post,
  }));

  const libraryItems = getAllLibraryItems().map((item) => ({
    id: `library-${item.slug}`,
    type: "library" as const,
    label: item.hasReview ? ("Library Review" as const) : ("Library" as const),
    href: item.hasReview ? `/library/${item.category}/${item.slug}` : undefined,
    title: item.hasReview ? `評論：${item.title}` : item.title,
    desc: item.note,
    date: item.date,
    tags: item.tags.map(normalizeDisplayTag).filter(Boolean),
    source: item,
  }));

  return [...posts, ...libraryItems].sort(
    (a, b) => toTimestamp(b.date) - toTimestamp(a.date)
  );
}

export function getAllSiteTags(): SiteTag[] {
  const counts = new Map<
    string,
    { tag: string; postCount: number; libraryCount: number }
  >();

  for (const item of getTaggedItems()) {
    for (const tag of item.tags) {
      const slug = tagToSlug(tag);
      const current = counts.get(slug) ?? {
        tag,
        postCount: 0,
        libraryCount: 0,
      };

      if (item.type === "post") {
        current.postCount += 1;
      } else {
        current.libraryCount += 1;
      }

      counts.set(slug, current);
    }
  }

  return Array.from(counts.entries())
    .map(([slug, item]) => ({
      slug,
      tag: item.tag,
      postCount: item.postCount,
      libraryCount: item.libraryCount,
      count: item.postCount + item.libraryCount,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getSiteTagBySlug(slug: string) {
  return getAllSiteTags().find((tag) => tag.slug === slug);
}

export function getSiteItemsByTagSlug(slug: string) {
  return getTaggedItems().filter((item) =>
    item.tags.some((tag) => tagToSlug(tag) === slug)
  );
}
