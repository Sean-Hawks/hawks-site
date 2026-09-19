import { DAY, validDay, shiftDay, today, sourceIdentity, runScheduled } from './archive.js';

const security = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
};
function json(data, status = 200) { return Response.json(data, { status, headers: security }); }
async function authenticated(request, secret) {
  if (typeof secret !== 'string' || secret.length < 32 || secret.length > 256) return false;
  const value = request.headers.get('Authorization') || '';
  if (!value.startsWith('Bearer ') || value.length > 263) return false;
  const encode = text => new TextEncoder().encode(text);
  const a = new Uint8Array(await crypto.subtle.digest('SHA-256', encode(value.slice(7))));
  const b = new Uint8Array(await crypto.subtle.digest('SHA-256', encode(secret)));
  let difference = 0;
  for (let index = 0; index < a.length; index++) difference |= a[index] ^ b[index];
  return difference === 0;
}

export function createHandler({ now = () => Date.now() } = {}) {
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
      if (!url.pathname.startsWith('/api/')) {
        if (!['/', '/app.js', '/style.css'].includes(url.pathname)) return json({ error: 'not_found' }, 404);
        const response = await env.ASSETS.fetch(request);
        const headers = new Headers(response.headers);
        for (const [key, value] of Object.entries(security)) headers.set(key, value);
        return new Response(response.body, { status: response.status, headers });
      }
      // Only the dashboard shell is public. No report, health or aggregate data leaks before auth.
      if (!env.DASHBOARD_TOKEN || !env.ANALYTICS_DB) return json({ error: 'not_configured' }, 503);
      if (!await authenticated(request, env.DASHBOARD_TOKEN)) return json({ error: 'unauthorized' }, 401);
      if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return json({ error: 'origin_not_allowed' }, 403);
      if (!env.REPORT_LIMIT || !(await env.REPORT_LIMIT.limit({ key: 'owner-reports' })).success) return json({ error: 'rate_limited' }, 429);
      if (!['/api/report', '/api/day'].includes(url.pathname)) return json({ error: 'not_found' }, 404);
      try {
        const identity = sourceIdentity(env);
        const source = await env.ANALYTICS_DB.prepare('SELECT identity FROM archive_source WHERE id=1').first();
        if (source && source.identity !== identity) return json({ error: 'archive_source_mismatch' }, 503);
        if (url.pathname === '/api/day') {
          const day = url.searchParams.get('date');
          if (!validDay(day)) return json({ error: 'invalid_date' }, 400);
          const row = await env.ANALYTICS_DB.prepare('SELECT payload FROM daily_stats WHERE day=?').bind(day).first();
          return row ? json(JSON.parse(row.payload)) : json({ error: 'day_not_archived' }, 404);
        }
        const from = url.searchParams.get('from') || env.ARCHIVE_START_DATE;
        const to = url.searchParams.get('to') || shiftDay(today(now()), -1);
        if (!validDay(from) || !validDay(to) || from > to || (Date.parse(to) - Date.parse(from)) / DAY > 36600) {
          return json({ error: 'invalid_range' }, 400);
        }
        const [{ results: days }, status] = await Promise.all([
          env.ANALYTICS_DB.prepare('SELECT day,pageviews,visits,sample_interval,captured_at FROM daily_stats WHERE day >= ? AND day <= ? ORDER BY day').bind(from, to).all(),
          env.ANALYTICS_DB.prepare('SELECT last_attempt,last_success,last_error FROM sync_state WHERE id=1').first(),
        ]);
        const end = to < today(now()) ? to : shiftDay(today(now()), -1);
        const start = from > env.ARCHIVE_START_DATE ? from : env.ARCHIVE_START_DATE;
        const expectedDays = end >= start ? Math.floor((Date.parse(end) - Date.parse(start)) / DAY) + 1 : 0;
        const total = days.reduce((a, d) => ({ pageviews: a.pageviews + d.pageviews, visits: a.visits + d.visits }), { pageviews: 0, visits: 0 });
        return json({ host: env.SITE_HOST, timeZone: env.TIME_ZONE, archiveStart: env.ARCHIVE_START_DATE,
          from, to, days, total, expectedDays, missingDays: Math.max(0, expectedDays - days.length),
          sampledDays: days.filter(d => d.sample_interval > 1).length,
          scheduleConfigured: Boolean(env.CF_ANALYTICS_TOKEN), status });
      } catch { return json({ error: 'archive_unavailable' }, 503); }
    },
    async scheduled(_controller, env, ctx) { ctx.waitUntil(runScheduled(env)); },
  };
}
export default createHandler();
