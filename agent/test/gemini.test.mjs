import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {GeminiEditor,validateSuggestion} from '../src/gemini.mjs';
const draft={id:'draft',owner:'owner',revision:1,title:'文章',body:'內容 ![照片](/images/a.webp)',tags:[],desc:''};
function setup(t,fetcher){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gemini-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return new GeminiEditor({dir,key:'test-secret',fetcher});}
test('structured metadata excludes model-supplied URLs and publishing instructions',()=>{
 assert.deepEqual(validateSuggestion({title:'新標題',desc:'摘要',tags:['生活'],slug:'evil',published:true,notes:[]},'metadata',draft),{title:'新標題',desc:'摘要',tags:['生活']});
 assert.throws(()=>validateSuggestion({body:'漏掉照片',notes:[]},'polish',draft),/連結/);
});
test('AI request stores proposal only, without secrets, and checks revision ownership and expiration',async t=>{
 let sent;
 const ai=setup(t,async(url,init)=>{sent={url,...init};return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({title:'建議',desc:'摘要',tags:['日常'],notes:[]})}]}}]}));});
 const result=await ai.suggest(draft,'metadata');
 assert.equal(result.update.title,'建議');assert.equal(draft.title,'文章');
 assert.ok(!sent.url.includes('test-secret'));assert.equal(sent.headers['x-goog-api-key'],'test-secret');
 const body=JSON.parse(sent.body);assert.equal(body.contents[0].parts.length,1);assert.equal(body.tools,undefined);
 assert.match(body.systemInstruction.parts[0].text,/第一人稱/);
 assert.match(body.systemInstruction.parts[0].text,/優先保留原標題/);
 assert.match(body.systemInstruction.parts[0].text,/本次傳入的文章才是事實來源/);
 assert.throws(()=>ai.get(result.token,{...draft,revision:2},'owner'),/修改/);
 assert.throws(()=>ai.get(result.token,draft,'stranger'),/修改/);
 assert.ok(!fs.readFileSync(ai.file(result.token),'utf8').includes('test-secret'));
 fs.writeFileSync(ai.file(result.token),JSON.stringify({...result,styleVersion:'old'}));
 assert.throws(()=>ai.get(result.token,draft,'owner'),/重新產生/);
 ai.discard(result.token);assert.throws(()=>ai.get(result.token,draft,'owner'),/失效/);
});
test('quota limits and incomplete responses never produce adoptable changes',async t=>{
 const ai=setup(t,async()=>new Response('{}',{status:429}));
 await assert.rejects(ai.suggest(draft,'metadata'),/額度/);assert.equal(ai.active.size,0);
 ai.fetcher=async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS'}]}));
 await assert.rejects(ai.suggest(draft,'polish'),/完整/);
 assert.equal(fs.readdirSync(ai.dir).filter(f=>f.endsWith('.json')).length,0);
});
test('photo suggestions are constrained to provided assets and preserve image locations',()=>{
 const d={...draft,assets:[{url:'/images/a.webp',alt:'照片'}]};
 const r=validateSuggestion({captions:[{index:0,alt:'書架上的書'}],notes:[]},'photos',d);
 assert.equal(r.body,'內容 ![書架上的書](/images/a.webp)');
 assert.throws(()=>validateSuggestion({captions:[{index:4,alt:'wrong'}],notes:[]},'photos',d),/格式/);
});
test('API usage is recorded without content and survives discarded or incomplete suggestions',async t=>{
 const usageMetadata={promptTokenCount:120,candidatesTokenCount:30,totalTokenCount:150,unknown:'ignored'};
 const ai=setup(t,async()=>new Response(JSON.stringify({usageMetadata,candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({notes:[]})}]}}]})));
 const result=await ai.suggest(draft,'review');
 assert.deepEqual(result.usage,{promptTokenCount:120,candidatesTokenCount:30,totalTokenCount:150});
 ai.discard(result.token);
 ai.fetcher=async()=>new Response(JSON.stringify({usageMetadata:{totalTokenCount:45},candidates:[{finishReason:'MAX_TOKENS'}]}));
 await assert.rejects(ai.suggest(draft,'review'),/完整/);
 const raw=fs.readFileSync(path.join(ai.dir,'usage.jsonl'),'utf8');
 const rows=raw.trim().split('\n').map(s=>JSON.parse(s));
 assert.equal(rows.length,2);assert.equal(rows[1].usage.totalTokenCount,45);
 assert.equal(rows[1].finishReason,'MAX_TOKENS');
 assert.ok(!raw.includes('test-secret'));assert.ok(!raw.includes(draft.body));assert.ok(!raw.includes('unknown'));
});
test('layout mode requests supported callouts and retains the draft kind and image links',async t=>{
 let request;
 const body=':::info\n補充資訊\n:::\n\n'+draft.body;
 const ai=setup(t,async(_url,init)=>{request=JSON.parse(init.body);return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({body,notes:[]})}]}}]}));});
 const result=await ai.suggest({...draft,kind:'talk'},'layout');
 assert.equal(result.update.body,body);
 assert.match(request.systemInstruction.parts[0].text,/:::info/);
 assert.match(request.systemInstruction.parts[0].text,/relatedPosts/);
 assert.match(request.systemInstruction.parts[0].text,/不要在 body 重複產生 YAML/);
 assert.match(request.systemInstruction.parts[0].text,/不能集中搬到文末/);
 assert.equal(JSON.parse(request.contents[0].parts[0].text).kind,'talk');
 assert.throws(()=>validateSuggestion({body:'沒有圖片',notes:[]},'layout',draft),/連結/);
});
