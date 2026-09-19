import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';

const url = new URL('../app/lib/headings.ts', import.meta.url);
const code = ts.transpileModule(fs.readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const exports = {};
vm.runInNewContext(code, { exports, require: createRequire(url) });
const { getArticleHeadings, remarkHeadingIds } = exports;

test('TOC ignores code, resolves formatting and includes setext headings', () => {
  const content = '## **你好** [世界](https://example.com)\n\n```md\n# not a heading\n```\n\n第二節\n---\n\n## ヨルシカ';
  const headings = getArticleHeadings(content);
  assert.deepEqual(Array.from(headings, item => item.title), ['你好 世界','第二節','ヨルシカ']);
  assert.deepEqual(Array.from(headings, item => item.id), ['你好-世界','第二節','ヨルシカ']);
});
test('duplicate headings have unique matching TOC and rendered anchor IDs', () => {
  const content = '## Intro\n## Intro\n## Intro-1\n#### Intro\n## !!!';
  const processor = unified().use(remarkParse).use(remarkHeadingIds).use(remarkRehype);
  const tree = processor.runSync(processor.parse(content));
  const ids = tree.children.filter(node => node.type === 'element').map(node => node.properties.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const heading of getArticleHeadings(content)) assert.ok(ids.includes(heading.id));
  assert.deepEqual(ids, ['intro','intro-1','intro-1-1','intro-2','section']);
});
