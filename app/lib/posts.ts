import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Post } from '../types';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export function getSortedPostsData(): Post[] {
  // 如果資料夾不存在，回傳空陣列
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // 移除 ".md" 副檔名作為 slug
    const slug = fileName.replace(/\.md$/, '');

    // 讀取 markdown 檔案
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // 使用 gray-matter 解析 metadata 區塊
    const { data, content } = matter(fileContents);

    // 處理 Obsidian 格式的 banner 圖片連結 (例如: "[[image.png]]" -> "/images/image.png")
    let banner = data.banner;
    if (banner && typeof banner === 'string') {
      const match = banner.match(/^\[\[(.*?)\]\]$/);
      if (match) {
        banner = `/images/${match[1]}`;
      } else if (!banner.startsWith('/')) {
        // 如果只寫檔名，自動補上 /images/
        banner = `/images/${banner}`;
      }
    }

    // 處理日期格式
    let dateStr = '';
    if (data.date) {
      if (data.date instanceof Date) {
        // 如果 gray-matter 把日期解析成了 Date 物件，將其轉回 YYYY-MM-DD 格式
        // 為了避免時區問題，使用 getFullYear 等方法組合
        const d = data.date;
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        dateStr = String(data.date);
      }
    }

    return {
      slug,
      content,
      ...(data as Omit<Post, 'slug' | 'content' | 'date'>),
      date: dateStr,
      banner,
    };
  });

  // 依日期排序
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | undefined {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return undefined;

  const fileContents = fs.readFileSync(fullPath, 'utf8');
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

  // 處理日期格式
  let dateStr = '';
  if (data.date) {
    if (data.date instanceof Date) {
      const d = data.date;
      dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } else {
       // 嘗試處理已經變成長字串的日期
       const str = String(data.date);
       if (str.includes('GMT') || str.match(/^[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d{2}\s\d{4}/)) {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          } else {
            dateStr = str;
          }
       } else {
         dateStr = str;
       }
    }
  }

  return {
    slug,
    content,
    ...(data as Omit<Post, 'slug' | 'content' | 'date'>),
    date: dateStr,
    banner,
  };
}
