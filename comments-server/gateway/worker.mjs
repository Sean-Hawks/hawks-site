const ORIGIN = "https://hawks.tw";
const API_ORIGIN = "https://hawks-comments.sean-hawks.workers.dev";
const MAX_BODY = 12 * 1024;

function error(request, status, message) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    Vary: "Origin",
  };
  if (request.headers.get("Origin") === ORIGIN)
    headers["Access-Control-Allow-Origin"] = ORIGIN;
  return new Response(JSON.stringify({ error: message }), { status, headers });
}

async function readBody(request) {
  if (!request.body) return null;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return false;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

const gateway = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const health = url.pathname === "/healthz";
    const messages = url.pathname === "/v1/comments/messages";
    const notification = [
      "/v1/comments/notifications/confirm",
      "/v1/comments/notifications/unsubscribe",
    ].includes(url.pathname);
    const routes = {
      "/healthz": ["GET"],
      "/v1/comments/messages": ["GET", "POST"],
      "/v1/comments/config": ["GET"],
      "/v1/comments/auth/me": ["GET"],
      "/v1/comments/auth/logout": ["POST"],
      "/v1/comments/auth/github/start": ["POST"],
      "/v1/comments/auth/github/session": ["POST"],
      "/v1/comments/auth/github/callback": ["GET"],
      "/v1/comments/notifications/confirm": ["GET", "POST"],
      "/v1/comments/notifications/unsubscribe": ["GET", "POST"],
    };
    const methods = routes[url.pathname];
    if (!methods) return error(request, 404, "找不到此 API。");
    if (request.method !== "OPTIONS" && !methods.includes(request.method))
      return error(request, 405, "不支援此操作。");
    const origin = request.headers.get("Origin");
    if (origin && origin !== ORIGIN && !(notification && origin === API_ORIGIN))
      return error(request, 403, "不允許此網站連線。");
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
          "Access-Control-Allow-Methods": [...methods, "OPTIONS"].join(", "),
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "no-store",
          Vary: "Origin",
        },
      });
    }
    // Cloudflare supplies this header from the incoming connection. Never
    // forward visitor-supplied proxy chains, cookies, or administrator tokens.
    const ip = request.headers.get("CF-Connecting-IP");
    if (!health && !ip) return error(request, 403, "缺少代理資訊。");
    const headers = new Headers();
    for (const name of ["Origin", "Content-Type", "CF-Connecting-IP"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const authorization = request.headers.get("Authorization");
    if (
      (messages ||
        ["/v1/comments/auth/me", "/v1/comments/auth/logout"].includes(
          url.pathname,
        )) &&
      /^Bearer hcs_[A-Za-z0-9_-]{43}$/.test(authorization || "")
    )
      headers.set("Authorization", authorization);
    try {
      const body = request.method === "POST" ? await readBody(request) : null;
      if (body === false) return error(request, 413, "訊息太長。");
      // A fixed VPC service and fixed origin prevent this from becoming an
      // arbitrary proxy into WSL. Administrator deletion remains local-only.
      const target = new URL("http://127.0.0.1:8790");
      target.pathname = url.pathname;
      target.search = url.search;
      const response = await env.COMMENTS_BACKEND.fetch(
        new Request(target, {
          method: request.method,
          headers,
          body,
          redirect: "manual",
          signal: AbortSignal.timeout(
            url.pathname.endsWith("/callback") ? 20_000 : 10_000,
          ),
        }),
      );
      if (response.status >= 300 && response.status < 400)
        return error(request, 503, "留言服務暫時無法連線，請稍後再試。");
      return response;
    } catch {
      return error(request, 503, "留言服務暫時無法連線，請稍後再試。");
    }
  },
};
export default gateway;
