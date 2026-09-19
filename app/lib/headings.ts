import { unified, type Plugin } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import { visit } from 'unist-util-visit';
import type { Root, RootContent } from 'mdast';

export type ArticleHeading = { id: string; title: string; level: number };

function nodeText(node: RootContent): string {
  if ('value' in node) return node.value;
  if (node.type === 'image') return node.alt ?? '';
  if ('children' in node) return node.children.map(child => nodeText(child as RootContent)).join('');
  return '';
}

export function headingId(value: string) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section';
}

function assignHeadings(tree: Root) {
  const used = new Set<string>();
  const headings: ArticleHeading[] = [];
  visit(tree, 'heading', node => {
    const title = node.children.map(child => nodeText(child)).join('');
    const base = headingId(title);
    let id = base;
    for (let suffix = 1; used.has(id); suffix += 1) id = `${base}-${suffix}`;
    used.add(id);
    node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id } };
    if (node.depth <= 3) headings.push({ id, title, level: node.depth });
  });
  return headings;
}

export const remarkHeadingIds: Plugin<[], Root> = () => tree => { assignHeadings(tree); };

export function getArticleHeadings(content = '') {
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkDirective).parse(content);
  return assignHeadings(tree);
}
