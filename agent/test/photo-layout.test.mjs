import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { photoGallery, placementOptions, placementPanel, placePhotos } from '../src/photo-layout.mjs';
const assets = Array.from({length: 30}, (_, n) => ({url:`/images/${n}.webp`,alt:`照片${n + 1}`}));
const draft = { id:'d2cb72ce-6632-4e50-8555-a5bf2885a25b', revision:11, assets, body:'第一段\n\n第二段\n\n![照片1](/images/0.webp)\n\n![照片2](/images/1.webp)' };
test('batch placement moves selected photos together and preserves prose and other photos', () => {
  const {options} = placementOptions(draft,[1,0]);
  const body = placePhotos(draft,[1,0],Number(options[1].value));
  assert.match(body,/第一段\n\n!\[照片2\]/);
  assert.ok(body.indexOf('/images/1.webp') < body.indexOf('/images/0.webp'));
  assert.equal(body.match(/\/images\/0.webp/g).length,1);
  assert.ok(body.trimEnd().endsWith('第二段'));
  assert.throws(()=>placePhotos(draft,[0],9999),/失效/);
  assert.throws(()=>placementOptions(draft,[30]),/失效/);
});
test('placement preserves fenced examples and moves images from list items', () => {
  const d = {...draft,body:'段落\n\n```md\n![例子](/images/0.webp)\n```\n\n- ![照片](/images/0.webp)\n'};
  const body = placePhotos(d,[0],0);
  assert.ok(body.includes('```md\n![例子](/images/0.webp)\n```'));
  assert.equal(body.match(/\/images\/0.webp/g).length,2);
});
test('reference link definitions survive layout changes', () => {
  const d = {...draft,body:'[網站][site]\n\n[site]: https://example.com\n\n第二段'};
  const body = placePhotos(d,[0],0);
  assert.ok(body.includes('[site]: https://example.com'));
  assert.ok(body.includes('[網站][site]'));
});
test('paragraph selection paginates within Discord limits and ids stay below 100 characters', () => {
  const d = {...draft,body:Array.from({length:60},(_,n)=>`段落${n}`).join('\n\n')};
  const panel = placementPanel(d,[24,25,26,27,28,29],1);
  assert.equal(panel.components[0].toJSON().components[0].options.length,25);
  for (const row of panel.components) for (const c of row.toJSON().components) assert.ok(c.custom_id.length<=100);
});
test('gallery shows six thumbnails, multi-select and batch insertion with bounded attachments', async () => {
  const data = await sharp({create:{width:2,height:2,channels:3,background:'#fff'}}).webp().toBuffer();
  const panel = await photoGallery(draft,{read:()=>data},4);
  assert.equal(panel.files.length,6);assert.equal(panel.embeds.length,7);
  const select = panel.components[0].toJSON().components[0];
  assert.equal(select.max_values,6);assert.equal(select.options[0].value,'24');
  assert.equal(panel.components[1].toJSON().components[1].disabled,true);
});
