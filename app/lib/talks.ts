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
      desc: content, // 內文作為描述
      year: dateStr ? dateStr.split('-')[0] : 'Unknown', // 自動從日期提取年份
      ...(data as Omit<Talk, 'id' | 'desc' | 'year' | 'date'>),
      date: dateStr,
      banner,
    };
  });

  // 依日期排序 (最新的在前面)
  return allTalksData.sort((a, b) => (a.date < b.date ? 1 : -1));
}
