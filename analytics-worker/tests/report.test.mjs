import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendarRows, periodSummary, estimateViews, weeklyComparison } from '../public/report.js';
const now=Date.parse('2026-01-15T06:00:00Z');
const day=(day,pageviews=10)=>({day,pageviews,visits:2,sample_interval:1});
const data=(days,extra={})=>({from:'2025-12-31',to:'2026-01-14',archiveStart:'2025-12-31',days,total:{pageviews:days.reduce((s,d)=>s+d.pageviews,0)},...extra});
test('chart keeps missing days distinct from measured zeroes and splits calendar years',()=>{
 const rows=calendarRows(data([day('2025-12-31',0),day('2026-01-02',20)],{to:'2026-01-02'}),'day',now);
 assert.deepEqual(rows.map(r=>[r.key,r.pageviews,r.saved]),[['2025-12-31',0,1],['2026-01-01',0,0],['2026-01-02',20,1]]);
 const months=calendarRows(data([day('2025-12-31'),day('2026-01-02')],{to:'2026-01-02'}),'month',now);
 assert.deepEqual(months.map(r=>[r.key,r.saved,r.expected]),[['2025-12',1,1],['2026-01',1,2]]);
});
test('chart excludes pre-archive and unfinished days, including leap days',()=>{
 const rows=calendarRows(data([],{from:'2024-01-01',archiveStart:'2024-02-28',to:'2024-12-31'}),'day',Date.parse('2024-03-01T00:00:00Z'));
 assert.deepEqual(rows.map(r=>r.key),['2024-02-28','2024-02-29']);
});
test('average uses saved days and empty ranges do not invent a peak',()=>{
 assert.equal(periodSummary(data([day('2025-12-31',0),day('2026-01-02',20)])).average,10);
 assert.deepEqual(periodSummary(data([])),{average:null,peak:null});
});
test('missed-traffic scenarios use division by capture rate, never sampling multipliers',()=>{
 assert.equal(estimateViews(2278,0),2278);assert.equal(estimateViews(2278,10),2531);assert.equal(estimateViews(2278,30),3254);
 for(const bad of [-1,100,NaN,Infinity])assert.equal(estimateViews(2278,bad),null);
});
test('weekly comparison requires two complete weeks and handles a zero baseline',()=>{
 const days=Array.from({length:14},(_,i)=>day('2026-01-'+String(i+1).padStart(2,'0'),i<7?0:10));
 assert.deepEqual(weeklyComparison(data(days),now),{previous:0,current:70,change:null});
 assert.equal(weeklyComparison(data(days.slice(1)),now),null);
 assert.equal(weeklyComparison(data(days,{from:'2026-01-08'}),now),null);
});
