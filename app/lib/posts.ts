import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post } from '../types';

const postsDirectory = path.join(process.cwd(), 'content/posts');

function slugify(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'post';
}

export function tagToSlug(tag: string) {
  return slugify(tag.replace(/^#/, ''));
}

export function normalizeTag(tag: unknown) {
  if (typeof tag !== 'string') return '';
  const value = tag.trim().replace(/^#+/, '');
  return value ? `#${value}` : '';
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeTag).filter(Boolean);
}

function isPublicStatus(value: unknown) {
  if (typeof value !== 'string') return true;
  const status = value.trim().toLowerCase();
  return status !== 'draft' && status !== 'private';
}

function formatDate(value: unknown) {
  if (!value) return '';

  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }

  const str = String(value);
  if (str.includes('GMT') || str.match(/^[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d{2}\s\d{4}/)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }

  return str;
}

function normalizeBanner(value: unknown) {
  if (!value || typeof value !== 'string') return value;

  const match = value.match(/^\[\[(.*?)\]\]$/);
  if (match) {
    return `/images/${match[1]}`;
  }

  if (!value.startsWith('/')) {
    return `/images/${value}`;
  }

  return value;
}

function readPost(fileName: string): Post {
  const sourceFile = fileName;
  const fileSlug = fileName.replace(/\.md$/, '');
  const fullPath = path.join(postsDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  const explicitSlug = typeof data.slug === 'string' ? data.slug : '';
  const slug = slugify(explicitSlug || fileSlug);

  return {
    ...(data as Omit<Post, 'sourceFile' | 'slug' | 'content' | 'date'>),
    sourceFile,
    slug,
    content,
    date: formatDate(data.date),
    tags: normalizeTags(data.tags),
    banner: normalizeBanner(data.banner) as string | undefined,
  };
}

export function getSortedPostsData(): Post[] {
  // 如果資料夾不存在，回傳空陣列
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map(readPost)
    .filter((post) => isPublicStatus(post.status));

  // 依日期排序
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | undefined {
  return getSortedPostsData().find((post) => post.slug === slug);
}

export function getAllTags() {
  const counts = new Map<string, number>();

  for (const post of getSortedPostsData()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, slug: tagToSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getTagBySlug(slug: string) {
  return getAllTags().find((tag) => tag.slug === slug);
}

export function getPostsByTagSlug(slug: string) {
  return getSortedPostsData().filter((post) =>
    post.tags.some((tag) => tagToSlug(tag) === slug)
  );
}
