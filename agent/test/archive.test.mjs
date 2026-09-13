import test from 'node:test';
import assert from 'node:assert/strict';
import { ArticleArchive, parseArticle } from '../src/archive.mjs';
function article(n) { return { title: `文章 ${n}`, body: '正文🦈'.repeat(3000), source: 'source', tags: [], date: '2026-01-01', kind: 'post', slug: `post-${n}`, url: `https://hawks.tw/blog/post-${n}/` }; }
test('archive excludes nonpublic documents and matches existing website routes', () => {
  assert.equal(parseArticle('---\nstatus: draft\n---\n秘密', 'test.md', 'post', 'https://hawks.tw'), null);
  assert.equal(parseArticle('---\nstatus: PRIVATE\n---\n秘密', 'test.md', 'post', 'https://hawks.tw'), null);
  assert.equal(parseArticle('---\nslug: My Post\n---\n內容', 'old.md', 'post', 'https://hawks.tw').url, 'https://hawks.tw/blog/my-post/');
  assert.equal(parseArticle('---\nslug: ignored\n---\n內容', '2026-01-01.md', 'talk', 'https://hawks.tw').url, 'https://hawks.tw/talk/2026-01-01/');
  assert.throws(() => parseArticle('---javascript\nprocess.exit()\n---', 'bad.md', 'post', ''), /不支援/);
});
test('browse paginates, searches, filters and bounds Discord embeds', async () => {
  const archive = new ArticleArchive({});
  archive.cache = { time: Date.now(), items: Array.from({ length: 17 }, (_, i) => article(i)) };
  const panel = await archive.open('owner');
  const id = [...archive.sessions.keys()][0];
  assert.equal(panel.embeds[0].fields.length, 8);
  assert.equal(archive.list(id, 2).embeds[0].fields.length, 1);
  const reading = archive.read(id, 0, 0);
  assert.ok(reading.embeds[0].description.length <= 3500);
  for (const row of reading.components) row.toJSON();
  assert.match(archive.read(id, 0, 999).embeds[0].footer.text, /第/);
  assert.throws(() => archive.session(id, 'other'), /自行/);
  archive.sessions.get(id).time = 0;
  assert.throws(() => archive.session(id, 'owner'), /過期/);
  assert.equal((await archive.open('owner', '文章 16')).embeds[0].fields.length, 1);
  assert.equal((await archive.open('owner', '', 'talk')).embeds[0].fields.length, 0);
});
test('loader reads GitHub contents and caches public articles only', async () => {
  let count = 0;
  const archive = new ArticleArchive({ branch: 'main', siteUrl: 'https://hawks.tw', request: async endpoint => {
    count++;
    if (endpoint.startsWith('contents/content/talks?')) return [];
    if (endpoint.startsWith('contents/content/posts?')) return [{ type: 'file', name: 'public.md' }, { type: 'file', name: 'draft.md' }];
    return { encoding: 'base64', content: Buffer.from(endpoint.includes('draft.md') ? '---\nstatus: draft\n---\nprivate' : '公開內容').toString('base64') };
  } });
  assert.equal((await archive.load()).length, 1);
  await archive.load();
  assert.equal(count, 4);
});
