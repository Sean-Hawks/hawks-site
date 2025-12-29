export type RoleTag = {
  label: string;
  color: string;
};

export interface Post {
  date: string;
  title: string;
  desc: string;
  slug: string;
  tags: string[];
  content?: string; // 文章完整內容（HTML 或 Markdown）
  banner?: string; // 新增：文章封面圖片路徑 (例如: "/images/banner.jpg")
}

export interface Talk {
  id: string;      // 檔名 (slug)
  title: string;
  date: string;
  year: string;    // 從 date 自動產生
  event?: string;  // 改為選填
  desc: string;    // 對應 Markdown 的內文
  slides?: string;
  video?: string;
}
