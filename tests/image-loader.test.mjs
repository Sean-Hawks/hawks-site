import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../app/lib/image-loader.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(code, { exports, process: { env: { NEXT_PUBLIC_IMAGE_MANIFEST: JSON.stringify({ '/images/照片 1.png': [240,480,800] }) } } });
const { optimizedSrc, optimizedSrcSet } = exports;

test('responsive URLs use only existing widths and encode filenames once', () => {
  assert.equal(optimizedSrc('/images/照片 1.png',300), '/_img/images/%E7%85%A7%E7%89%87%201.png/480.webp');
  assert.equal(optimizedSrc('/images/%E7%85%A7%E7%89%87%201.png',2000), '/_img/images/%E7%85%A7%E7%89%87%201.png/800.webp');
  assert.ok(optimizedSrcSet('/images/照片 1.png').endsWith('/800.webp 800w'));
  assert.ok(!optimizedSrcSet('/images/照片 1.png').includes('2000w'));
});
test('unknown, remote, animated and malformed sources safely use originals', () => {
  for (const src of ['/images/missing.png','https://example.com/image.png','//example.com/image.png','/images/animation.gif','/images/animation.webp','/images/%.png','/images/../photo.png','/images/photo.png?v=1']) {
    assert.equal(optimizedSrc(src,960),src);
    assert.equal(optimizedSrcSet(src),undefined);
  }
});
