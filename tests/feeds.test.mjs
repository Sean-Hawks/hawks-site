import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
function load(name) {
  const url = new URL(`../app/lib/${name}.ts`, import.meta.url);
  const code = ts.transpileModule(fs.readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {}, require = createRequire(url);
  vm.runInNewContext(code, { exports, require: id => id.startsWith('./') ? load(id.slice(2)) : require(id) });
  return exports;
}
const { buildFeedItems, selectFeedItems, renderFeed } = load('feeds');
const post = {slug:'post',title:'A & <B>',date:'2025-01-01',desc:'"quoted" & more',tags:[]};
test('feeds include public content and only full Library reviews', () => {
  const items = buildFeedItems([post,{...post,status:'draft'},{...post,status:' PRIVATE '}], [{id:'a',title:'Note',date:'2026-01-01',desc:'Body'}], [{slug:'a',category:'book',title:'Book',date:'2026-01-01',hasReview:true}, {slug:'b',category:'book',hasReview:false}, {slug:'c',category:'book',hasReview:true,statusVisibility:'private'}]);
  assert.equal(items.length,3);
  assert.deepEqual(Array.from(items, item=>item.channel), ['blog','talk','library']);
});
test('each channel filters before limiting, so frequent notes do not hide older essays', () => {
  const items = buildFeedItems([post], Array.from({length:60}, (_,i)=>({id:`note-${i}`,title:'Note',date:'2026-01-01',desc:'body'})), []);
  assert.equal(selectFeedItems(items,'all').length,50);
  assert.equal(selectFeedItems(items,'blog').length,1);
  assert.equal(selectFeedItems(items,'blog')[0].title,post.title);
  assert.equal(items.length,61);
});
test('RSS preserves permalink GUIDs, escapes XML and identifies its channel', () => {
  const rss = renderFeed(buildFeedItems([post],[],[]),'blog');
  assert.match(rss, /A &amp; &lt;B&gt;/);
  assert.match(rss, /&quot;quoted&quot; &amp; more/);
  assert.match(rss, /<guid isPermaLink="true">https:\/\/hawks.tw\/blog\/post\/<\/guid>/);
  assert.match(rss, /href="https:\/\/hawks.tw\/feeds\/blog\/rss.xml" rel="self"/);
  assert.match(rss, /Wed, 01 Jan 2025 00:00:00 GMT/);
});
test('empty channels and invalid dates produce valid structure without invalid dates', () => {
  assert.doesNotMatch(renderFeed([],'library'), /lastBuildDate|<item>/);
  const rss = renderFeed(buildFeedItems([{...post,date:'unknown'}],[],[]));
  assert.doesNotMatch(rss, /Invalid Date|pubDate|lastBuildDate/);
});
