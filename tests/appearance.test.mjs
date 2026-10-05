import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const code = ts.transpileModule(fs.readFileSync(new URL('../app/lib/appearance.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;

function setup(saved = new Map(), blocked = false) {
  const dataset = {};
  const exports = {};
  let time = 0;
  const context = vm.createContext({
    exports,
    document: { documentElement: { dataset } },
    localStorage: {
      getItem(key) { if (blocked) throw Error('denied'); return saved.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw Error('denied'); saved.set(key, value); },
    },
    performance: { now: () => time },
  });
  vm.runInContext(code, context);
  vm.runInContext(exports.appearanceBootstrap, context);
  const clicks = exports.createAppearanceClickHandler(exports.toggleTheme, exports.toggleGui);
  return {
    dataset, saved, api: exports,
    click(at) { time = at; clicks.click(); },
    blur() { clicks.reset(); },
  };
}

function triple(env, start = 0) {
  for (const offset of [0, 100, 200]) env.click(start + offset);
}

test('new visitors get the classic light GUI; existing dark preferences stay valid', () => {
  assert.deepEqual(setup().dataset, { gui: 'classic', theme: 'light' });
  assert.deepEqual(setup(new Map([['theme-v2', 'dark']])).dataset, { gui: 'classic', theme: 'dark' });
  assert.deepEqual(setup(new Map([['gui-v1', 'broken'], ['theme-v2', 'broken']])).dataset, { gui: 'classic', theme: 'light' });
});

test('one click changes theme immediately and saves the existing preference key', () => {
  const env = setup();
  env.click(0);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'dark' });
  assert.equal(env.saved.get('theme-v2'), 'dark');
  env.click(100);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'light' });
});

test('a rapid triple opens the dark console and a second triple restores the original GUI and theme', () => {
  for (const original of ['light', 'dark']) {
    const env = setup(new Map([['theme-v2', original]]));
    triple(env);
    assert.deepEqual(env.dataset, { gui: 'console', theme: 'dark' });
    assert.equal(env.saved.get('theme-v2'), original);
    triple(env, 1000);
    assert.deepEqual(env.dataset, { gui: 'classic', theme: original });
  }
});

test('three slow clicks remain three theme changes and never activate the console', () => {
  const env = setup();
  for (const at of [0, 500, 1000]) env.click(at);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'dark' });
  assert.equal(env.saved.has('gui-v1'), false);
});

test('a pause resets the burst, while clicks at the 350 ms boundary count as rapid', () => {
  const env = setup();
  for (const at of [0, 200, 800, 900]) env.click(at);
  assert.equal(env.dataset.gui, 'classic');
  env.click(1000);
  assert.equal(env.dataset.gui, 'console');
  const boundary = setup();
  for (const at of [0, 350, 700]) boundary.click(at);
  assert.equal(boundary.dataset.gui, 'console');
  const slow = setup();
  for (const at of [0, 351, 702]) slow.click(at);
  assert.equal(slow.dataset.gui, 'classic');
});

test('six rapid clicks switch twice; leaving the button breaks the click sequence', () => {
  const env = setup();
  for (const at of [0, 100, 200, 300, 400, 500]) env.click(at);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'light' });
  env.click(1000);
  env.click(1100);
  env.blur();
  env.click(1200);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'dark' });
});

test('GUI choice and independent theme preferences survive navigation or a fresh load', () => {
  const env = setup(new Map([['theme-v2', 'dark']]));
  triple(env);
  env.click(1000);
  assert.deepEqual(env.dataset, { gui: 'console', theme: 'light' });
  assert.deepEqual(setup(env.saved).dataset, env.dataset);
  triple(env, 2000);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'dark' });
  assert.deepEqual(setup(env.saved).dataset, env.dataset);
  triple(env, 3000);
  assert.deepEqual(env.dataset, { gui: 'console', theme: 'light' });
});

test('blocked storage still allows both theme and GUI controls to work for this page', () => {
  const env = setup(new Map(), true);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'light' });
  triple(env);
  assert.deepEqual(env.dataset, { gui: 'console', theme: 'dark' });
  env.click(1000);
  assert.deepEqual(env.dataset, { gui: 'console', theme: 'light' });
  triple(env, 2000);
  assert.deepEqual(env.dataset, { gui: 'classic', theme: 'light' });
});
