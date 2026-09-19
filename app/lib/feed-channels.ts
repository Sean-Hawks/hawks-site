export const feedChannels = [
  {
    id: "all",
    title: "全部更新",
    description: "文章、近況與作品評論",
    path: "/rss.xml",
  },
  {
    id: "blog",
    title: "Blog 文章",
    description: "長篇文章與活動心得",
    path: "/feeds/blog/rss.xml",
  },
  {
    id: "talk",
    title: "Talk 近況",
    description: "短筆記、分享與演講記錄",
    path: "/feeds/talk/rss.xml",
  },
  {
    id: "library",
    title: "Library 評論",
    description: "有完整正文的作品評論",
    path: "/feeds/library/rss.xml",
  },
] as const;
export type FeedChannel = (typeof feedChannels)[number]["id"];
