export type CommentMessage = {
  id: number;
  page: string;
  name: string;
  body: string;
  replyTo: number | null;
  createdAt: string;
  deleted: number;
  githubId?: number | null;
  githubLogin?: string | null;
};
export type CommentUser = {
  githubId: number;
  githubLogin: string;
  name: string;
  avatarUrl: string;
};
export type CommentFeatures = { githubEnabled: boolean; emailEnabled: boolean };
export type CommentHistory = { messages: CommentMessage[]; hasMore: boolean };

export function commentsApiOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}
export function commentPageKey(pathname: string): string {
  const path = pathname.replace(/\/+$/, "");
  return path ? `${path}/` : "/";
}
export function mergeComments(
  current: CommentMessage[],
  incoming: CommentMessage[],
): CommentMessage[] {
  const items = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) items.set(item.id, item);
  return [...items.values()].sort((a, b) => a.id - b.id);
}
export async function commentsRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("留言服務回應異常，請稍後再試。");
  }
  if (!data || typeof data !== "object")
    throw new Error("留言服務回應異常，請稍後再試。");
  if (!response.ok)
    throw new Error(
      typeof data.error === "string" ? data.error : "留言服務暫時無法使用。",
    );
  return data as T;
}
