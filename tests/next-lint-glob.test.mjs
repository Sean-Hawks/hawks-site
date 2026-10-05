import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { ESLint } from 'eslint';

const require = createRequire(import.meta.url);
const nextPlugin = require('@next/eslint-plugin-next');
const { getRootDirs } = require('@next/eslint-plugin-next/dist/utils/get-root-dirs');

test('the installed Next lint plugin uses the local tinyglobby adapter', () => {
  const pluginRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
  const dependency = pluginRequire('fast-glob/package.json');
  assert.equal(dependency.version, '3.3.1-hawks.1');
  assert.equal(dependency.private, true);
});

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'hawks-lint-glob-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const name of ['site', 'docs']) {
    const pages = join(root, 'apps', name, 'pages');
    mkdirSync(pages, { recursive: true });
    writeFileSync(join(pages, 'about.js'), 'export default function About() { return null; }');
  }
  writeFileSync(join(root, 'apps', 'readme.md'), 'Not a Next.js project directory.');
  return root;
}

test('Next lint resolves default and literal roots without including child directories', t => {
  const root = fixture(t);
  assert.deepEqual(getRootDirs({ cwd: root, settings: {} }), [root]);
  const site = join(root, 'apps', 'site');
  const roots = getRootDirs({ cwd: root, settings: { next: { rootDir: site } } });
  assert.deepEqual(roots.map(path => resolve(path)), [site]);
});

test('Next lint supports wildcard, brace and array project roots while excluding files', t => {
  const root = fixture(t);
  const expected = ['docs', 'site'].map(name => join(root, 'apps', name));
  for (const rootDir of [join(root, 'apps', '*'), join(root, 'apps', '{site,docs}'), [join(root, 'apps', 'site'), join(root, 'apps', 'docs')]]) {
    const roots = getRootDirs({ cwd: root, settings: { next: { rootDir } } });
    assert.deepEqual(roots.map(path => resolve(path)).sort(), expected);
  }
  assert.deepEqual(getRootDirs({ cwd: root, settings: { next: { rootDir: join(root, 'missing', '*') } } }), []);
});

test('deeply nested brace patterns do not exhaust the call stack', t => {
  const root = fixture(t);
  const pluginRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
  const { globSync } = pluginRequire('fast-glob');
  const pattern = '{'.repeat(10_000) + 'missing' + '}'.repeat(10_000);
  assert.deepEqual(globSync(pattern, { cwd: root, onlyDirectories: true }), []);
});

test('Next internal-link lint still detects an anchor to a page in a configured project root', async t => {
  const root = fixture(t);
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: {
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      plugins: { '@next/next': nextPlugin },
      settings: { next: { rootDir: join(root, 'apps', '{site,docs}') } },
      rules: { '@next/next/no-html-link-for-pages': 'error' },
    },
  });
  const [bad] = await eslint.lintText('const page = <a href="/about">About</a>;', { filePath: 'example.js' });
  assert.equal(bad.errorCount, 1);
  assert.equal(bad.messages[0].ruleId, '@next/next/no-html-link-for-pages');
  const [good] = await eslint.lintText('const page = <a href="https://example.com/about">About</a>;', { filePath: 'example.js' });
  assert.equal(good.errorCount, 0);
});
