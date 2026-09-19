import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
function load(name, globals = {}) {
  const url = new URL(`../app/lib/${name}.ts`, import.meta.url);
  const code = ts.transpileModule(fs.readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {}, require = createRequire(url);
  vm.runInNewContext(code, { exports, ...globals, require: id => id === 'react' ? {useSyncExternalStore: (_subscribe,read) => read()} : id.startsWith('./') ? load(id.slice(2),globals) : require(id) });
  return exports;
}
const {parseReadingList,applyReadingAction} = load('reading-list');
const raw = entries => JSON.stringify({version:1,entries});
const entry = {id:'post:hipac',savedAt:100,readAt:null};
test('malformed or poisoned browser data cannot inject links or crash the shelf', () => {
  for (const data of [null,'{','null','[]',JSON.stringify({version:2,entries:[entry]}),'x'.repeat(100001)]) assert.equal(parseReadingList(data).length,0);
  const parsed = parseReadingList(raw([null,entry,entry,{...entry,id:'javascript:alert(1)'},{...entry,id:'talk:2026-09-19',savedAt:-1},{...entry,id:'post:other',href:'https://evil.example/'}]));
  assert.equal(parsed.length,2);
  assert.equal(parsed[1].href,undefined);
});
test('save, mark read, remove and undo preserve the original saved time without duplicates', () => {
  let entries = applyReadingAction([],{type:'toggle',id:entry.id},100);
  entries = applyReadingAction(entries,{type:'read',id:entry.id},200);
  assert.equal(entries[0].readAt,200);
  const before = entries[0];
  entries = applyReadingAction(entries,{type:'remove',id:entry.id});
  entries = applyReadingAction(entries,{type:'restore',entry:before});
  entries = applyReadingAction(entries,{type:'restore',entry:before});
  assert.equal(entries.length,1); assert.equal(entries[0].savedAt,100);
  assert.equal(applyReadingAction(entries,{type:'unread',id:entry.id})[0].readAt,null);
});
test('the list limit does not evict existing saves, and removing still works when full', () => {
  const entries = Array.from({length:200},(_,i)=>({...entry,id:`post:p-${i}`}));
  assert.equal(applyReadingAction(entries,{type:'toggle',id:'post:overflow'}).length,200);
  assert.equal(applyReadingAction(entries,{type:'toggle',id:'post:p-0'}).length,199);
});
function store(storage) { return load('reading-store',{localStorage:storage,window:{dispatchEvent(){}},Event:class Event{}}); }
test('mutations read the latest browser value so a save from another tab is retained', () => {
  let current = null;
  const s = store({getItem:()=>current,setItem:(_key,value)=>{current=value;}});
  s.updateReadingList({type:'toggle',id:'post:first'});
  current = raw([entry]);
  s.updateReadingList({type:'toggle',id:'talk:note'});
  assert.deepEqual(Array.from(parseReadingList(current),entry=>entry.id),['post:hipac','talk:note']);
});
test('blocked reads and failed writes retain a usable temporary list and disclose non-persistence', () => {
  for (const storage of [{getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}}, {getItem:()=>raw([entry]),setItem(){throw Error('quota');}}]) {
    const s = store(storage);
    const result = s.updateReadingList({type:'toggle',id:'talk:note'});
    assert.equal(result.applied,true); assert.ok(result.message);
    assert.equal(s.useReadingList().persistent,false);
    assert.ok(s.useReadingList().entries.some(entry=>entry.id==='talk:note'));
    s.updateReadingList({type:'read',id:'talk:note'});
    assert.ok(s.useReadingList().entries.find(entry=>entry.id==='talk:note').readAt);
  }
});
