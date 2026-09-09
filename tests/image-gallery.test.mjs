import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

function loadComponent(name) {
  const url = new URL(`../app/components/${name}.tsx`, import.meta.url);
  const compiled = ts.transpileModule(fs.readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {}, require = createRequire(url);
  vm.runInNewContext(compiled, { exports, process, require: id => id === 'lucide-react' ? new Proxy({}, { get: () => () => React.createElement('svg') }) : id.startsWith('./') ? loadComponent(id.slice(2)) : require(id) });
  return exports;
}
const MarkdownContent = loadComponent('MarkdownContent').default;
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
