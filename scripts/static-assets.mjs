import path from 'node:path';

// Decode before checking: URL normalization alone misses encoded separators.
export function staticAssetPath(value, outDir) {
  let decoded;
  try { decoded = decodeURIComponent(value.replace(/\\+$/g, '')); } catch { return null; }
  if (!decoded.startsWith('/_next/static/') || /[\\\x00-\x20?#%]/.test(decoded)) return null;
  const parts = decoded.split('/');
  if (parts.some(part => part === '.' || part === '..')) return null;
  if (!/\.(?:js|css|woff2?|ttf|otf)$/.test(decoded)) return null;
  const root = path.resolve(outDir, '_next/static');
  const output = path.resolve(outDir, `.${decoded}`);
  return output.startsWith(`${root}${path.sep}`) ? output : null;
}

export function sameOriginPage(value, origin) {
  try {
    const url = new URL(value);
    if (url.origin !== new URL(origin).origin || url.username || url.password) return null;
    url.hash = '';
    return url.href;
  } catch { return null; }
}

export async function fetchBounded(url, maxBytes, fetcher = fetch) {
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > maxBytes) {
    await response.body?.cancel();
    throw new Error('Response exceeds size limit');
  }
  const reader = response.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Response exceeds size limit');
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    await reader.cancel();
  }
}
