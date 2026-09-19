export function canonicalArticleUrl(path: string) {
  const url = new URL(path, "https://hawks.tw");
  if (
    url.origin !== "https://hawks.tw" ||
    !/^\/(blog|talk|library)\/.+/.test(url.pathname)
  )
    throw new Error("Expected a site article path");
  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url.href;
}
export function articleCitation(title: string, url: string, date?: string) {
  return `${title} — Hawks${date ? `（${date}）` : ""}\n${url}`;
}
type SharePort = {
  share?: (data: { title: string; url: string }) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
};
export async function copyArticleText(
  text: string,
  port: SharePort,
): Promise<"copied" | "manual"> {
  try {
    if (!port.clipboard) return "manual";
    await port.clipboard.writeText(text);
    return "copied";
  } catch {
    return "manual";
  }
}
export async function shareArticle(
  title: string,
  url: string,
  port: SharePort,
): Promise<"shared" | "cancelled" | "copied" | "manual"> {
  if (port.share) {
    try {
      await port.share({ title, url });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError")
        return "cancelled";
    }
  }
  return copyArticleText(url, port);
}
