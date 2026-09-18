import test from 'node:test';
import assert from 'node:assert/strict';
import { staticAssetPath, sameOriginPage, fetchBounded } from '../scripts/static-assets.mjs';

test('legacy assets stay inside the static directory after decoding', () => {
  assert.equal(staticAssetPath('/_next/static/chunks/app/%5Bslug%5D/page-123.js', '/tmp/out'), '/tmp/out/_next/static/chunks/app/[slug]/page-123.js');
  for (const value of ['/elsewhere/a.js', '/_next/static/../../../outside.js', '/_next/static/%2e%2e/%2e%2e/outside.js', '/_next/static/a%2f..%2f..%2foutside.js', '/_next/static/a%5c..%5coutside.js', '/_next/static/%252e%252e/a.js', '/_next/static/evil.html', '/_next/static/a.js?query=1', '/_next/static/%', '/_next/static/%00.js']) {
    assert.equal(staticAssetPath(value, '/tmp/out'), null, value);
  }
});
test('sitemap pages cannot send the build to a different origin or credentials', () => {
  assert.equal(sameOriginPage('https://hawks.tw/blog/', 'https://hawks.tw'), 'https://hawks.tw/blog/');
  for (const value of ['http://hawks.tw/', 'https://example.com/', 'https://hawks.tw.evil.test/', 'https://user:pass@hawks.tw/', 'not a URL']) assert.equal(sameOriginPage(value, 'https://hawks.tw'), null);
});
test('downloads are bounded even without a content-length header', async () => {
  const fetcher = async (_url, options) => {
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return new Response('12345');
  };
  await assert.rejects(fetchBounded('https://hawks.tw/a', 4, fetcher), /size limit/);
  assert.equal((await fetchBounded('https://hawks.tw/a', 5, fetcher)).toString(), '12345');
});
