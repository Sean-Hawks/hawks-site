// One-off operator command. Uses an explicitly selected local Wrangler OAuth file;
// never uploads that broad OAuth credential into the scheduled Worker.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { archiveDay, validDay, shiftDay, today } from '../src/archive.js';

const { values } = parseArgs({ options: {
  config: { type: 'string', default: 'wrangler.production.jsonc' },
  'oauth-file': { type: 'string' }, from: { type: 'string' }, to: { type: 'string' },
  backup: { type: 'string' },
} });
if (!values['oauth-file'] || !values.backup) throw new Error('Provide --oauth-file and a private --backup directory outside this repository.');
const config = JSON.parse(await readFile(values.config, 'utf8'));
const text = await readFile(values['oauth-file'], 'utf8');
const tokenMatch = /^oauth_token\s*=\s*("[^"\r\n]+")\s*$/m.exec(text);
if (!tokenMatch) throw new Error('Wrangler OAuth token not found; run wrangler login.');
const token = JSON.parse(tokenMatch[1]);
const binding = config.d1_databases?.find(db => db.binding === 'ANALYTICS_DB');
if (!binding || !/^[a-f0-9-]{36}$/.test(binding.database_id) || !/^[a-f0-9]{32}$/.test(config.account_id)) throw new Error('Invalid production D1 configuration.');
const backup = path.resolve(values.backup);
if (backup === process.cwd() || backup.startsWith(process.cwd() + path.sep)) throw new Error('Keep analytics backups outside the repository.');
await mkdir(backup, { recursive: true, mode: 0o700 });

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.account_id}/d1/database/${binding.database_id}/query`;
async function execute(sql, params) {
  const response = await fetch(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) });
  const body = await response.json();
  if (!response.ok || !body.success || !body.result?.[0]?.success) throw new Error(`D1 request failed (${response.status}); no credentials logged.`);
  return body.result[0];
}
const db = { prepare(sql) {
  let params = [];
  return { bind(...p) { params = p; return this; }, run() { return execute(sql, params); }, all() { return execute(sql, params); }, async first() { return (await execute(sql, params)).results[0] || null; } };
} };
const env = { ...config.vars, ANALYTICS_DB: db, CF_ANALYTICS_TOKEN: token };
const from = values.from || env.ARCHIVE_START_DATE, to = values.to || shiftDay(today(), -1);
if (!validDay(from) || !validDay(to) || from > to || from < env.ARCHIVE_START_DATE || from < shiftDay(today(), -179) || to >= today()) throw new Error('Invalid backfill date range.');
for (let day = from; day <= to; day = shiftDay(day, 1)) {
  // Do not replace an existing high-fidelity archive with newly sampled historical data.
  const row = await db.prepare('SELECT payload FROM daily_stats WHERE day=?').bind(day).first();
  const snapshot = row ? JSON.parse(row.payload) : await archiveDay(env, day);
  await writeFile(path.join(backup, `${day}.json`), JSON.stringify(snapshot, null, 2) + '\n', { mode: 0o600 });
  console.log(`${day}: ${row ? 'already archived; backed up' : 'archived and backed up'}`);
}
