import { getSortedPostsData } from "./posts";
import { getSortedTalksData } from "./talks";
import { getAllLibraryItems } from "./library";
import { excerpt } from "./content";
export type ReadingItem = { id: string; title: string; href: string; kind: string; date: string; summary: string };
function summary(value = "") { return excerpt(value.replace(/(^|\s):::[a-z]*(?=\s|$)/g, " ").replace(/!\[\[[^\]]+\]\]/g, " "), 160); }
export function getReadingCatalog(): ReadingItem[] {
  return [
    ...getSortedPostsData().map(post => ({ id: `post:${post.slug}`, title: post.title, href: `/blog/${post.slug}/`, kind: "文章", date: post.date, summary: summary(post.desc || post.content) })),
    ...getSortedTalksData().map(talk => ({ id: `talk:${talk.id}`, title: talk.title, href: `/talk/${talk.id}/`, kind: "近況", date: talk.date, summary: summary(talk.desc) })),
    ...getAllLibraryItems().filter(item => item.hasReview || item.recommendedWorks.length > 0).map(item => ({ id: `library:${item.category}:${item.slug}`, title: item.title, href: `/library/${item.category}/${item.slug}/`, kind: "收藏", date: item.date, summary: summary(item.note || item.content) })),
  ];
}
