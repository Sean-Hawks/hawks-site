import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

function loadTs(url, cwd) {
  const compiled = ts.transpileModule(fs.readFileSync(url, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const exports = {};
  const require = createRequire(url);
  vm.runInNewContext(compiled, { exports, process: { cwd: () => cwd }, require: id => id.startsWith('.') ? loadTs(new URL(`${id}.ts`, url), cwd) : require(id) });
  return exports;
}
for (const [module, folder, fn, statusField] of [['posts','posts','getSortedPostsData','status'], ['talks','talks','getSortedTalksData','status'], ['library','library','getAllLibraryItems','statusVisibility']]) {
  test(`${module}: private content stays out of public loaders and executable frontmatter is rejected`, t => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    t.after(() => { if (previousTimezone === undefined) delete process.env.TZ; else process.env.TZ = previousTimezone; });
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-content-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const dir = path.join(root,'content',folder);
    fs.mkdirSync(dir, { recursive: true });
    for (const status of ['draft','private','published']) fs.writeFileSync(path.join(dir, status+'.md'), `---\ntitle: ${status}\ndate: 2026-09-19\n${statusField}: ${status}\n---\nbody`);
    fs.writeFileSync(path.join(dir,'.DS_Store'),'non-markdown');
    const loader = loadTs(new URL(`../app/lib/${module}.ts`, import.meta.url), root)[fn];
    const records = loader();
    assert.equal(records.length, 1);
    assert.equal(records[0].title, 'published');
    assert.equal(records[0].date, '2026-09-19');
    fs.writeFileSync(path.join(dir,'unsafe.md'), '\ufeff---js\n(() => { throw new Error("PAYLOAD_EXECUTED"); })()\n---\nbody');
    assert.throws(loader, /Executable frontmatter is not supported/);
  });
}
