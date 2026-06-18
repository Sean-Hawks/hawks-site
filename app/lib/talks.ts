import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Talk } from '../types';

const talksDirectory = path.join(process.cwd(), 'content/talks');

function isPublicStatus(value: unknown) {
  if (typeof value !== 'string') return true;
  const status = value.trim().toLowerCase();
  return status !== 'draft' && status !== 'private';
}

function normalizeTag(tag: unknown) {
  if (typeof tag !== 'string') return '';
  const value = tag.trim().replace(/^#+/, '');
  return value ? `#${value}` : '';
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeTag).filter(Boolean);
}

function extractSubtitleDirective(content: string) {
  const subtitlePattern = /(^|\n):::\s*subtitle\s*\n([\s\S]*?)\n:::\s*(?=\n|$)/;
  const match = content.match(subtitlePattern);

  if (!match) {
    return { subtitle: '', content };
  }

  const before = content.slice(0, match.index);
  const after = content.slice((match.index ?? 0) + match[0].length);

  return {
    subtitle: match[2].trim(),
    content: `${before}${match[1] ?? ''}${after}`.replace(/^\n+/, '').trimStart(),
  };
}

export function getSortedTalksData(): Talk[] {
  // 如果資料夾不存在，回傳空陣列
  if (!fs.existsSync(talksDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(talksDirectory);
  const allTalksData = fileNames.map((fileName) => {
    // 移除 ".md" 副檔名作為 id
    const id = fileName.replace(/\.md$/, '');

    // 讀取 markdown 檔案
    const fullPath = path.join(talksDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // 使用 gray-matter 解析 metadata
    const { data, content } = matter(fileContents);
    const { subtitle, content: bodyContent } = extractSubtitleDirective(content);

    // 處理 Obsidian 格式的 banner 圖片連結
    let banner = data.banner;
    if (banner) {
      // 確保 banner 是字串
      const bannerStr = String(banner);
      const match = bannerStr.match(/^\[\[(.*?)\]\]$/);
      if (match) {
        banner = `/images/${match[1]}`;
      } else if (!bannerStr.startsWith('/')) {
        banner = `/images/${bannerStr}`;
      } else {
        banner = bannerStr;
      }
    }

    // 處理日期格式
    let dateStr = '';
    if (data.date) {
      if (data.date instanceof Date) {
        const d = data.date;
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        // 嘗試處理已經變成長字串的日期，或者一般字串
        const str = String(data.date);
        // 檢查是否是 "Mon Feb 23 2026..." 這種格式
        if (str.includes('GMT') || str.match(/^[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d{2}\s\d{4}/)) {
           const d = new Date(str);
           if (!isNaN(d.getTime())) {
             dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
           } else {
             dateStr = str; // 無法解析，保持原樣
           }
        } else {
           dateStr = str;
        }
      }
    }

    return {
      id,
      desc: bodyContent, // 內文作為描述
      subtitle,
      year: dateStr ? dateStr.split('-')[0] : 'Unknown', // 自動從日期提取年份
      ...(data as Omit<Talk, 'id' | 'desc' | 'year' | 'date'>),
      tags: normalizeTags(data.tags),
      date: dateStr,
      banner,
    };
  }).filter((talk) => isPublicStatus(talk.status));

  // 依日期排序 (最新的在前面)
  return allTalksData.sort((a, b) => (a.date < b.date ? 1 : -1));
}
