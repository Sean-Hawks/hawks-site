export const DAY = 86400000;
const OFFSET = 8 * 3600000;
const PAGE_SIZE = 500;
const MAX_PAGES = 10;
const MAX_BYTES = 2 * 1024 * 1024;

export function validDay(day) {
  return typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day;
}
export function shiftDay(day, count) {
  if (!validDay(day)) throw new Error('invalid_date');
  return new Date(Date.parse(day) + count * DAY).toISOString().slice(0, 10);
}
export function today(now = Date.now()) { return new Date(now + OFFSET).toISOString().slice(0, 10); }
export function dayWindow(day) {
  if (!validDay(day)) throw new Error('invalid_date');
  const start = Date.parse(day) - OFFSET;
  return { datetime_geq: new Date(start).toISOString(), datetime_lt: new Date(start + DAY).toISOString() };
}
export function sourceIdentity(env) {
  if (!/^[a-f0-9]{32}$/.test(env.CF_ACCOUNT_ID || '') || !/^[a-f0-9]{32}$/.test(env.CF_SITE_TAG || '') ||
      env.SITE_HOST !== 'hawks.tw' || env.TIME_ZONE !== 'Asia/Taipei' || !validDay(env.ARCHIVE_START_DATE)) {
    throw new Error('invalid_configuration');
  }
  return JSON.stringify([env.CF_ACCOUNT_ID, env.CF_SITE_TAG, env.SITE_HOST, env.TIME_ZONE, env.ARCHIVE_START_DATE, 'bot=0', 1]);
}
export async function ensureSource(db, env) {
  const identity = sourceIdentity(env);
  await db.prepare('INSERT OR IGNORE INTO archive_source (id, identity) VALUES (1, ?)').bind(identity).run();
  const row = await db.prepare('SELECT identity FROM archive_source WHERE id = 1').first();
  if (row?.identity !== identity) throw new Error('archive_source_mismatch');
}

async function boundedJson(response) {
  if (Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('upstream_response_too_large');
  if (!response.body) throw new Error('invalid_upstream_response');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('upstream_response_too_large');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error('invalid_upstream_response'); }
}

export async function queryGroups(env, filter, dimension, fetcher = fetch) {
  sourceIdentity(env);
  if (!env.CF_ANALYTICS_TOKEN) throw new Error('analytics_token_missing');
  if (dimension && !['requestPath', 'refererHost'].includes(dimension)) throw new Error('invalid_dimension');
  const query = `query ArchiveDay($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject!) {
    viewer { accounts(filter: {accountTag: $account}) {
      rows: rumPageloadEventsAdaptiveGroups(limit: ${dimension ? PAGE_SIZE : 1}, filter: $filter
        ${dimension ? `, orderBy: [${dimension}_ASC]` : ''}) {
        count sum { visits } avg { sampleInterval } ${dimension ? `dimensions { ${dimension} }` : ''}
      }
    } }
  }`;
  let response;
  try {
    response = await fetcher('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${env.CF_ANALYTICS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { account: env.CF_ACCOUNT_ID, filter } }),
    });
  } catch { throw new Error('analytics_network_error'); }
  if (!response.ok) throw new Error(`analytics_http_${response.status}`);
  const data = await boundedJson(response);
  // GraphQL can return HTTP 200 with partial data. Never commit that as a zero day.
  if (data.errors?.length) throw new Error('analytics_query_error');
  const accounts = data.data?.viewer?.accounts;
  if (!Array.isArray(accounts) || accounts.length !== 1 || !Array.isArray(accounts[0]?.rows)) {
    throw new Error('invalid_upstream_response');
  }
  if (accounts[0].rows.length > (dimension ? PAGE_SIZE : 1)) throw new Error('invalid_upstream_response');
  return accounts[0].rows.map(row => {
    const pageviews = row.count, visits = row.sum?.visits, sampleInterval = row.avg?.sampleInterval;
    if (![pageviews, visits].every(n => Number.isSafeInteger(n) && n >= 0) ||
        !Number.isFinite(sampleInterval) || sampleInterval < 1) throw new Error('invalid_upstream_metrics');
    const key = dimension ? row.dimensions?.[dimension] : undefined;
    if (dimension && (typeof key !== 'string' || key.length > 2048 || /[\u0000-\u001f]/.test(key))) {
      throw new Error('invalid_upstream_dimension');
    }
    return { ...(dimension ? { key } : {}), pageviews, visits, sampleInterval };
  });
}

async function breakdown(env, filter, dimension, fetcher) {
  const rows = [], seen = new Set();
  let cursor;
  for (let page = 0; page < MAX_PAGES; page++) {
    const batch = await queryGroups(env, { ...filter, ...(cursor !== undefined ? { [`${dimension}_gt`]: cursor } : {}) }, dimension, fetcher);
    for (const row of batch) {
      if (seen.has(row.key)) throw new Error('non_advancing_pagination');
      seen.add(row.key); rows.push(row);
    }
    if (batch.length < PAGE_SIZE) return rows;
    cursor = batch.at(-1).key;
  }
  // Do not silently save a truncated top-N list as complete annual statistics.
  throw new Error('daily_dimension_limit_exceeded');
}

export async function collectDay(env, day, { fetcher = fetch, now = Date.now() } = {}) {
  sourceIdentity(env);
  if (!validDay(day) || day < env.ARCHIVE_START_DATE || day >= today(now) || day < shiftDay(today(now), -179)) {
    throw new Error('day_outside_collectable_range');
  }
  const filter = { ...dayWindow(day), siteTag: env.CF_SITE_TAG, requestHost: env.SITE_HOST, bot: 0 };
  const totals = await queryGroups(env, filter, null, fetcher);
  // Retrieve all dimensions before writing anything to D1.
  const pages = await breakdown(env, filter, 'requestPath', fetcher);
  const sources = await breakdown(env, filter, 'refererHost', fetcher);
  if (!totals.length && (pages.length || sources.length)) throw new Error('inconsistent_upstream_response');
  return {
    version: 1, day, capturedAt: new Date(now).toISOString(), source: sourceIdentity(env),
    totals: totals[0] || { pageviews: 0, visits: 0, sampleInterval: null }, pages, sources,
  };
}

export async function storeDay(db, env, snapshot) {
  await ensureSource(db, env);
  if (snapshot.source !== sourceIdentity(env)) throw new Error('archive_source_mismatch');
  const payload = JSON.stringify(snapshot);
  if (new TextEncoder().encode(payload).length > 1024 * 1024) throw new Error('daily_snapshot_too_large');
  const { pageviews, visits, sampleInterval } = snapshot.totals;
  // A single row replacement is atomic; reruns never add the same day's totals twice.
  // Older overlapping requests cannot replace newer captures.
  await db.prepare(`INSERT INTO daily_stats (day,pageviews,visits,sample_interval,captured_at,payload)
    VALUES (?,?,?,?,?,?) ON CONFLICT(day) DO UPDATE SET
    pageviews=excluded.pageviews,visits=excluded.visits,sample_interval=excluded.sample_interval,
    captured_at=excluded.captured_at,payload=excluded.payload
    WHERE excluded.captured_at > daily_stats.captured_at`).bind(
    snapshot.day, pageviews, visits, sampleInterval, snapshot.capturedAt, payload,
  ).run();
}

export async function archiveDay(env, day, options) {
  // Detect accidental source changes before spending API queries.
  await ensureSource(env.ANALYTICS_DB, env);
  const snapshot = await collectDay(env, day, options);
  await storeDay(env.ANALYTICS_DB, env, snapshot);
  return snapshot;
}

export async function runScheduled(env, { now = Date.now(), fetcher = fetch } = {}) {
  await ensureSource(env.ANALYTICS_DB, env);
  const stamp = new Date(now).toISOString();
  await env.ANALYTICS_DB.prepare('INSERT INTO sync_state (id,last_attempt) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET last_attempt=excluded.last_attempt').bind(stamp).run();
  try {
    const current = today(now);
    const recent = [1, 2, 3].map(n => shiftDay(current, -n)).filter(day => day >= env.ARCHIVE_START_DATE);
    const floor = [env.ARCHIVE_START_DATE, shiftDay(current, -179)].sort().at(-1);
    const { results } = await env.ANALYTICS_DB.prepare('SELECT day FROM daily_stats WHERE day >= ? ORDER BY day').bind(floor).all();
    const saved = new Set(results.map(row => row.day));
    // One older missing day per run allows recovery after an outage without rewriting
    // already archived old days using Cloudflare's lower-fidelity historical sample.
    for (let day = floor; day < current; day = shiftDay(day, 1)) {
      if (!saved.has(day) && !recent.includes(day)) { recent.push(day); break; }
    }
    for (const day of recent) await archiveDay(env, day, { now, fetcher });
    await env.ANALYTICS_DB.prepare('UPDATE sync_state SET last_success=?,last_error=NULL WHERE id=1').bind(stamp).run();
    return { archived: recent };
  } catch (error) {
    const safe = /^[a-z_]+(?:_\d{3})?$/.test(error.message) ? error.message : 'archive_failed';
    await env.ANALYTICS_DB.prepare('UPDATE sync_state SET last_error=? WHERE id=1').bind(safe).run();
    throw new Error(safe);
  }
}
