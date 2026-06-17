import type { MetadataRoute } from "next";
import { libraryCategories } from "./data/library";
import { getAllLibraryItems } from "./lib/library";
import { getSortedPostsData } from "./lib/posts";
import { getAllSiteTags } from "./lib/site-tags";
import { getSortedTalksData } from "./lib/talks";

const siteUrl = "https://hawks.tw";

export const dynamic = "force-static";

function toDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/blog/",
    "/now/",
    "/library/",
    "/project/",
    "/search/",
    "/contact/",
    "/talk/",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  const blogRoutes = getSortedPostsData().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}/`,
    lastModified: toDate(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const talkRoutes = getSortedTalksData().map((talk) => ({
    url: `${siteUrl}/talk/${talk.id}/`,
    lastModified: toDate(talk.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const libraryCategoryRoutes = libraryCategories.map((category) => ({
    url: `${siteUrl}${category.href}/`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const libraryReviewRoutes = getAllLibraryItems()
    .filter((item) => item.hasReview)
    .map((item) => ({
      url: `${siteUrl}/library/${item.category}/${item.slug}/`,
      lastModified: toDate(item.date),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    }));

  const tagRoutes = getAllSiteTags().map((tag) => ({
    url: `${siteUrl}/blog/tag/${tag.slug}/`,
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  return [
    ...staticRoutes,
    ...blogRoutes,
    ...talkRoutes,
    ...libraryCategoryRoutes,
    ...libraryReviewRoutes,
    ...tagRoutes,
  ];
}
