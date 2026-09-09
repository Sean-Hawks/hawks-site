import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Exercise the actual loader against an isolated vault, without touching notes.
test('talk frontmatter summary cannot overwrite Markdown body or subtitle', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-talks-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'content/talks'), { recursive: true });
  const body = '第一段\n\n![展場](/images/test.webp)\n\n:::info\n補充資訊\n:::\n\n最後一段';
  fs.writeFileSync(path.join(dir, 'content/talks/example.md'), `---\ntitle: 近況\ndate: 2026-09-09\ndesc: 這只是摘要\nsubtitle: 不應覆蓋容器\nstatus: published\n---\n:::subtitle\n內文副標\n:::\n\n${body}`);
  const source = fs.readFileSync(new URL('../app/lib/talks.ts', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: createRequire(import.meta.url), process: { cwd: () => dir } });
  const [talk] = exports.getSortedTalksData();
  assert.equal(talk.desc, body);
  assert.equal(talk.subtitle, '內文副標');
  assert.equal(talk.title, '近況');
});
