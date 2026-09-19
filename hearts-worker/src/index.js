const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const ARTICLE = /^(?:(?:post|talk):[^\s:/\\?#\u0000-\u001f\u007f]+|library:[^\s:/\\?#\u0000-\u001f\u007f]+:[^\s:/\\?#\u0000-\u001f\u007f]+)$/u;
const MAX_BODY = 128;
const MAX_MANIFEST = 256 * 1024;
const MANIFEST_TTL = 60_000;

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

function originValue(value) {
  if (typeof value !== 'string') throw new HttpError(503, 'unavailable');
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.origin !== value || (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))) {
    throw new HttpError(503, 'unavailable');
  }
  return value;
}

function configuration(env) {
  if (typeof env.HEARTS_SECRET !== 'string' || env.HEARTS_SECRET.length < 32 ||
      !env.HEARTS_DB?.prepare || !env.HEARTS_DB?.batch ||
      !env.HEARTS_READ_LIMIT?.limit || !env.HEARTS_WRITE_LIMIT?.limit) {
    throw new HttpError(503, 'unavailable');
  }
  const site = originValue(env.SITE_ORIGIN);
  const values = typeof env.ALLOWED_ORIGINS === 'string' ? env.ALLOWED_ORIGINS.split(',').map(value => value.trim()) : [];
  if (!values.length || values.length > 10) throw new HttpError(503, 'unavailable');
  const origins = new Set(values.map(originValue));
  return { site, origins };
}

function validArticle(id) { return typeof id === 'string' && id.length <= 256 && ARTICLE.test(id); }

async function boundedText(response, max, status = 413, code = 'body_too_large') {
  const length = response.headers.get('Content-Length');
  if (length && (!/^\d+$/.test(length) || Number(length) > max)) throw new HttpError(status, code);
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new HttpError(status === 503 ? 503 : 408, status === 503 ? 'unavailable' : 'body_timeout'));
      void reader.cancel().catch(() => {});
    }, 3000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new HttpError(status, code);
      }
      chunks.push(value);
    }
  } finally { clearTimeout(timer); reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new HttpError(status === 503 ? 503 : 400, status === 503 ? 'unavailable' : 'invalid_json'); }
}

function response(body, status, origin, extra = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Origin',
    ...extra,
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

function tokenFrom(request, required) {
  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    if (required) throw new HttpError(401, 'token_required');
    return null;
  }
  if (!authorization.startsWith('Bearer ') || !TOKEN.test(authorization.slice(7))) throw new HttpError(401, 'invalid_token');
  return authorization.slice(7);
}

function readState(db, article, actor) {
  return db.prepare('SELECT COUNT(*) AS count, COALESCE(MAX(actor_hash = ?), 0) AS liked FROM hearts WHERE article_id = ?').bind(actor, article);
}

function stateFrom(row) {
  if (!row || !Number.isSafeInteger(row.count) || row.count < 0 || ![0, 1].includes(row.liked)) throw new HttpError(503, 'unavailable');
  return { count: row.count, liked: row.liked === 1 };
}

// Dependencies are injectable for failure/time tests; production only uses native fetch/Date.now.
export function createHandler({ fetchManifest = fetch, now = Date.now } = {}) {
  let cache = null;
  let pending = null;
  let hmacKey = null;
  let keySecret = null;

  async function hash(secret, ...parts) {
    if (keySecret !== secret) {
      keySecret = secret;
      hmacKey = crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    }
    const bytes = await crypto.subtle.sign('HMAC', await hmacKey, new TextEncoder().encode(JSON.stringify(parts)));
    return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function articles(site) {
    if (cache?.site === site && now() < cache.expires) return cache.ids;
    if (pending?.site === site) return pending.promise;
    const promise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const result = await fetchManifest(`${site}/hearts.json`, {
          // Workers supports manual redirects; reject non-2xx below, never follow Location.
          redirect: 'manual', signal: controller.signal,
          headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
          cf: { cacheTtl: 0, cacheEverything: false },
        });
        if (!result.ok || !/^application\/json(?:\s*;|$)/i.test(result.headers.get('Content-Type') || '')) throw new HttpError(503, 'unavailable');
        const manifest = JSON.parse(await boundedText(result, MAX_MANIFEST, 503, 'unavailable'));
        if (!Array.isArray(manifest.articles) || manifest.articles.length > 10000) throw new HttpError(503, 'unavailable');
        const ids = new Set();
        for (const article of manifest.articles) {
          if (!article || !validArticle(article.id) || typeof article.href !== 'string' || !article.href.startsWith('/') ||
              article.href.startsWith('//') || new URL(article.href, site).origin !== site || ids.has(article.id)) {
            throw new HttpError(503, 'unavailable');
          }
          ids.add(article.id);
        }
        cache = { site, ids, expires: now() + MANIFEST_TTL };
        return ids;
      } catch { throw new HttpError(503, 'unavailable'); }
      finally { clearTimeout(timeout); controller.abort(); }
    })();
    pending = { site, promise };
    try { return await promise; }
    finally { if (pending?.promise === promise) pending = null; }
  }

  async function enforceLimit(request, env, token, write) {
    // Cloudflare overwrites this header at its edge. Never trust forwarded user headers instead.
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip || ip.length > 64 || !/^[0-9a-f:.]+$/i.test(ip)) throw new HttpError(503, 'unavailable');
    const day = new Date(now()).toISOString().slice(0, 10);
    const ipKey = await hash(env.HEARTS_SECRET, 'rate-ip', day, ip);
    const limiter = write ? env.HEARTS_WRITE_LIMIT : env.HEARTS_READ_LIMIT;
    if (!(await limiter.limit({ key: `ip:${ipKey}` }))?.success) throw new HttpError(429, 'rate_limited');
    if (write) {
      const tokenKey = await hash(env.HEARTS_SECRET, 'rate-token', day, token);
      if (!(await limiter.limit({ key: `token:${tokenKey}` }))?.success) throw new HttpError(429, 'rate_limited');
    }
  }

  return {
    async fetch(request, env) {
      let corsOrigin = null;
      try {
        const { site, origins } = configuration(env);
        const origin = request.headers.get('Origin');
        if (origin && !origins.has(origin)) throw new HttpError(403, 'origin_not_allowed');
        corsOrigin = origin;
        const url = new URL(request.url);
        const match = /^\/v1\/hearts\/([^/]+)$/.exec(url.pathname);
        if (!match) throw new HttpError(404, 'not_found');
        if (url.search) throw new HttpError(400, 'invalid_request');
        let article;
        try { article = decodeURIComponent(match[1]); } catch { throw new HttpError(400, 'invalid_article'); }
        if (!validArticle(article)) throw new HttpError(400, 'invalid_article');

        if (request.method === 'OPTIONS') {
          const method = request.headers.get('Access-Control-Request-Method');
          const headers = (request.headers.get('Access-Control-Request-Headers') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
          if (!origin || !['GET', 'PUT'].includes(method) || headers.some(name => !['authorization', 'content-type'].includes(name))) throw new HttpError(403, 'invalid_preflight');
          return response(null, 204, corsOrigin, {
            'Access-Control-Allow-Methods': 'GET, PUT',
            'Access-Control-Allow-Headers': 'Authorization, Content-Type',
            'Access-Control-Max-Age': '600',
            Vary: 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
          });
        }
        if (!['GET', 'PUT'].includes(request.method)) return response({ error: 'method_not_allowed' }, 405, corsOrigin, { Allow: 'GET, PUT, OPTIONS' });
        const write = request.method === 'PUT';
        if (write && !origin) throw new HttpError(403, 'origin_required');
        const token = tokenFrom(request, write);
        await enforceLimit(request, env, token, write);
        let liked;
        if (write) {
          if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('Content-Type') || '') || request.headers.has('Content-Encoding')) throw new HttpError(415, 'unsupported_media_type');
          let body;
          try { body = JSON.parse(await boundedText(request, MAX_BODY)); }
          catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, 'invalid_json'); }
          if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || typeof body.liked !== 'boolean') throw new HttpError(400, 'invalid_body');
          liked = body.liked;
        }
        if (!(await articles(site)).has(article)) throw new HttpError(404, 'article_not_found');
        const actor = token ? await hash(env.HEARTS_SECRET, 'heart', article, token) : null;
        if (!write) return response(stateFrom(await readState(env.HEARTS_DB, article, actor).first()), 200, corsOrigin);
        const mutation = liked
          ? env.HEARTS_DB.prepare('INSERT INTO hearts (article_id, actor_hash) VALUES (?, ?) ON CONFLICT (article_id, actor_hash) DO NOTHING').bind(article, actor)
          : env.HEARTS_DB.prepare('DELETE FROM hearts WHERE article_id = ? AND actor_hash = ?').bind(article, actor);
        const results = await env.HEARTS_DB.batch([mutation, readState(env.HEARTS_DB, article, actor)]);
        return response(stateFrom(results[1]?.results?.[0]), 200, corsOrigin);
      } catch (error) {
        const status = error instanceof HttpError ? error.status : 503;
        const code = error instanceof HttpError ? error.code : 'unavailable';
        return response({ error: code }, status, corsOrigin, status === 429 ? { 'Retry-After': '60' } : {});
      }
    },
  };
}

export default createHandler();
