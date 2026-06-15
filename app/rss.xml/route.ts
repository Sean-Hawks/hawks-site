import { getSortedPostsData } from "../lib/posts";
import { excerpt } from "../lib/content";

export const dynamic = "force-static";

const siteUrl = "https://hawks.tw";

function escapeXml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET() {
  const posts = getSortedPostsData();
  const items = posts
    .map((post) => {
      const url = `${siteUrl}/blog/${post.slug}/`;
      const description = post.desc || excerpt(post.content);
      const date = post.date ? new Date(post.date).toUTCString() : new Date().toUTCString();

      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${url}</link>
          <guid>${url}</guid>
          <pubDate>${date}</pubDate>
          <description>${escapeXml(description)}</description>
        </item>
      `;
    })
    .join("");

  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>hawks.tw</title>
        <link>${siteUrl}</link>
        <description>Hawks 的個人網站與部落格</description>
        <language>zh-TW</language>
        ${items}
      </channel>
    </rss>`;

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
