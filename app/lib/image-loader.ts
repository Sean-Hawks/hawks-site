// Injected by next.config after prebuild/predev creates the assets.
const manifest: Record<string, number[]> = JSON.parse(process.env.NEXT_PUBLIC_IMAGE_MANIFEST || '{}');

function imageInfo(src: string) {
  if (!src.startsWith('/') || src.startsWith('//') || /[?#]/.test(src)) return null;
  try {
    const decoded = decodeURIComponent(src);
    if (decoded.split('/').some(part => part === '.' || part === '..') || decoded.includes('\\')) return null;
    const widths = manifest[decoded];
    if (!Array.isArray(widths) || !widths.length) return null;
    return { path: decoded.split('/').map(encodeURIComponent).join('/'), widths };
  } catch { return null; }
}
export function optimizedSrc(src: string, width: number) {
  const image = imageInfo(src);
  if (!image) return src;
  const selected = image.widths.find(value => value >= width) ?? image.widths[image.widths.length - 1];
  return `/_img${image.path}/${selected}.webp`;
}
export function optimizedSrcSet(src: string) {
  const image = imageInfo(src);
  return image?.widths.map(width => `${optimizedSrc(src, width)} ${width}w`).join(', ');
}
export default function imageLoader({ src, width }: { src: string; width: number }) {
  return optimizedSrc(src, width);
}
