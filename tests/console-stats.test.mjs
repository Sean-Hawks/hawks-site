import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(name) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../app/lib/${name}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => load(id.replace(/^\.\//, '')) });
  return exports;
}
const { consoleStatistics } = load('console-stats');
const post = { slug: 'essay', title: 'Essay', date: '2026-01-01', content: '文'.repeat(3000) };
const review = { slug: 'review', category: 'anime', title: 'Review', date: '2026-01-01', content: '文'.repeat(600), hasReview: true, rating: 8 };

test('reading inventory matches the public discovery pool and its five-minute filter', () => {
  const { reading } = consoleStatistics(
    [post, { ...post, status: 'draft' }],
    [{ id: 'short', title: 'Note', date: '2026-01-01', desc: '短文' }],
    [review, { ...review, hasReview: false }],
  );
  assert.equal(reading.count, 3);
  assert.equal(reading.minutes, 9);
  assert.equal(reading.shortCount, 2);
  assert.equal(reading.breakdown.find((item) => item.kind === 'post').minutes, 6);
  assert.equal(reading.breakdown.reduce((sum, item) => sum + item.minutes, 0), reading.minutes);
});

test('collection channels partition published items and include unrated entries', () => {
  const stats = consoleStatistics([], [], [review, { ...review, category: 'game', rating: null }, { ...review, statusVisibility: ' PRIVATE ' }]);
  assert.equal(stats.collection.find((item) => item.category === 'anime').count, 1);
  assert.equal(stats.collection.find((item) => item.category === 'game').count, 1);
  assert.equal(stats.collection.reduce((sum, item) => sum + item.count, 0), 2);
  assert.equal(stats.averageRating, 8);
});

test('zero scores contribute to the average while unrated and non-finite values do not', () => {
  const stats = consoleStatistics([], [], [review, { ...review, rating: 0 }, { ...review, rating: null }, { ...review, rating: NaN }]);
  assert.equal(stats.averageRating, 4);
  assert.equal(consoleStatistics([], [], [{ ...review, rating: null }]).averageRating, null);
});

test('an empty site has zero inventory without NaN, imaginary minimums or a fabricated score', () => {
  const stats = consoleStatistics([], [], []);
  assert.equal(stats.reading.count, 0);
  assert.equal(stats.reading.minutes, 0);
  assert.equal(stats.reading.shortCount, 0);
  assert.ok(stats.collection.every((item) => item.count === 0));
  assert.equal(stats.averageRating, null);
});
