import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { Miniflare, Response as WorkerResponse, convertV4MiniflareOptions } from 'miniflare';
import { createHandler } from '../src/index.js';

const SITE = 'https://hawks.tw';
const SECRET = 'test-only-secret-'.repeat(4);
const token = () => randomBytes(32).toString('base64url');
const manifest = { articles: [
  { id: 'post:hello', href: '/blog/hello/' },
  { id: 'talk:2026-09-19', href: '/talk/2026-09-19/' },
  { id: 'library:books:example', href: '/library/books/example/' },
] };
const worker = new Miniflare(convertV4MiniflareOptions({
  modules: true,
  scriptPath: fileURLToPath(new URL('../src/index.js', import.meta.url)),
  compatibilityDate: '2026-09-18',
  d1Databases: { HEARTS_DB: 'test-hearts-database' },
  bindings: { HEARTS_SECRET: SECRET, SITE_ORIGIN: SITE, ALLOWED_ORIGINS: SITE },
  ratelimits: {
    HEARTS_READ_LIMIT: { namespace_id: '47101', simple: { limit: 120, period: 60 } },
    HEARTS_WRITE_LIMIT: { namespace_id: '47102', simple: { limit: 20, period: 60 } },
  },
  outboundService: async request => {
    assert.equal(request.url, `${SITE}/hearts.json`);
    return WorkerResponse.json(manifest);
  },
}));
let db;
before(async () => {
  db = await worker.getD1Database('HEARTS_DB');
  const migration = await readFile(new URL('../migrations/0001_hearts.sql', import.meta.url), 'utf8');
  await db.exec(migration.replace(/^--.*$/gm, '').replace(/\s+/g, ' '));
});
beforeEach(async () => { await db.prepare('DELETE FROM hearts').run(); });
after(async () => { await worker.dispose(); });

function fixture({ fetchManifest = async () => Response.json(manifest), now } = {}) {
  const readKeys = [];
  const writeKeys = [];
  return {
    handler: createHandler({ fetchManifest, ...(now ? { now } : {}) }),
    env: {
      HEARTS_SECRET: SECRET, SITE_ORIGIN: SITE, ALLOWED_ORIGINS: SITE, HEARTS_DB: db,
      HEARTS_READ_LIMIT: { limit: async ({ key }) => { readKeys.push(key); return { success: true }; } },
      HEARTS_WRITE_LIMIT: { limit: async ({ key }) => { writeKeys.push(key); return { success: true }; } },
    },
    readKeys, writeKeys,
  };
}
function request(id = 'post:hello', { method = 'GET', identity, liked, origin = SITE, ip = '203.0.113.17', headers = {}, body } = {}) {
  return new Request(`https://hearts.example/v1/hearts/${encodeURIComponent(id)}`, {
    method,
    headers: {
      ...(origin ? { Origin: origin } : {}),
      ...(ip ? { 'CF-Connecting-IP': ip } : {}),
      ...(identity ? { Authorization: `Bearer ${identity}` } : {}),
      ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}), ...headers,
    },
    ...(method === 'PUT' ? { body: body ?? JSON.stringify({ liked }) } : {}),
  });
}
async function call(context, id, options) { return context.handler.fetch(request(id, options), context.env); }
async function runtimeCall(id, options) {
  const input = request(id, options);
  return worker.dispatchFetch(input.url, { method: input.method, headers: Object.fromEntries(input.headers), ...(input.method === 'PUT' ? { body: await input.text() } : {}) });
}

test('real Worker runtime and D1 support public reads, authenticated PUT and CORS', async () => {
  const identity = token();
  let result = await runtimeCall('post:hello', { method: 'PUT', identity, liked: true });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { count: 1, liked: true });
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), SITE);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.headers.get('Access-Control-Allow-Credentials'), null);
  result = await runtimeCall('post:hello', { identity });
  assert.deepEqual(await result.json(), { count: 1, liked: true });
  result = await runtimeCall('post:hello', { origin: null });
  assert.deepEqual(await result.json(), { count: 1, liked: false });
});

test('duplicate/concurrent likes count once, unlike is idempotent, separate visitors count independently', async () => {
  const context = fixture();
  const identity = token();
  const likes = await Promise.all(Array.from({ length: 16 }, () => call(context, 'post:hello', { method: 'PUT', identity, liked: true })));
  for (const result of likes) assert.deepEqual(await result.json(), { count: 1, liked: true });
  const other = await call(context, 'post:hello', { method: 'PUT', identity: token(), liked: true });
  assert.deepEqual(await other.json(), { count: 2, liked: true });
  const unlikes = await Promise.all(Array.from({ length: 16 }, () => call(context, 'post:hello', { method: 'PUT', identity, liked: false })));
  for (const result of unlikes) assert.deepEqual(await result.json(), { count: 1, liked: false });
  assert.deepEqual(await (await call(context, 'post:hello', { identity })).json(), { count: 1, liked: false });
});

test('mixed concurrent writes return an atomic state matching each requested mutation', async () => {
  const context = fixture();
  const identity = token();
  const states = [true, false, true, false, true, false, true, false];
  const responses = await Promise.all(states.map(liked => call(context, 'post:hello', { method: 'PUT', identity, liked })));
  for (const [index, result] of responses.entries()) {
    assert.deepEqual(await result.json(), { count: states[index] ? 1 : 0, liked: states[index] });
  }
  const final = await (await call(context, 'post:hello', { identity })).json();
  assert.equal(final.count, final.liked ? 1 : 0);
});

test('persisted hashes differ across articles, never store a raw token or IP, and daily rate keys rotate', async () => {
  let time = Date.UTC(2026, 8, 19, 10);
  const context = fixture({ now: () => time });
  const identity = token();
  for (const article of manifest.articles) await call(context, article.id, { method: 'PUT', identity, liked: true });
  const rows = await db.prepare('SELECT article_id, actor_hash FROM hearts').all();
  assert.equal(rows.results.length, 3);
  assert.equal(new Set(rows.results.map(row => row.actor_hash)).size, 3);
  assert.ok(rows.results.every(row => /^[a-f0-9]{64}$/.test(row.actor_hash)));
  assert.ok(!JSON.stringify(rows.results).includes(identity));
  assert.ok(!JSON.stringify(rows.results).includes('203.0.113.17'));
  const firstKeys = context.writeKeys.slice(0, 2);
  time += 86400000;
  await call(context, 'post:hello', { method: 'PUT', identity, liked: true });
  assert.notDeepEqual(context.writeKeys.slice(-2), firstKeys);
  assert.ok([...context.writeKeys, ...context.readKeys].every(key => /^(?:ip|token):[a-f0-9]{64}$/.test(key)));
});

test('GET does not insert rows and malformed/unknown/private article IDs cannot allocate rows', async () => {
  const context = fixture();
  const identity = token();
  assert.deepEqual(await (await call(context, 'post:hello', { identity })).json(), { count: 0, liked: false });
  for (const id of ['post:private-draft', 'talk:missing', 'library:books:no-review']) {
    assert.equal((await call(context, id, { method: 'PUT', identity, liked: true })).status, 404);
  }
  for (const id of ['https://attacker.example/a', 'post:../hello', 'post:', 'x:hello', 'post:hello\n']) {
    assert.equal((await call(context, id, { method: 'PUT', identity, liked: true })).status, 400);
  }
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM hearts').first()).count, 0);
});

test('manifest requests coalesce and expire after at most 60 seconds; removal stops reads and writes', async () => {
  let time = 1000;
  let calls = 0;
  let current = manifest;
  const context = fixture({ now: () => time, fetchManifest: async (url, options) => {
    calls += 1;
    assert.equal(url, `${SITE}/hearts.json`);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.cf.cacheTtl, 0);
    return Response.json(current);
  } });
  const identity = token();
  await Promise.all(Array.from({ length: 8 }, () => call(context, 'post:hello')));
  assert.equal(calls, 1);
  time += 59999;
  await call(context, 'post:hello');
  assert.equal(calls, 1);
  current = { articles: [] };
  time += 1;
  assert.equal((await call(context, 'post:hello')).status, 404);
  assert.equal((await call(context, 'post:hello', { method: 'PUT', identity, liked: true })).status, 404);
  assert.equal(calls, 2);
});

test('expired, unavailable, invalid, oversized or redirected manifests fail closed', async () => {
  let time = 1000;
  let broken = false;
  const context = fixture({ now: () => time, fetchManifest: async () => {
    if (broken) throw new Error('network error with private details');
    return Response.json(manifest);
  } });
  await call(context, 'post:hello');
  broken = true;
  time += 60000;
  let result = await call(context, 'post:hello', { method: 'PUT', identity: token(), liked: true });
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { error: 'unavailable' });
  const fixtures = [
    () => new Response('redirect', { status: 302, headers: { Location: 'https://attacker.example/hearts.json' } }),
    () => new Response('{}', { headers: { 'Content-Type': 'text/html' } }),
    () => Response.json({ articles: [{ id: 'post:hello', href: '//attacker.example/' }] }),
    () => Response.json({ articles: [manifest.articles[0], manifest.articles[0]] }),
    () => Response.json({ articles: null }),
    () => new Response('x'.repeat(262145), { headers: { 'Content-Type': 'application/json' } }),
  ];
  for (const fetchManifest of fixtures) {
    result = await call(fixture({ fetchManifest }), 'post:hello');
    assert.equal(result.status, 503);
  }
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM hearts').first()).count, 0);
});

test('CORS uses exact origins and rejects missing write Origin, unsupported headers and methods', async () => {
  const context = fixture();
  const identity = token();
  for (const origin of [null, 'null', 'https://hawks.tw.attacker.example', 'https://attacker.example']) {
    const result = await call(context, 'post:hello', { method: 'PUT', identity, liked: true, origin });
    assert.equal(result.status, 403);
    assert.equal(result.headers.get('Access-Control-Allow-Origin'), null);
  }
  const preflight = await call(context, 'post:hello', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization, content-type' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Methods'), 'GET, PUT');
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), SITE);
  assert.equal((await call(context, 'post:hello', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'DELETE' } })).status, 403);
  assert.equal((await call(context, 'post:hello', { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'x-custom' } })).status, 403);
  assert.equal((await call(context, 'post:hello', { method: 'DELETE' })).status, 405);
});

test('writes require the exact token and tiny JSON schema, including streamed body limits', async () => {
  const context = fixture();
  for (const identity of [null, 'short', 'a'.repeat(44), '+'.repeat(43)]) {
    assert.equal((await call(context, 'post:hello', { method: 'PUT', identity, liked: true })).status, 401);
  }
  const identity = token();
  for (const body of ['null', '[]', '{"liked":1}', '{"liked":true,"count":100}', 'broken']) {
    assert.equal((await call(context, 'post:hello', { method: 'PUT', identity, body })).status, 400);
  }
  assert.equal((await call(context, 'post:hello', { method: 'PUT', identity, body: ' '.repeat(129) })).status, 413);
  assert.equal((await call(context, 'post:hello', { method: 'PUT', identity, liked: true, headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await call(context, 'post:hello', { method: 'PUT', identity, liked: true, headers: { 'Content-Encoding': 'gzip' } })).status, 415);
  const streamed = new Request(request('post:hello', { method: 'PUT', identity, liked: true }), {
    body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(' '.repeat(129))); controller.close(); } }), duplex: 'half',
  });
  assert.equal((await context.handler.fetch(streamed, context.env)).status, 413);
});

test('missing security config or missing trusted IP fails closed without touching D1', async () => {
  for (const key of ['HEARTS_SECRET', 'HEARTS_DB', 'SITE_ORIGIN', 'ALLOWED_ORIGINS', 'HEARTS_READ_LIMIT', 'HEARTS_WRITE_LIMIT']) {
    const context = fixture();
    delete context.env[key];
    assert.equal((await call(context, 'post:hello')).status, 503, key);
  }
  for (const override of [{ HEARTS_SECRET: 'short' }, { ALLOWED_ORIGINS: '*' }, { SITE_ORIGIN: 'https://hawks.tw/path' }]) {
    const context = fixture();
    Object.assign(context.env, override);
    assert.equal((await call(context, 'post:hello')).status, 503);
  }
  assert.equal((await call(fixture(), 'post:hello', { ip: null })).status, 503);
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM hearts').first()).count, 0);
});

test('read and write rate limits return retryable 429; limiter errors fail closed', async () => {
  const context = fixture();
  context.env.HEARTS_READ_LIMIT.limit = async () => ({ success: false });
  let result = await call(context, 'post:hello');
  assert.equal(result.status, 429);
  assert.equal(result.headers.get('Retry-After'), '60');
  let writes = 0;
  context.env.HEARTS_WRITE_LIMIT.limit = async () => ({ success: ++writes === 1 });
  result = await call(context, 'post:hello', { method: 'PUT', identity: token(), liked: true });
  assert.equal(result.status, 429); // IP succeeds; token limiter denies.
  context.env.HEARTS_READ_LIMIT.limit = async () => { throw new Error('binding unavailable'); };
  assert.equal((await call(context, 'post:hello')).status, 503);
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM hearts').first()).count, 0);
});

test('D1 batch rolls back mutation if the aggregate fails', async () => {
  await assert.rejects(db.batch([
    db.prepare('INSERT INTO hearts (article_id, actor_hash) VALUES (?, ?)').bind('post:hello', 'a'.repeat(64)),
    db.prepare('SELECT * FROM missing_table'),
  ]));
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM hearts').first()).count, 0);
});

test('slow request bodies and manifest fetches time out without touching D1', async () => {
  const context = fixture();
  const slowRequest = new Request(request('post:hello', { method: 'PUT', identity: token(), liked: true }), {
    body: new ReadableStream({ start() {} }), duplex: 'half',
  });
  const stalled = fixture({ fetchManifest: async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }) });
  const [body, fetchResult] = await Promise.all([context.handler.fetch(slowRequest, context.env), call(stalled, 'post:hello')]);
  assert.equal(body.status, 408);
  assert.equal(fetchResult.status, 503);
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM hearts').first()).count, 0);
});

test('real rate-limit binding eventually rejects repeated writes before they can inflate counts', async () => {
  const identity = token();
  const statuses = [];
  for (let index = 0; index < 22; index += 1) {
    const result = await runtimeCall('post:hello', { method: 'PUT', identity, liked: true, ip: '198.51.100.42' });
    statuses.push(result.status);
    await result.text();
  }
  assert.equal(statuses[0], 200);
  assert.equal(statuses.at(-1), 429);
  assert.ok(statuses.every(status => [200, 429].includes(status)));
  assert.equal((await db.prepare('SELECT COUNT(*) AS count FROM hearts').first()).count, 1);
});
