import test from 'node:test';
import assert from 'node:assert/strict';
import { MediaStore } from '../src/media.mjs';
const media = Object.create(MediaStore.prototype);
media.ingest = async a => ({ url: `/images/blog/${a.id}.webp` });
const attachments = new Map([['1', {id:'1',name:'one.jpg'}], ['2', {id:'2',name:'two.jpg'}]]);
test('attachment markers place photos between paragraphs without appending duplicates', async () => {
  const result = await media.renderMessage({content:'前段\n[[圖2]]\n中段\n[[圖1]]\n結尾', attachments});
  assert.equal(result.text,'前段\n![two](/images/blog/2.webp)\n中段\n![one](/images/blog/1.webp)\n結尾');
  assert.equal(result.assets.length,2);
});
test('unplaced photos append, while missing attachment numbers produce an actionable error', async () => {
  const result = await media.renderMessage({content:'前段\n[[圖1]]\n結尾', attachments});
  assert.ok(result.text.endsWith('結尾\n\n![two](/images/blog/2.webp)'));
  await assert.rejects(media.renderMessage({content:'[[圖3]]',attachments}),/第 3 張照片/);
});
test('permanent image syntax in another message suppresses the source automatic copy', async () => {
  const placedUrls = new Set(['/images/blog/1.webp']);
  const source = await media.renderMessage({content:'附件',attachments}, {placedUrls});
  const body = await media.renderMessage({content:'前段\n![one](/images/blog/1.webp)\n後段'}, {placedUrls});
  assert.ok(!source.text.includes('/images/blog/1.webp'));
  assert.ok(source.text.includes('/images/blog/2.webp'));
  assert.equal(body.text,'前段\n![one](/images/blog/1.webp)\n後段');
});
