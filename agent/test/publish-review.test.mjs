import test from 'node:test';
import assert from 'node:assert/strict';
import { PublishReview } from '../src/publish-review.mjs';
import { parseMessage } from '../src/channel-writing.mjs';
const draft = { id: 'draft', owner: 'owner', revision: 7, title: '標題', slug: '2026-09-09', kind: 'post', createdAt: '2026-09-09T01:00:00Z', body: '內文', tags: [], desc: '', assets: [], metadata: { relatedTalks: ['2026-09-01'] } };
const groups = ['identity', 'metadata', 'images', 'content'];
test('review lists actual metadata including deliberately empty fields', () => {
  const gate = new PublishReview(), token = gate.begin(draft);
  const panel = gate.panel(draft, { images: 0, notes: [] }, 'https://hawks.tw', token);
  const fields = panel.embeds[0].fields;
  assert.ok(fields.some(f => f.name === '標籤' && f.value.includes('尚未填寫')));
  assert.ok(fields.some(f => f.name === '摘要' && f.value.includes('尚未填寫')));
  assert.ok(fields.some(f => f.value.includes('2026-09-09')));
  assert.ok(fields.some(f => f.value.includes('relatedTalks')));
  for (const row of panel.components) row.toJSON();
  assert.equal(panel.components[0].toJSON().components[0].min_values, 4);
});
test('cannot publish without all confirmations; approval is bound to author and revision and single-use', () => {
  const gate = new PublishReview(), token = gate.begin(draft);
  assert.throws(() => gate.consume(token, draft, 'owner'), /先完成/);
  assert.throws(() => gate.approve(token, draft, 'owner', ['identity']), /全部/);
  assert.throws(() => gate.approve(token, draft, 'other', groups), /過期/);
  gate.approve(token, draft, 'owner', groups);
  assert.throws(() => gate.consume(token, { ...draft, revision: 8 }, 'owner'), /修改/);
  gate.consume(token, draft, 'owner');
  assert.throws(() => gate.consume(token, draft, 'owner'), /過期/);
});
test('old confirmation buttons, expired checklists and cancellations cannot publish', () => {
  const gate = new PublishReview();
  assert.throws(() => gate.consume('0', draft, 'owner'), /過期/);
  let token = gate.begin(draft); gate.approve(token, draft, 'owner', groups); gate.cancel(draft);
  assert.throws(() => gate.consume(token, draft, 'owner'), /過期/);
  token = gate.begin(draft); gate.reviews.get(token).expires = 0;
  assert.throws(() => gate.approve(token, draft, 'owner', groups), /過期/);
});
test('channel metadata can explicitly set date and content type', () => {
  const data = parseMessage('文章\n日期：2026-09-08\n類型：近況\n標籤：音樂, 台北\n摘要：介紹\n\n內文');
  assert.equal(data.date, '2026-09-08'); assert.equal(data.kind, 'talk');
  assert.deepEqual(data.tags, ['音樂', '台北']); assert.equal(data.body, '內文');
});
