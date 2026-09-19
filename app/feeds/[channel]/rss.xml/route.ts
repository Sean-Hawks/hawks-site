import { getFeedItems } from "../../../lib/feed-data";
import { renderFeed } from "../../../lib/feeds";
import { feedChannels } from "../../../lib/feed-channels";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() { return feedChannels.filter(feed => feed.id !== "all").map(feed => ({ channel: feed.id })); }
export async function GET(_request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const definition = feedChannels.find(feed => feed.id === channel && feed.id !== "all");
  if (!definition) return new Response("Feed not found", { status: 404 });
  return new Response(renderFeed(getFeedItems(), definition.id), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
