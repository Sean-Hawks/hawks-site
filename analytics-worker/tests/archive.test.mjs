import assert from 'node:assert/strict';
import { test, before, beforeEach, after } from 'node:test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { dayWindow, validDay, today, collectDay, storeDay, archiveDay, runScheduled, ensureSource } from '../src/archive.js';
import { createHandler } from '../src/index.js';

const NOW = Date.parse('2026-09-19T06:00:00Z');
const DAY = '2026-09-18';
const SECRET = 'test-dashboard-only-'.repeat(3);
const base = { CF_ACCOUNT_ID: 'a'.repeat(32), CF_SITE_TAG: 'b'.repeat(32), SITE_HOST: 'hawks.tw', TIME_ZONE: 'Asia/Taipei', ARCHIVE_START_DATE: '2026-09-14', CF_ANALYTICS_TOKEN: 'test-analytics-only' };
const runtime = new Miniflare(convertV4MiniflareOptions({
  modules: ['index.js','archive.js'].map(name => ({ type:'ESModule', path:fileURLToPath(new URL('../src/'+name,import.meta.url)) })),
  modulesRoot: fileURLToPath(new URL('../src',import.meta.url)), compatibilityDate: '2026-09-18',
  d1Databases: { ANALYTICS_DB: 'test-analytics' }, bindings: { ...base, DASHBOARD_TOKEN: SECRET },
  ratelimits: { REPORT_LIMIT: { namespace_id:'47103', simple:{limit:60,period:60} } },
}));
let db;
before(async () => {
  db=await runtime.getD1Database('ANALYTICS_DB');
  const sql=await readFile(new URL('../migrations/0001_archive.sql',import.meta.url),'utf8');
  await db.exec(sql.replace(/\s+/g,' '));
});
beforeEach(async()=>{await db.batch(['daily_stats','archive_source','sync_state'].map(table=>db.prepare(`DELETE FROM ${table}`)));});
after(async()=>{await runtime.dispose();});
const env = () => ({...base,ANALYTICS_DB:db,DASHBOARD_TOKEN:SECRET,REPORT_LIMIT:{limit:async()=>({success:true})}});
function result(rows, errors=null) { return Response.json({data:{viewer:{accounts:[{rows}]}},errors}); }
function row(count=12, dimension, key='/', visits=3) {return {count,sum:{visits},avg:{sampleInterval:1},...(dimension?{dimensions:{[dimension]:key}}:{})};}
function fakeFetch({failDimension,empty=false,seen=[]}={}) {
  return async(url,options)=>{
    assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');
    assert.equal(options.redirect,'manual');
    const request=JSON.parse(options.body);seen.push(request);
    const dimension=/dimensions \{ (\w+) \}/.exec(request.query)?.[1];
    if(dimension===failDimension && failDimension)return result([], [{message:'do not expose upstream text'}]);
    return result(empty?[]:[row(12,dimension,dimension==='refererHost'?'google.com':'/blog/hello/')]);
  };
}
function options(extra={}) {return {now:NOW,fetcher:fakeFetch(),...extra};}
async function call(path='/api/report',overrides={},headers={Authorization:`Bearer ${SECRET}`}) {
  return createHandler({now:()=>NOW}).fetch(new Request('https://analytics.example'+path,{headers}),{...env(),...overrides});
}

test('Taiwan calendar days are half-open UTC windows, including leap years',()=>{
  assert.deepEqual(dayWindow('2026-09-18'),{datetime_geq:'2026-09-17T16:00:00.000Z',datetime_lt:'2026-09-18T16:00:00.000Z'});
  assert.equal(today(Date.parse('2026-09-18T16:01:00Z')),'2026-09-19');
  assert.equal(validDay('2026-02-29'),false);assert.equal(validDay('2024-02-29'),true);
});
test('archive queries pin site, hostname, bot exclusion, timezone; sampled counts are not multiplied',async()=>{
  const seen=[];
  const snapshot=await collectDay(env(),DAY,options({fetcher:fakeFetch({seen})}));
  assert.equal(snapshot.totals.pageviews,12);assert.equal(snapshot.pages[0].key,'/blog/hello/');
  for(const request of seen){assert.equal(request.variables.filter.bot,0);assert.equal(request.variables.filter.siteTag,base.CF_SITE_TAG);assert.equal(request.variables.filter.requestHost,'hawks.tw');assert.equal(request.variables.filter.datetime_lt,'2026-09-18T16:00:00.000Z');}
  await assert.rejects(()=>collectDay(env(),'2026-09-19',options()),/day_outside/);
});
test('all pages of dimensions are archived, including the empty referrer key',async()=>{
  const seen=[];
  const fetcher=async(_url,options)=>{
    const {query,variables:{filter}}=JSON.parse(options.body);seen.push(filter);
    if(query.includes('dimensions { requestPath }')) return result(filter.requestPath_gt ? [row(2,'requestPath','/last')] : Array.from({length:500},(_,i)=>row(1,'requestPath','/'+String(i).padStart(3,'0'),0)));
    if(query.includes('dimensions { refererHost }'))return result([row(3,'refererHost','')]);
    return result([row(502)]);
  };
  const snapshot=await collectDay(env(),DAY,options({fetcher}));
  assert.equal(snapshot.pages.length,501);assert.equal(snapshot.sources[0].key,'');assert.ok(seen.some(filter=>filter.requestPath_gt==='/499'));
});
test('non-advancing pagination fails rather than double-counting dimensions',async()=>{
  const fetcher=async(_url,options)=>JSON.parse(options.body).query.includes('dimensions { requestPath }')?result(Array.from({length:500},(_,i)=>row(1,'requestPath','/'+i))):result([row()]);
  await assert.rejects(()=>collectDay(env(),DAY,options({fetcher})),/non_advancing/);
});
test('HTTP errors, GraphQL partial errors, missing account and invalid numbers never become zero traffic',async()=>{
  for(const response of [new Response('denied',{status:403}),result([row()], [{message:'partial'}]),Response.json({data:{viewer:{accounts:[]}}}),result([{...row(),count:-1}])]) {
    await assert.rejects(()=>collectDay(env(),DAY,options({fetcher:async()=>response}))); }
});
test('zero traffic is saved only after all three successful empty queries',async()=>{
  const snapshot=await archiveDay(env(),DAY,options({fetcher:fakeFetch({empty:true})}));
  assert.equal(snapshot.totals.pageviews,0);assert.equal(snapshot.totals.sampleInterval,null);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM daily_stats').first()).n,1);
});
test('failed source detail query preserves the previous complete day',async()=>{
  await archiveDay(env(),DAY,options());
  await assert.rejects(()=>archiveDay(env(),DAY,options({fetcher:fakeFetch({failDimension:'refererHost'})})),/analytics_query_error/);
  assert.equal((await db.prepare('SELECT pageviews FROM daily_stats WHERE day=?').bind(DAY).first()).pageviews,12);
});
test('idempotent atomic daily replacement rejects an older overlapping capture',async()=>{
  const snapshot=await collectDay(env(),DAY,options());
  await storeDay(db,env(),snapshot);await storeDay(db,env(),snapshot);
  await storeDay(db,env(),{...snapshot,capturedAt:'2026-09-18T20:00:00Z',totals:{...snapshot.totals,pageviews:99}});
  assert.equal((await db.prepare('SELECT SUM(pageviews) AS n FROM daily_stats').first()).n,12);
  await storeDay(db,env(),{...snapshot,capturedAt:'2026-09-19T07:00:00Z',totals:{...snapshot.totals,pageviews:13}});
  assert.equal((await db.prepare('SELECT SUM(pageviews) AS n FROM daily_stats').first()).n,13);
});
test('changing source configuration cannot mix different sites into the archive',async()=>{
  await ensureSource(db,env());
  await assert.rejects(()=>archiveDay({...env(),CF_SITE_TAG:'c'.repeat(32)},DAY,options()),/source_mismatch/);
});
test('cron refreshes three recent days and repairs an older gap; reruns do not accumulate',async()=>{
  const first=await runScheduled(env(),options());assert.deepEqual(first.archived,['2026-09-18','2026-09-17','2026-09-16','2026-09-14']);
  const second=await runScheduled(env(),options());assert.ok(second.archived.includes('2026-09-15'));
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM daily_stats').first()).n,5);
  assert.equal((await db.prepare('SELECT last_error FROM sync_state').first()).last_error,null);
});
test('cron failure is visible and does not claim success',async()=>{
  await assert.rejects(()=>runScheduled(env(),options({fetcher:fakeFetch({failDimension:'refererHost'})})),/analytics_query_error/);
  const state=await db.prepare('SELECT * FROM sync_state').first();assert.equal(state.last_success,null);assert.equal(state.last_error,'analytics_query_error');
});
test('private report, details and unknown API routes require the dashboard credential',async()=>{
  for(const path of ['/api/report','/api/day?date='+DAY,'/api/unknown']) {
    assert.equal((await call(path,{},{})).status,401);
    assert.equal((await call(path,{}, {Authorization:`Bearer ${base.CF_ANALYTICS_TOKEN}`})).status,401);
  }
  assert.equal((await call('/api/report',{DASHBOARD_TOKEN:''})).status,503);
  assert.equal((await call('/api/report',{}, {Authorization:`Bearer ${SECRET}`,Origin:'https://evil.example'})).status,403);
  assert.equal((await call('/api/report',{REPORT_LIMIT:{limit:async()=>({success:false})}})).status,429);
});
test('reports expose missing days, retain zero days, and keep credentials out of JSON',async()=>{
  await archiveDay(env(),DAY,options({fetcher:fakeFetch({empty:true})}));
  const response=await call();assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
  const data=await response.json();assert.equal(data.expectedDays,5);assert.equal(data.missingDays,4);assert.equal(data.days.length,1);assert.equal(data.total.pageviews,0);
  assert.ok(!JSON.stringify(data).includes(base.CF_ANALYTICS_TOKEN));assert.ok(!JSON.stringify(data).includes(SECRET));
  assert.equal((await call('/api/day?date=2026-09-17')).status,404);
  assert.equal((await call('/api/report?from=2026-02-30&to=2026-09-19')).status,400);
});
test('real Worker runtime enforces report authentication and reads D1',async()=>{
  await archiveDay(env(),DAY,options());
  const publicResponse=await runtime.dispatchFetch('https://analytics.example/api/report');assert.equal(publicResponse.status,401);
  const response=await runtime.dispatchFetch('https://analytics.example/api/report?from=2026-09-18&to=2026-09-18',{headers:{Authorization:`Bearer ${SECRET}`}});
  assert.equal(response.status,200);assert.equal((await response.json()).total.pageviews,12);
});

test('reports cross calendar years and preserve the original sampling estimate',async()=>{
  const settings={...env(),ARCHIVE_START_DATE:'2025-12-31'};
  const clock=Date.parse('2026-01-03T06:00:00Z');
  const sampled=async(_url,options)=>{
    const dimension=/dimensions \{ (\w+) \}/.exec(JSON.parse(options.body).query)?.[1];
    return result([{...row(20,dimension,'/'),avg:{sampleInterval:10}}]);
  };
  await archiveDay(settings,'2025-12-31',{now:clock,fetcher:sampled});
  await archiveDay(settings,'2026-01-01',{now:clock,fetcher:sampled});
  const response=await createHandler({now:()=>clock}).fetch(new Request('https://analytics.example/api/report?from=2025-01-01&to=2026-12-31',{headers:{Authorization:`Bearer ${SECRET}`}}),settings);
  const data=await response.json();assert.equal(data.total.pageviews,40);assert.equal(data.sampledDays,2);assert.equal(data.expectedDays,3);assert.equal(data.missingDays,1);
});

test('analytics redirects are rejected without forwarding credentials or replacing an archived day',async()=>{
  await archiveDay(env(),DAY,options());
  let calls=0;
  const fetcher=async(url,init)=>{
    calls++; assert.equal(init.redirect,'manual');
    assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');
    return new Response(null,{status:302,headers:{Location:'https://untrusted.example/'}});
  };
  await assert.rejects(()=>archiveDay(env(),DAY,options({fetcher})),/analytics_http_302/);
  assert.equal(calls,1);
  assert.equal((await db.prepare('SELECT pageviews FROM daily_stats WHERE day=?').bind(DAY).first()).pageviews,12);
});
