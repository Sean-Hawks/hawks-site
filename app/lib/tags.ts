// Keep existing Latin tag URLs while retaining Chinese and Japanese labels.
export function tagToSlug(tag: string) {
  return tag.trim().replace(/^#+/, '').normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'tag';
}
