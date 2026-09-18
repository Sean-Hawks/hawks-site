import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
function load(name) {
  const url = new URL(`../app/lib/${name}.ts`, import.meta.url);
  const code = ts.transpileModule(fs.readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {}, require = createRequire(url);
  vm.runInNewContext(code, { exports, require: id => id.startsWith('./') ? load(id.slice(2)) : require(id) });
  return exports;
}
const { tagToSlug } = load('tags');
const { buildSearchIndex, compactSearchTerm } = load('search');

test('tag URLs preserve existing Latin slugs and distinguish Chinese labels', () => {
  assert.equal(tagToSlug('#Machine-Learning'), 'machine-learning');
  assert.equal(tagToSlug('#Café & Code'), 'cafe-and-code');
  assert.equal(tagToSlug('#資安'), '資安');
  assert.notEqual(tagToSlug('#資安'), tagToSlug('#學習'));
});
test('search normalizes full-width and accented text and includes Talk tags', () => {
  const [item] = buildSearchIndex([], [{id:'note',title:'Pokémon ＡＩ',desc:'J-pop',date:'2026-09-19',tags:['#security']}]);
  for (const term of ['pokemon','ＡＩ','jpop','security']) assert.ok(item.haystack.includes(compactSearchTerm(term)), term);
  assert.ok(item.tags.includes('#security'));
});
test('a Library result without a detail page opens the matching collection item', () => {
  const [item] = buildSearchIndex([], [], [{slug:'pokemon',title:'Pokémon & friends',category:'game',date:'2026-09-19',tags:[],recommendedWorks:[],hasReview:false}]);
  const url = new URL(item.href, 'https://hawks.tw');
  assert.equal(url.pathname, '/library/game');
  assert.equal(url.searchParams.get('q'), 'Pokémon & friends');
  assert.equal(url.hash, '#item-pokemon');
});
