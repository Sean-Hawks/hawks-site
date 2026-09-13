import test from 'node:test';
import assert from 'node:assert/strict';
import { templateText, templatePanel, blankTemplate } from '../src/writing-template.mjs';
import { parseMessage } from '../src/channel-writing.mjs';
import fs from 'node:fs';
import matter from 'gray-matter';
const draft = { title: '我的文章', tags: ['音樂'], desc: '', kind: 'post', slug: '2026-09-09', createdAt: '2026-09-09T01:00:00Z' };
test('prefilled template parses back without losing body or metadata', () => {
 const body='第一段\n\n圖說：照片說明\n最後一段';
 const input=parseMessage(templateText(draft, body));
 assert.equal(input.title,draft.title); assert.equal(input.slug,draft.slug); assert.equal(input.body,body);
 assert.deepEqual(input.tags,draft.tags); assert.equal(input.date,'2026-09-09');
});
test('long text is not truncated in downloadable template and inline header warns to retain body', () => {
 const body='x'.repeat(6000);
 const panel=templatePanel(draft,body,{url:'https://discord.com/channels/1/2/3'});
 assert.match(panel.embeds[0].description,/保留原內文/);
 assert.equal(panel.files[0].attachment.toString(),templateText(draft,body));
 assert.ok(panel.embeds[0].description.length<4096);
 for(const row of panel.components) row.toJSON();
});
test('new writing template leaves optional fields blank and uses automatic URL', () => {
 const result=blankTemplate('123');
 const text=result.files[0].attachment.toString();
 assert.equal(parseMessage(text).kind,'post');
 assert.deepEqual(parseMessage(text).tags,[]);
 assert.doesNotMatch(text,/網址：/);
});
test('copy format follows the active Obsidian daily template and preserves native embeds and callouts',()=>{
 const template=matter(fs.readFileSync(new URL('../../content/templates/daily-note.md',import.meta.url),'utf8')).data;
 const body='段落\n\n![門票](/images/blog/photo.webp)\n\n:::info\n補充\n:::';
 const text=templateText({...draft,kind:'talk',metadata:{event:'展覽',video:'https://example.com',relatedPosts:['first-web']}},body);
 const frontmatter=matter(text).data;
 for(const key of Object.keys(template))assert.ok(Object.hasOwn(frontmatter,key),key);
 assert.match(text,/!\[\[public\/images\/blog\/photo.webp\|門票\]\]/);
 const parsed=parseMessage(text);
 assert.equal(parsed.kind,'talk');assert.equal(parsed.body,body);assert.equal(parsed.metadata.event,'展覽');
 assert.deepEqual(parsed.metadata.relatedPosts,['first-web']);
 assert.throws(()=>parseMessage('---js\nprocess.exit()\n---'),/YAML/);
});
