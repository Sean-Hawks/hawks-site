import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const exports = {};
const code = ts.transpileModule(fs.readFileSync(new URL('../app/lib/console-commands.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(code, { exports });
const { consoleCommands, isConsoleCommandShortcut } = exports;

test('opening the menu offers direct site navigation with no empty search', () => {
  for (const query of ['', '   ']) {
    const commands = consoleCommands(query);
    assert.equal(commands.length, 7);
    assert.equal(commands[0].href, '/');
    assert.ok(commands.every((command) => command.id !== 'search' && command.href.startsWith('/')));
    assert.equal(new Set(commands.map((command) => command.id)).size, commands.length);
  }
});

test('Chinese descriptions and normalized English aliases find the right page', () => {
  for (const query of ['動畫', 'LIBRARY', 'ＬＩＢＲＡＲＹ']) {
    assert.equal(consoleCommands(query).find((command) => command.id === 'library')?.href, '/library/');
  }
  assert.equal(consoleCommands('RSS').find((command) => command.id === 'subscribe')?.href, '/subscribe/');
  assert.equal(consoleCommands('聯絡我').find((command) => command.id === 'contact')?.href, '/contact/');
});

test('search preserves the complete query without interpreting it as a route or parameters', () => {
  for (const term of ['CTF prompt', '黃藍 & ?q=other#hash / +', 'https://example.com/', '無對應頁面的關鍵字']) {
    const command = consoleCommands(`  ${term}  `)[0];
    const url = new URL(command.href, 'https://hawks.tw');
    assert.equal(command.id, 'search');
    assert.equal(url.origin, 'https://hawks.tw');
    assert.equal(url.pathname, '/search/');
    assert.equal(url.searchParams.get('q'), term);
    assert.equal([...url.searchParams].length, 1);
    assert.equal(url.hash, '');
  }
});

test('the command shortcut supports macOS and Windows without taking modified browser shortcuts', () => {
  const key = { key: 'k', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
  assert.equal(isConsoleCommandShortcut({ ...key, metaKey: true }), true);
  assert.equal(isConsoleCommandShortcut({ ...key, ctrlKey: true, key: 'K' }), true);
  for (const extra of [{}, { shiftKey: true }, { altKey: true }, { repeat: true }, { isComposing: true }, { key: 'j' }]) {
    const event = Object.keys(extra).length ? { ...key, ctrlKey: true, ...extra } : key;
    assert.equal(isConsoleCommandShortcut(event), false);
  }
});
