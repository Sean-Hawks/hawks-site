import { getSortedPostsData } from "../lib/posts";
import { getSortedTalksData } from "../lib/talks";
import { getAllLibraryItems } from "../lib/library";
import { excerpt } from "../lib/content";

export const dynamic = "force-static";

const siteUrl = "https://hawks.tw";
const feedUrl = `${siteUrl}/rss.xml`;

type FeedItem = {
  id: string;
  title: string;
  url: string;
  date: string;
  description: string;
  category: "Blog" | "Talk" | "Library Review";
};

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toTimestamp(date: string) {
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function toRssDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toUTCString();
}

export function GET() {
  const posts = getSortedPostsData();
  const talks = getSortedTalksData();
  const libraryItems = getAllLibraryItems();

  const feedItems: FeedItem[] = [
    ...posts.map((post) => ({
      id: `blog-${post.slug}`,
      title: post.title,
      url: `${siteUrl}/blog/${post.slug}/`,
      date: post.date,
      description: post.desc || excerpt(post.content),
      category: "Blog" as const,
    })),
    ...talks.map((talk) => ({
      id: `talk-${talk.id}`,
      title: talk.title,
      url: `${siteUrl}/talk/${talk.id}/`,
      date: talk.date,
      description: excerpt(talk.desc, 180),
      category: "Talk" as const,
    })),
    ...libraryItems
      .filter((item) => item.hasReview)
      .map((item) => ({
        id: `library-${item.slug}`,
        title: `評論：${item.title}`,
        url: `${siteUrl}/library/${item.category}/${item.slug}/`,
        date: item.date,
        description: item.note || excerpt(item.content, 180),
        category: "Library Review" as const,
      })),
  ]
    .sort((a, b) => toTimestamp(b.date) - toTimestamp(a.date) || a.id.localeCompare(b.id))
    .slice(0, 50);

  const items = feedItems
    .map((item) => {
      const date = toRssDate(item.date);

      return `
        <item>
          <title>${escapeXml(item.title)}</title>
          <link>${item.url}</link>
          <guid isPermaLink="true">${item.url}</guid>
          ${date ? `<pubDate>${date}</pubDate>` : ""}
          <category>${escapeXml(item.category)}</category>
          <description>${escapeXml(item.description)}</description>
        </item>
      `;
    })
    .join("");

  const lastBuildDate = feedItems[0]?.date ? toRssDate(feedItems[0].date) : "";
  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
    <?xml-stylesheet type="text/xsl" href="/rss.xsl"?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>hawks.tw</title>
        <link>${siteUrl}</link>
        <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
        <description>Hawks 的 Blog、Talk、Library Review 與網站更新</description>
        <language>zh-TW</language>
        ${lastBuildDate ? `<lastBuildDate>${lastBuildDate}</lastBuildDate>` : ""}
        ${items}
      </channel>
    </rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
