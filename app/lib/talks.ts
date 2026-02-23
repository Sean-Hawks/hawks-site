import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Talk } from '../types';

const talksDirectory = path.join(process.cwd(), 'content/talks');

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

    // 處理 Obsidian 格式的 banner 圖片連結
    let banner = data.banner;
    if (banner && typeof banner === 'string') {
      const match = banner.match(/^\[\[(.*?)\]\]$/);
      if (match) {
        banner = `/images/${match[1]}`;
      } else if (!banner.startsWith('/')) {
        banner = `/images/${banner}`;
      }
    }

    return {
      id,
      desc: content, // 內文作為描述
      year: data.date ? data.date.split('-')[0] : 'Unknown', // 自動從日期提取年份
      ...(data as Omit<Talk, 'id' | 'desc' | 'year'>),
      banner,
    };
  });

  // 依日期排序 (最新的在前面)
  return allTalksData.sort((a, b) => (a.date < b.date ? 1 : -1));
}
