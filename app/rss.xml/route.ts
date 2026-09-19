import { getFeedItems } from "../lib/feed-data";
import { renderFeed } from "../lib/feeds";
export const dynamic = "force-static";
export function GET() {
  return new Response(renderFeed(getFeedItems()), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
