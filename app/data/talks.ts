export interface Talk {
  id: string;
  date: string;
  year: string;
  title: string;
  event: string;
  desc: string;
  slides?: string;
  video?: string;
}

export const talks: Talk[] = [
  {
    id: "talk-new",
    date: "2026-01-01",
    year: "2026",
    title: "新的演講標題",
    event: "活動名稱",
    desc: "演講描述...",
    slides: "https://slides.com/...", // 選填
    video: "https://youtube.com/...", // 選填
  },
  {
    id: "talk-1",
    date: "2025-12-10",
    year: "2025",
    title: "如何用 Vibe Coding 建構網站",
    event: "Yuxiu Cup Sharing",
    desc: "分享在郁秀杯中使用 LLM 輔助全端開發的經驗與心得。",
    slides: "#",
  },
  {
    id: "talk-2",
    date: "2024-08-20",
    year: "2024",
    title: "演算法競賽入門",
    event: "High School Club",
    desc: "給學弟妹的演算法入門介紹，包含 C++ 基礎與複雜度分析。",
  },
];
