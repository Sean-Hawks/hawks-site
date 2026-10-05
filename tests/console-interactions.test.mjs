import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../app/lib/console-interactions.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports });
const { consoleLibraryPage } = exports;
const item = (id, rating, extra = {}) => ({ id, rating, category: 'anime', featured: false, ...extra });

test('collection previews preserve featured order before rating without mutating source records', () => {
  const items = [item('high', 10), item('second', 8, { featured: true, featuredOrder: 2 }), item('first', 7, { featured: true, featuredOrder: 1 }), item('low', 1)];
  const page = consoleLibraryPage(items, 'all', 0);
  assert.deepEqual(Array.from(page.items, (item) => item.id), ['first', 'second', 'high']);
  assert.equal(items[0].id, 'high');
  assert.equal(page.pageCount, 2);
});

test('category previews and subsequent pages never include another category or repeat an item', () => {
  const items = [...Array.from({ length: 7 }, (_, index) => item(`a${index}`, index)), item('movie', 10, { category: 'movie' })];
  const pages = [0, 1, 2].map((page) => consoleLibraryPage(items, 'anime', page));
  assert.equal(pages[0].total, 7);
  assert.equal(pages[2].from, 7);
  assert.equal(pages[2].to, 7);
  const ids = pages.flatMap((page) => Array.from(page.items, (item) => item.id));
  assert.equal(new Set(ids).size, 7);
  assert.ok(!ids.includes('movie'));
});

test('page boundaries clamp safely and an empty category stays empty', () => {
  const items = [item('zero', 0), item('unrated', null), item('top', 9), item('extra', 1)];
  assert.equal(consoleLibraryPage(items, 'all', 99).page, 1);
  assert.equal(consoleLibraryPage(items, 'all', -2).page, 0);
  assert.equal(consoleLibraryPage(items, 'all', NaN).page, 0);
  assert.deepEqual(Array.from(consoleLibraryPage(items, 'all', 0).items, (item) => item.id), ['top', 'extra', 'zero']);
  const empty = consoleLibraryPage(items, 'artist', 1);
  assert.equal(empty.total, 0);
  assert.equal(empty.from, 0);
  assert.equal(empty.to, 0);
  assert.equal(empty.page, 0);
  assert.equal(empty.pageCount, 0);
});
