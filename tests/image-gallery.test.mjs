import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

function loadComponent(name, from = new URL('../app/components/', import.meta.url)) {
  const base = new URL(name, from);
  const url = ['.tsx', '.ts'].map(ext => new URL(base.href + ext)).find(candidate => fs.existsSync(candidate));
  const compiled = ts.transpileModule(fs.readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {}, require = createRequire(url);
  vm.runInNewContext(compiled, { exports, process, require: id => id === 'lucide-react' ? new Proxy({}, { get: () => () => React.createElement('svg') }) : id.startsWith('.') ? loadComponent(id, url) : require(id) });
  return exports;
}
const MarkdownContent = loadComponent('MarkdownContent').default;

test('Talk uses Blog typography and preserves heading anchors, inline code, fenced code, and callouts', () => {
  const content = '## 電腦\n\n### 筆電\n\n使用 `ssh home` 連線。\n\n```sh\nssh home\n  echo ready\n```\n\n:::info\n補充資訊\n:::\n\n- CPU\n- RAM';
  const render = variant => renderToStaticMarkup(React.createElement(MarkdownContent, { content, variant }));
  const html = render('talk');
  assert.equal(html, render('default'));
  assert.match(html, /<h3[^>]*id="筆電"/);
  assert.doesNotMatch(html, /talk-section/);
  assert.match(html, /<code[^>]*>ssh home<\/code> 連線/);
  assert.match(html, /<pre[^>]*><code[^>]*class="[^"]*language-sh[^\"]*"[^>]*>ssh home\n  echo ready\n<\/code><\/pre>/);
  assert.match(html, /admonition-info/);
});

test('sidebar is omitted for short notes and preserves nested heading links for long articles', () => {
  const { ArticleSidebar } = loadComponent('ArticleContents');
  const render = headings => renderToStaticMarkup(React.createElement(ArticleSidebar, { headings }));
  assert.equal(render([]), '');
  assert.equal(render([{ id: 'one', title: '短文', level: 2 }]), '');
  const html = render([{ id: 'computer', title: '電腦', level: 2 }, { id: 'laptop', title: '筆電', level: 3 }]);
  assert.match(html, /href="#computer" style="padding-left:0rem"/);
  assert.match(html, /href="#laptop" style="padding-left:0.75rem"/);
});

for (const variant of ['default', 'talk', 'libraryReview']) {
  test(`${variant}: consecutive image pairs become one four-tile album, prose separates albums`, () => {
    const photo = n => `![照片${n}](/images/${n}.webp)`;
    const content = `${photo(1)} ${photo(2)}\n\n${photo(3)} ${photo(4)}\n\n${photo(5)} ${photo(6)}\n\n中間文字\n\n${photo(7)}`;
    const html = renderToStaticMarkup(React.createElement(MarkdownContent, { content, variant }));
    assert.equal((html.match(/aria-label="6 張文章照片"/g) || []).length, 1);
    assert.equal((html.match(/<img /g) || []).length, 5);
    assert.ok(html.includes('grid-cols-2'));
    assert.ok(html.includes('查看其餘 3 張'));
    assert.ok(html.indexOf('中間文字') > html.indexOf('/images/4.webp'));
    assert.ok(html.indexOf('中間文字') < html.indexOf('/images/7.webp'));
  });
}
