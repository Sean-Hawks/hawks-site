import test from 'node:test';
import assert from 'node:assert/strict';
import { importMarkdown } from '../src/import.mjs';

test('BOM cannot bypass the Markdown import executable-frontmatter guard', () => {
  for (const engine of ['javascript', 'js', 'JavaScript']) {
    const text = `\ufeff---${engine}\n(() => { throw new Error('PAYLOAD_EXECUTED'); })()\n---\nbody`;
    assert.throws(() => importMarkdown(text, 'note.md'), /Executable frontmatter is not supported/);
  }
});
test('BOM-prefixed normal YAML imports remain supported', () => {
  assert.equal(importMarkdown('\ufeff---\ntitle: 正常筆記\n---\nbody', 'note.md').title, '正常筆記');
});
