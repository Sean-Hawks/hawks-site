import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import matter from 'gray-matter';
import { MediaStore } from '../src/media.mjs';
import { checkDraft, changes, previewHtml } from '../src/review.mjs';
import { Store, markdown } from '../src/store.mjs';
import { Publisher } from '../src/github.mjs';
import { DeploymentTracker } from '../src/deployments.mjs';
function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-features-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir), draft = store.create('owner', { title: '照片文章', body: '正文', slug: 'article' });
  return { dir, store, draft };
}
test('photo conversion strips metadata, resizes, and survives lost attachment URLs', async t => {
  const { dir } = setup(t);
  const jpeg = await sharp({ create: { width: 2200, height: 1100, channels: 3, background: 'red' } }).jpeg().withMetadata().toBuffer();
  assert.ok((await sharp(jpeg).metadata()).exif);
  let requests = 0;
  const media = new MediaStore(dir, async () => { requests++; return new Response(jpeg); });
  const attachment = { id: '1', url: 'https://cdn.discordapp.com/attachments/a/b/photo.jpg', size: jpeg.length };
  const asset = await media.ingest(attachment);
  const output = await sharp(media.read(asset)).metadata();
  assert.equal(output.format, 'webp'); assert.equal(output.width, 1920); assert.equal(output.height, 960);
  assert.equal(output.exif, undefined);
  const restarted = new MediaStore(dir, () => { throw new Error('expired'); });
  assert.deepEqual(await restarted.ingest(attachment), asset); assert.equal(requests, 1);
  await assert.rejects(media.ingest({ ...attachment, id: 'other', url: 'https://localhost/photo' }), /Discord/);
});
test('bad and oversized photos fail explicitly; captions become Markdown', async t => {
  const { dir } = setup(t);
  const media = new MediaStore(dir, async () => new Response('not an image'));
  await assert.rejects(media.ingest({ id: '2', url: 'https://cdn.discordapp.com/a', size: 21000000 }), /20 MB/);
  await assert.rejects(media.ingest({ id: '2', url: 'https://cdn.discordapp.com/a', size: 20 }), /圖片無法/);
  media.ingest = async () => ({ hash: 'a'.repeat(64), url: '/images/blog/a.webp' });
  const result = await media.renderMessage({ content: '文字\n圖說：山上的夕陽', attachments: new Map([['1', { name: 'x.jpg' }]]) });
  assert.match(result.text, /!\[山上的夕陽\]/); assert.doesNotMatch(result.text, /圖說：/);
});
test('review blocks missing/temporary images and creates safe complete HTML and diffs', t => {
  const { draft } = setup(t);
  const media = { read: () => Buffer.from('photo') };
  assert.throws(() => checkDraft({ ...draft, body: '![](/images/blog/missing.webp)' }, media), /未保存/);
  assert.throws(() => checkDraft({ ...draft, body: '![a](https://cdn.discordapp.com/attachments/a)' }, media), /暫時/);
  const unsafe = { ...draft, body: '<script>alert(1)</script><img src="x" onerror="boom"><a href="javascript:alert(1)">click</a>\n\n# 標題' };
  const html = previewHtml(unsafe, media, 'https://hawks.tw');
  assert.doesNotMatch(html, /<script|onerror|javascript:/); assert.match(html, /<h1>標題/);
  assert.match(changes(draft, { ...draft, body: '修改', revision: 2 }), /\+修改/);
});
test('old article metadata, original date and cover survive publish and restore', t => {
  const { store, draft } = setup(t);
  const v2 = store.update(draft.id, 'owner', 1, { date: '2020-01-02', metadata: { relatedTalks: ['2020'], custom: 'keep', __remoteMedia: ['private-index'] }, cover: '/images/cover.webp', assets: [{ hash: 'a' }] });
  const data = matter(markdown(v2, 'published')).data;
  assert.equal(data.date, '2020-01-02'); assert.deepEqual(data.relatedTalks, ['2020']);
  assert.equal(data.custom, 'keep'); assert.equal(data.ogImage, '/images/cover.webp'); assert.equal(data.__remoteMedia, undefined);
  store.update(draft.id, 'owner', 2, { body: 'other', cover: 'other', assets: [] });
  const restored = store.restore(draft.id, 'owner', 3, 2);
  assert.equal(restored.cover, '/images/cover.webp'); assert.equal(restored.assets.length, 1);
});
test('atomic image publish creates one tree/commit and a non-forced ref update', async t => {
  const { draft } = setup(t); const requests = [];
  const publisher = new Publisher({ token: 'test', repository: 'test/site' });
  publisher.media = { read: () => Buffer.from('photo') };
  publisher.request = async (url, init = {}) => {
    requests.push({ url, body: init.body && JSON.parse(init.body) });
    if (url.startsWith('contents/')) return null;
    if (url.startsWith('git/ref/')) return { object: { sha: 'head' } };
    if (url === 'git/commits/head') return { tree: { sha: 'base' } };
    if (url === 'git/blobs') return { sha: JSON.parse(init.body).encoding === 'base64' ? 'photo-sha' : 'article-sha' };
    if (url === 'git/trees') return { sha: 'tree' };
    if (url === 'git/commits') return { sha: 'commit' };
    if (url.startsWith('git/refs/')) return {};
    throw new Error(url);
  };
  const published = await publisher.publish({ ...draft, assets: [{ hash: 'a'.repeat(64) }] });
  assert.equal(published.commit, 'commit');
  const tree = requests.find(r => r.url === 'git/trees').body;
  assert.equal(tree.tree.length, 2); assert.equal(tree.base_tree, 'base');
  assert.deepEqual(requests.at(-1).body, { sha: 'commit', force: false });
});
test('old articles update original filename, with SHA conflict protection', async t => {
  const { draft } = setup(t); const requests = [];
  const publisher = new Publisher({ token: 'test', repository: 'test/site' });
  publisher.request = async (url, init) => { requests.push(url); return init ? { content: { sha: 'new' }, commit: { sha: 'commit' } } : { sha: 'old' }; };
  await publisher.publish({ ...draft, published: { file: 'content/posts/舊文章.md', sha: 'old', url: 'https://hawks.tw/blog/article/' } });
  assert.match(decodeURIComponent(requests[1]), /舊文章.md/);
});
test('confirmed relocation atomically creates talk and removes original post, rejecting collisions and source changes',async t=>{
 const {draft}=setup(t), requests=[];
 const publisher=new Publisher({token:'test',repository:'test/site',siteUrl:'https://hawks.tw'});
 let collision=false,sourceSha='old';
 publisher.request=async(url,init)=>{
  const body=init?.body?JSON.parse(init.body):null;requests.push({url,body});
  if(url.startsWith('contents/content/talks/'))return collision?{sha:'collision'}:null;
  if(url.startsWith('contents/content/posts/'))return {sha:sourceSha};
  if(url.startsWith('git/ref/heads/'))return {object:{sha:'parent'}};
  if(url==='git/commits/parent')return {tree:{sha:'base'}};
  return {sha:'new'};
 };
 const d={...draft,kind:'talk',published:{file:'content/posts/article.md',sha:'old'},relocation:{from:'content/posts/article.md',kind:'talk'}};
 const result=await publisher.publish(d);
 assert.equal(result.url,'https://hawks.tw/talk/article/');
 const tree=requests.find(r=>r.url==='git/trees').body.tree;
 assert.deepEqual(tree.find(n=>n.path==='content/posts/article.md'),{path:'content/posts/article.md',mode:'100644',type:'blob',sha:null});
 assert.ok(tree.some(n=>n.path==='content/talks/article.md'&&n.sha));
 assert.equal(requests.at(-1).body.force,false);
 collision=true;await assert.rejects(publisher.publish(d),/同名/);
 collision=false;sourceSha='changed';await assert.rejects(publisher.publish(d),/修改/);
});
test('reading preview renders supported callouts with Markdown while sanitizing scripts',()=>{
 const html=previewHtml({title:'近況',revision:1,body:':::info\n**資訊** <script>alert(1)</script>\n:::',assets:[]},{},'https://hawks.tw');
 assert.match(html,/<aside class="admonition admonition-info">/);
 assert.match(html,/<strong>資訊<\/strong>/);
 assert.ok(!html.includes('<script>'));
});
test('deployment tracking resumes after restart and updates one Embed only on state changes', async t => {
  const { dir } = setup(t); const sent = []; let edited = 0, status = 'in_progress';
  const channel = { send: async p => { sent.push(p); return { id: 'message' }; }, messages: { fetch: async () => ({ edit: async () => { edited++; } }) } };
  const config = { dir, client: { channels: { fetch: async () => channel } }, publisher: { repository: 'a/b', request: async () => ({ workflow_runs: [{ id: 1, head_sha: 'abc', status, conclusion: status === 'completed' ? 'success' : null, html_url: 'https://github.com/a/b/actions/runs/1' }] }) } };
  let tracker = new DeploymentTracker(config);
  await tracker.track({ commit: 'abc', url: 'https://hawks.tw/blog/a/' }, 'channel', '標題');
  await tracker.poll(); await tracker.poll();
  assert.equal(sent.length, 1); assert.equal(edited, 1);
  tracker = new DeploymentTracker(config); status = 'completed'; await tracker.poll(); await tracker.poll();
  assert.equal(edited, 2); assert.equal(JSON.parse(fs.readFileSync(path.join(dir, 'deployments/abc.json'))).done, true);
});
test('deployment updates use the existing workspace card when a shared notifier handles them',async t=>{
 const {dir}=setup(t);const updates=[];
 const tracker=new DeploymentTracker({dir,publisher:{},client:{channels:{fetch:()=>{throw Error('must not send separate cards');}}},onUpdate:async(job,text)=>{updates.push(text);job.messageId='workspace';return true;}});
 await tracker.track({commit:'abc',url:'https://hawks.tw/talk/a/'},'channel','近況','draft');
 const job=JSON.parse(fs.readFileSync(path.join(dir,'deployments/abc.json')));
 assert.equal(job.messageId,'workspace');assert.equal(job.draftId,'draft');assert.equal(updates.length,1);
});
