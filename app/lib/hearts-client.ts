export const HEART_VISITOR_KEY = "hawks-heart-visitor-v1";
const validToken = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
const articleId = /^(?:(?:post|talk):[^\s:/\\?#\u0000-\u001f\u007f]+|library:[^\s:/\\?#\u0000-\u001f\u007f]+:[^\s:/\\?#\u0000-\u001f\u007f]+)$/u;

export type HeartValue = { count: number; liked: boolean };
export type HeartVisitor = { token: string | null; persistent: boolean };

export function heartsApiOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    const local = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !(url.protocol === "http:" && local)) ||
      url.username || url.password || url.search || url.hash || url.pathname !== "/"
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function createHeartVisitorStore(port: {
  storage: () => Pick<Storage, "getItem" | "setItem">;
  randomValues: (bytes: Uint8Array) => Uint8Array;
}) {
  let temporaryToken: string | null = null;
  let previouslyStored = false;
  return function getVisitor(create = false): HeartVisitor {
    let storage: Pick<Storage, "getItem" | "setItem"> | undefined;
    try {
      storage = port.storage();
      const stored = storage.getItem(HEART_VISITOR_KEY);
      if (validToken(stored)) {
        temporaryToken = stored;
        previouslyStored = true;
        return { token: stored, persistent: true };
      }
      if (previouslyStored) {
        // Respect explicit removal from storage instead of recreating an old ID.
        temporaryToken = null;
        previouslyStored = false;
      }
    } catch {
      storage = undefined;
    }
    // Simply reading an article never creates a visitor identifier.
    if (!temporaryToken && !create) return { token: null, persistent: Boolean(storage) };
    if (!temporaryToken) {
      const bytes = port.randomValues(new Uint8Array(32));
      temporaryToken = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    try {
      if (storage) {
        storage.setItem(HEART_VISITOR_KEY, temporaryToken);
        // Re-read so other tabs share the value currently in browser storage.
        const stored = storage.getItem(HEART_VISITOR_KEY);
        if (validToken(stored)) {
          temporaryToken = stored;
          previouslyStored = true;
          return { token: stored, persistent: true };
        }
      }
    } catch {
      // The same temporary identifier survives client-side navigation.
    }
    return { token: temporaryToken, persistent: false };
  };
}

export const getHeartVisitor = createHeartVisitorStore({
  storage: () => localStorage,
  randomValues: (bytes) => crypto.getRandomValues(bytes),
});

export class HeartRequestError extends Error {
  constructor(public readonly status: number | null = null) {
    super("Unable to confirm article hearts");
    this.name = "HeartRequestError";
  }
}

export async function requestHeart(
  origin: string,
  id: string,
  options: {
    token?: string | null;
    liked?: boolean;
    signal?: AbortSignal;
    fetcher?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<HeartValue> {
  const api = heartsApiOrigin(origin);
  if (!api || id.length > 256 || !articleId.test(id))
    throw new HeartRequestError();
  if (options.token != null && !validToken(options.token)) throw new HeartRequestError();
  const writing = typeof options.liked === "boolean";
  if (writing && !options.token) throw new HeartRequestError();
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, options.timeoutMs ?? 10_000);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (writing) headers["Content-Type"] = "application/json";
    const response = await (options.fetcher ?? fetch)(`${api}/v1/hearts/${encodeURIComponent(id)}`, {
      method: writing ? "PUT" : "GET",
      headers,
      ...(writing ? { body: JSON.stringify({ liked: options.liked }) } : {}),
      signal: controller.signal,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new HeartRequestError(response.status);
    const value: unknown = await response.json();
    if (
      !value || typeof value !== "object" ||
      !("count" in value) || !Number.isSafeInteger(value.count) || Number(value.count) < 0 ||
      !("liked" in value) || typeof value.liked !== "boolean"
    ) throw new HeartRequestError();
    return { count: value.count as number, liked: value.liked };
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
