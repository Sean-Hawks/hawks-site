import { getReadingCatalog } from "../lib/reading-catalog";

export const dynamic = "force-static";

// The interaction service only accepts IDs that still have a public detail page.
// Reuse the site's published-content filters instead of maintaining a second list.
export function GET() {
  return Response.json({
    articles: getReadingCatalog().map(({ id, href }) => ({ id, href })),
  });
}
