import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ChannelWriter, embedded, parseMessage } from '../src/channel-writing.mjs';
import { Store } from '../src/store.mjs';
import { prepareCopy, copyChunks } from '../src/copy-flow.mjs';
function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-channel-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const store = new Store(dir), messages = new Map(), sent = [];
  let next = 9000;
  const channel = { id: 'channel', guildId: 'guild', messages: { fetch: async input => {
    if (input?.limit) return new Map([...messages].sort((a, b) => Number(b[0]) - Number(a[0])).slice(0, input.limit));
    const id = typeof input === 'string' ? input : input.message;
    if (!messages.has(id)) throw Object.assign(new Error('missing'), { code: 10008 });
    return messages.get(id);
  } }, send: async payload => {
    const m = { id: String(next++), channelId: 'channel', author: { bot: true }, payload, edit: async p => { m.payload = p; } };
    sent.push(m); messages.set(m.id, m); return m;
  } };
  const config = { store, channelId: 'channel', owners: new Set(['owner']), client: { channels: { fetch: async () => channel } }, card: d => ({ embeds: [{ title: d.title, fields: [] }], components: [] }) };
  const writer = new ChannelWriter(config);
  function message(id, content, reply) {
    const m = { id, content, channel, channelId: 'channel', author: { id: 'owner', bot: false }, ...(reply ? { reference: { messageId: reply } } : {}) };
    messages.set(id, m); return m;
  }
  return { writer, config, store, messages, sent, message };
}
test('first line and inline metadata parse without forms', () => {
  assert.deepEqual(parseMessage('# 新文章\n標籤：生活, 技術\n摘要：介紹\n網址：new-post\n\n正文'), { title: '新文章', tags: ['生活', '技術'], desc: '介紹', slug: 'new-post', body: '正文' });
  assert.equal(embedded('儲存成功').content, null);
  assert.equal(embedded('儲存成功').embeds[0].description, '儲存成功');
});
test('message edits save revisions and update the same Embed, duplicate events do not save again', async t => {
  const x = setup(t);
  const root = x.message('1', '# 初稿\n第一段');
  await x.writer.process(root);
  const b = x.writer.bindingFor('1');
  assert.equal(x.store.read(b.draftId, 'owner').body, '第一段');
  root.content = '# 新標題\n修改後';
  await x.writer.process(root);
  await x.writer.process(root);
  const draft = x.store.read(b.draftId, 'owner');
  assert.equal(draft.body, '修改後');
  assert.equal(draft.revision, 2);
  assert.equal(x.sent.length, 1);
  assert.equal(x.sent[0].payload.embeds[0].title, '新標題');
});
test('replies append to original and can be edited after a restart', async t => {
  const x = setup(t);
  await x.writer.process(x.message('1', '文章\n第一段'));
  await x.writer.process(x.message('2', '第二段', '1'));
  const b = x.writer.bindingFor('1');
  assert.equal(x.store.read(b.draftId, 'owner').body, '第一段\n\n第二段');
  const restarted = new ChannelWriter(x.config);
  const reply = x.messages.get('2'); reply.content = '更新第二段';
  await restarted.process(reply);
  assert.equal(x.store.read(b.draftId, 'owner').body, '第一段\n\n更新第二段');
  assert.equal(x.sent.length, 1);
});
test('deleted source preserves draft and prevents publishing', async t => {
  const x = setup(t);
  await x.writer.process(x.message('1', '文章\n保留正文'));
  const b = x.writer.bindingFor('1'), draft = x.store.read(b.draftId, 'owner');
  x.messages.delete('1');
  await assert.rejects(x.writer.beforePublish(draft), /刪除/);
  assert.equal(x.store.read(b.draftId, 'owner').body, '保留正文');
});
test('publication preflight fetches latest source and rejects outdated confirmation', async t => {
  const x = setup(t);
  const root = x.message('1', '文章\n舊內容'); await x.writer.process(root);
  const b = x.writer.bindingFor('1'), draft = x.store.read(b.draftId, 'owner');
  root.content = '文章\n新內容';
  await assert.rejects(x.writer.beforePublish(draft), /新修改/);
  assert.equal(x.store.read(b.draftId, 'owner').body, '新內容');
});
test('unauthorized users and other channels cannot create drafts', async t => {
  const x = setup(t);
  await x.writer.process({ ...x.message('1', '私文'), author: { id: 'stranger' } });
  await x.writer.process({ ...x.message('2', '別處'), channelId: 'elsewhere' });
  assert.equal(x.store.list('owner').length, 0);
});
test('reconnect reconciliation catches offline edits and replies', async t => {
  const x = setup(t);
  const root = x.message('1', '原文\n正文'); await x.writer.process(root);
  root.content = '原文\n離線修改';
  x.message('2', '離線續寫', '1');
  const restarted = new ChannelWriter(x.config);
  await restarted.reconcile();
  const b = restarted.bindingFor('1');
  assert.equal(x.store.read(b.draftId, 'owner').body, '離線修改\n\n離線續寫');
});
test('operational JSON files are excluded from the draft inbox', t => {
  const x = setup(t);
  fs.writeFileSync(path.join(x.store.dir, 'health.json'), '{}');
  fs.writeFileSync(path.join(x.store.dir, 'interaction-routing-123.json'), '{}');
  assert.deepEqual(x.store.list('owner'), []);
});
test('checkout preserves untouched original segments and accepts edits via replies', async t => {
  const x = setup(t);
  const original = x.store.create('owner', { title: '舊文章', body: '甲'.repeat(1600) + '\n\n尾段', slug: 'old' });
  const d = await x.writer.checkout(original);
  const b = x.writer.bindingFor(d.source.rootId);
  await x.writer.sync(b);
  assert.equal(x.store.read(d.id, 'owner').body, original.body);
  await x.writer.showSection(d, 1);
  const reply = x.message('10000', '修改第一段', b.sections[1].cardId);
  await x.writer.process(reply);
  assert.equal(x.store.read(d.id, 'owner').body, '修改第一段' + original.body.slice(1500));
  reply.content = '再次修改'; await x.writer.process(reply);
  assert.equal(x.store.read(d.id, 'owner').body, '再次修改' + original.body.slice(1500));
});
test('editing an original after checkout reactivates it and keeps the same panel', async t => {
 const x=setup(t),root=x.message('1','文章\n原文');await x.writer.process(root);
 const original=x.writer.bindingFor('1');const panelId=original.panelId;
 const d=await x.writer.checkout(x.store.read(original.draftId,'owner'));
 root.content='文章\n我自己的最新修改';root.editedTimestamp=1234;await x.writer.process(root);
 const saved=x.store.read(d.id,'owner');assert.equal(saved.body,'我自己的最新修改');
 assert.equal(saved.source.rootId,root.id);assert.equal(x.writer.bindingFor(root.id).panelId,panelId);
 await x.writer.beforePublish(saved);
 const restarted=new ChannelWriter(x.config);
 await restarted.process(x.message('10001','繼續寫',root.id));
 assert.equal(x.store.read(d.id,'owner').body,'我自己的最新修改\n\n繼續寫');
 await restarted.process({...root,content:'惡意覆寫',author:{id:'stranger'}});
 assert.equal(x.store.read(d.id,'owner').body,'我自己的最新修改\n\n繼續寫');
});
test('reconnected original edits preserve saved metadata when metadata labels are absent',async t=>{
 const x=setup(t),root=x.message('1','近況\n第一段\n\n![照片](/images/one.webp)\n\n第二段');await x.writer.process(root);
 const b=x.writer.bindingFor('1');b.preserveMetadata=true;
 const d=x.store.read(b.draftId,'owner');x.store.update(d.id,'owner',d.revision,{kind:'talk',desc:'保留摘要',tags:['日常']});
 await x.writer.sync(b);const saved=x.store.read(d.id,'owner');
 assert.equal(saved.kind,'talk');assert.equal(saved.desc,'保留摘要');assert.deepEqual(saved.tags,['日常']);
 assert.ok(saved.body.indexOf('/images/one.webp')<saved.body.indexOf('第二段'));
});
test('AI suggestions never lock the original and partial adoption is immediately saved',async t=>{
 const x=setup(t),root=x.message('1','近況\n舊內文');await x.writer.process(root);
 const b=x.writer.bindingFor('1'),d=x.store.read(b.draftId,'owner');
 const panelId=b.panelId;
 await prepareCopy(x.writer,d,{body:'建議'.repeat(1600),desc:'建議摘要'});
 assert.equal(b.copyPlan,undefined);assert.equal(x.store.read(d.id,'owner').body,'舊內文');
 await x.writer.beforePublish(d);
 const count=x.sent.length;
 await prepareCopy(x.writer,d,{body:'另一份建議'.repeat(400)});
 assert.equal(x.sent.length,count);
 root.content='近況\n只採用一點，而且自己改寫';await x.writer.process(root);
 const saved=x.store.read(d.id,'owner');assert.equal(saved.body,'只採用一點，而且自己改寫');
 assert.equal(saved.source.rootId,root.id);assert.equal(b.panelId,panelId);
 await x.writer.beforePublish(saved);
 await x.writer.process(x.message('20000','還能繼續寫',root.id));
 assert.ok(x.store.read(d.id,'owner').body.endsWith('還能繼續寫'));
});
test('restart removes legacy copy lock without applying unpasted AI text',async t=>{
 const x=setup(t),root=x.message('1','近況\n我貼回後又修改的文字');await x.writer.process(root);
 const b=x.writer.bindingFor('1'),d=x.store.read(b.draftId,'owner');
 const card=await x.writer.notice(root.channel,'舊的強制複製提示');
 b.copyPlan={revision:d.revision,slots:[{messageId:root.id,text:'近況\n完全不同的 AI 建議',cardId:card.id,received:false},{text:'尚未貼回的其他段落',received:false}]};x.writer.save();
 const restarted=new ChannelWriter(x.config);await restarted.sync(restarted.bindingFor(root.id));
 assert.equal(restarted.bindingFor(root.id).copyPlan,undefined);
 assert.equal(x.store.read(d.id,'owner').body,'我貼回後又修改的文字');
 assert.match(card.payload.embeds[0].description,/不必逐段貼齊/);
 await restarted.beforePublish(x.store.read(d.id,'owner'));
 root.content='近況\n繼續自由修改';await restarted.process(root);
 assert.equal(x.store.read(d.id,'owner').body,'繼續自由修改');
});
test('copy suggestion chunks preserve code fences and Unicode for export',()=>{
 const body='```js\n'+('😀'.repeat(1600))+'\n```';
 const chunks=copyChunks(body);assert.equal(chunks.map(c=>c.prefix+c.text+c.suffix).join(''),body);
 assert.ok(chunks.every(c=>c.text.length<=1800));
});
