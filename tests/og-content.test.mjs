import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readPublishedMarkdown, removeStaleOgImages } from '../scripts/og-content.mjs';

test('private and draft metadata are excluded from OG generation; stale generated images are removed', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-og-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [name, status] of [['visible','published'], ['draft',' DRAFT '], ['private','private'], ['legacy','']]) {
    fs.writeFileSync(path.join(dir, name + '.md'), `---\ntitle: ${name}\nstatus: "${status}"\n---\nbody`);
  }
  assert.deepEqual(readPublishedMarkdown(dir).map(item => item.data.title).sort(), ['legacy','visible']);
  for (const name of ['blog-visible.png','blog-draft.png','talk-private.png','custom.png']) fs.writeFileSync(path.join(dir, name), 'fixture');
  removeStaleOgImages(dir, new Set(['blog-visible.png']));
  assert.ok(fs.existsSync(path.join(dir,'blog-visible.png')));
  assert.ok(fs.existsSync(path.join(dir,'custom.png')));
  assert.ok(!fs.existsSync(path.join(dir,'blog-draft.png')));
  assert.ok(!fs.existsSync(path.join(dir,'talk-private.png')));
});
test('OG metadata never executes a JavaScript engine', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hawks-og-security-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.writeFileSync(path.join(dir,'bad.md'), '\ufeff---js\n(() => { throw new Error("PAYLOAD_EXECUTED"); })()\n---\nbody');
  assert.throws(() => readPublishedMarkdown(dir), /Executable frontmatter is not supported/);
});
