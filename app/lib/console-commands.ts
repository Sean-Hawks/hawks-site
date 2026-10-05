export type ConsoleCommand = {
  id: string;
  label: string;
  description: string;
  href: string;
};

const destinations: Array<ConsoleCommand & { aliases: string }> = [
  { id: "home", label: "總覽", description: "個人簡介與最新動態", href: "/", aliases: "home 首頁" },
  { id: "blog", label: "文章與近況", description: "學習筆記、活動心得與生活紀錄", href: "/blog/", aliases: "blog talk writing 筆記" },
  { id: "library", label: "收藏", description: "動畫、電影、音樂與遊戲", href: "/library/", aliases: "library acgm" },
  { id: "project", label: "專案", description: "程式作品與個人專案", href: "/project/", aliases: "project code" },
  { id: "timeline", label: "經歷", description: "學習、社群、競賽與音樂", href: "/timeline/", aliases: "timeline resume 關於我" },
  { id: "explore", label: "隨機探索", description: "依可用時間挑一篇讀", href: "/explore/", aliases: "explore random" },
  { id: "saved", label: "稍後閱讀", description: "回到儲存的文章與評論", href: "/saved/", aliases: "saved bookmark" },
  { id: "subscribe", label: "訂閱更新", description: "透過 RSS 追蹤網站更新", href: "/subscribe/", aliases: "subscribe rss" },
  { id: "contact", label: "聯絡我", description: "Email、GitHub 與 Discord", href: "/contact/", aliases: "contact email" },
];

export function consoleCommands(query: string): ConsoleCommand[] {
  const term = query.trim();
  const normalized = term.normalize("NFKC").toLowerCase();
  const matches = destinations.filter((item) =>
    `${item.label} ${item.description} ${item.aliases}`.normalize("NFKC").toLowerCase().includes(normalized),
  );
  return term
    ? [{ id: "search", label: `搜尋「${term}」`, description: "在文章、近況與收藏中搜尋全文", href: `/search/?q=${encodeURIComponent(term)}` }, ...matches].slice(0, 7)
    : matches.slice(0, 7);
}

export const CONSOLE_COMMAND_EVENT = "hawks:console-command";

export function isConsoleCommandShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  repeat?: boolean;
  isComposing?: boolean;
}): boolean {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
    && !event.repeat && !event.isComposing && event.key.toLowerCase() === "k";
}
