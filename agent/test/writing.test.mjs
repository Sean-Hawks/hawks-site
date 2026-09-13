import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import matter from 'gray-matter';
import { Store, markdown } from '../src/store.mjs';
import { Publisher } from '../src/github.mjs';
import { importMarkdown } from '../src/import.mjs';
import { command } from '../src/commands.mjs';
function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-agent-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir);
  return { store, draft: store.create('owner', { title: '台灣：寫作 #1', body: '第一段', slug: 'hello' }) };
}
test('drafts survive restarts, remain private, reject stale edits and traversal', t => {
  const { store, draft } = setup(t);
  assert.equal(new Store(store.dir).read(draft.id, 'owner').body, '第一段');
  assert.throws(() => store.read(draft.id, 'stranger'), /不是你的/);
  assert.throws(() => store.read('../secrets', 'owner'));
  assert.equal(store.list('stranger').length, 0);
  store.update(draft.id, 'owner', 1, { body: '新內容' });
  assert.throws(() => store.update(draft.id, 'owner', 1, { body: '舊內容' }), /新版本/);
  assert.equal(store.read(draft.id, 'owner').body, '新內容');
});
test('restore snapshots, search, archive and preserve publication metadata', t => {
  const { store, draft } = setup(t);
  store.update(draft.id, 'owner', 1, { body: '第二段', published: { sha: 'abc' } });
  const restored = store.restore(draft.id, 'owner', 2, 1);
  assert.equal(restored.body, '第一段');
  assert.equal(restored.published.sha, 'abc');
  assert.equal(restored.revision, 3);
  assert.equal(store.list('owner', '第一段').length, 1);
  store.update(draft.id, 'owner', 3, { archived: true });
  assert.equal(store.list('owner').length, 0);
  assert.equal(store.read(draft.id, 'owner').body, '第一段');
});
test('frontmatter round-trips YAML and uses Taipei date', t => {
  const { draft } = setup(t);
  draft.createdAt = '2026-09-08T18:00:00Z';
  const parsed = matter(markdown(draft));
  assert.equal(parsed.data.title, draft.title);
  assert.equal(parsed.data.status, 'draft');
  assert.equal(parsed.data.date, '2026-09-09');
  assert.equal(matter(markdown(draft, 'published')).data.status, 'published');
});
test('limits and history retention', t => {
  const { store, draft } = setup(t);
  assert.throws(() => store.update(draft.id, 'owner', 1, { slug: '../secret' }));
  assert.throws(() => store.update(draft.id, 'owner', 1, { body: 'x'.repeat(200001) }));
  for (let i = 1; i <= 35; i++) store.update(draft.id, 'owner', i, { body: `${i}` });
  assert.equal(store.read(draft.id, 'owner').history.length, 30);
});
function publisher(responses, requests = []) {
  return new Publisher({ token: 'test', repository: 'owner/site', fetcher: async (url, init) => {
    requests.push({ url, ...init });
    const [status, data] = responses.shift();
    return { status, ok: status >= 200 && status < 300, json: async () => data };
  } });
}
test('publish creates a published Markdown file and returns deployment reference', async t => {
  const { draft } = setup(t), calls = [];
  const result = await publisher([[404, null], [201, { content: { sha: 'new' }, commit: { sha: 'commit' } }]], calls).publish(draft);
  const payload = JSON.parse(calls[1].body);
  assert.equal(matter(Buffer.from(payload.content, 'base64').toString()).data.status, 'published');
  assert.equal(payload.branch, 'main');
  assert.equal(result.url, 'https://hawks.tw/blog/hello/');
});
test('publisher rejects name collisions and outside edits', async t => {
  const { draft } = setup(t);
  await assert.rejects(publisher([[200, { sha: 'existing' }]]).publish(draft), /同名/);
  draft.published = { file: 'content/posts/hello.md', sha: 'old' };
  await assert.rejects(publisher([[200, { sha: 'changed' }]]).publish(draft), /外部修改/);
  await assert.rejects(publisher([[404, null]]).publish(draft), /移除/);
});
test('publisher supports updates but never silently renames live files', async t => {
  const { draft } = setup(t), calls = [];
  draft.published = { file: 'content/posts/hello.md', sha: 'old' };
  await publisher([[200, { sha: 'old' }], [200, { content: { sha: 'new' }, commit: { sha: 'commit' } }]], calls).publish(draft);
  assert.equal(JSON.parse(calls[1].body).sha, 'old');
  draft.slug = 'new-name';
  await assert.rejects(publisher([]).publish(draft), /不可變更/);
});
test('publisher handles missing credentials, empty text and network rejection', async t => {
  const { draft } = setup(t);
  await assert.rejects(new Publisher({}).publish(draft), /GITHUB_TOKEN/);
  await assert.rejects(publisher([[403, {}]]).publish(draft), /403/);
  await assert.rejects(publisher([]).publish({ ...draft, body: ' ' }), /內文/);
});
test('import accepts YAML but rejects executable frontmatter', () => {
  assert.equal(importMarkdown('---\ntitle: 寫作\nstatus: published\n---\n正文', 'test.md').title, '寫作');
  assert.equal(importMarkdown('普通文字', 'test.txt').body, '普通文字');
  assert.throws(() => importMarkdown('---javascript\n({title: process.exit()})\n---\n', 'test.md'), /YAML/);
});
test('Discord command payload is valid and includes all writing entry points', () => {
  const json = command.toJSON();
  assert.equal(json.name, 'blog');
  assert.deepEqual(json.options.map(o => o.name), ['new', 'list', 'open', 'import', 'restore', 'browse', 'help']);
});
test('default URLs follow Taipei dates with time suffixes for collisions', t => {
  const { store } = setup(t);
  assert.equal(store.dateSlug('2026-09-08T18:00:00Z'), '2026-09-09');
  const one = store.create('a', { date: '2026-09-09', title: 'one' });
  assert.equal(one.slug, '2026-09-09');
  const two = store.create('b', { date: '2026-09-09', title: 'two' });
  assert.equal(two.slug, '2026-09-09-0800');
  const three = store.create('a', { date: '2026-09-09', title: 'three' });
  assert.equal(three.slug, '2026-09-09-0800-2');
  assert.equal(store.create('a', { date: '2026-09-09', kind: 'talk', title: 'talk' }).slug, '2026-09-09');
  assert.equal(store.create('a', { slug: 'custom-name', title: 'custom' }).slug, 'custom-name');
});
