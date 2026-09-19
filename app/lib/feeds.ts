import type { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";
import { excerpt } from "./content";
import { feedChannels, type FeedChannel } from "./feed-channels";

const siteUrl = "https://hawks.tw";
export type FeedItem = { id: string; title: string; url: string; date: string; description: string; channel: Exclude<FeedChannel, "all">; category: string };
const publicStatus = (value?: string) => !["draft", "private"].includes(value?.trim().toLowerCase() ?? "");
export function buildFeedItems(posts: Post[], talks: Talk[], library: LibraryItem[]): FeedItem[] {
  return [
    ...posts.filter(post => publicStatus(post.status)).map(post => ({ id: `blog-${post.slug}`, title: post.title, url: `${siteUrl}/blog/${post.slug}/`, date: post.date, description: post.desc || excerpt(post.content), channel: "blog" as const, category: "Blog" })),
    ...talks.filter(talk => publicStatus(talk.status)).map(talk => ({ id: `talk-${talk.id}`, title: talk.title, url: `${siteUrl}/talk/${talk.id}/`, date: talk.date, description: excerpt(talk.desc, 180), channel: "talk" as const, category: "Talk" })),
    ...library.filter(item => item.hasReview && publicStatus(item.statusVisibility)).map(item => ({ id: `library-${item.category}-${item.slug}`, title: `評論：${item.title}`, url: `${siteUrl}/library/${item.category}/${item.slug}/`, date: item.date, description: item.note || excerpt(item.content, 180), channel: "library" as const, category: "Library Review" })),
  ];
}
const timestamp = (date: string) => Date.parse(date) || 0;
function rssDate(date: string) { return Number.isNaN(Date.parse(date)) ? "" : new Date(date).toUTCString(); }
function xml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
export function selectFeedItems(items: FeedItem[], channel: FeedChannel) {
  return items.filter(item => channel === "all" || item.channel === channel)
    .sort((a, b) => timestamp(b.date) - timestamp(a.date) || a.id.localeCompare(b.id)).slice(0, 50);
}
export function renderFeed(items: FeedItem[], channel: FeedChannel = "all") {
  const definition = feedChannels.find(feed => feed.id === channel)!;
  const selected = selectFeedItems(items, channel);
  const updated = selected[0] && rssDate(selected[0].date);
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${xml(channel === "all" ? "hawks.tw" : `hawks.tw · ${definition.title}`)}</title>
<link>${siteUrl}</link><atom:link href="${siteUrl}${definition.path}" rel="self" type="application/rss+xml"/>
<description>${xml(definition.description)}</description><language>zh-TW</language>
${updated ? `<lastBuildDate>${updated}</lastBuildDate>` : ""}
${selected.map(item => `<item><title>${xml(item.title)}</title><link>${xml(item.url)}</link><guid isPermaLink="true">${xml(item.url)}</guid>${rssDate(item.date) ? `<pubDate>${rssDate(item.date)}</pubDate>` : ""}<category>${xml(item.category)}</category><description>${xml(item.description)}</description></item>`).join("\n")}
</channel></rss>`;
}
