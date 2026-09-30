export type RecommendedBlog = {
  name: string;
  href: string;
  note: string;
};

export type FriendSite = {
  name: string;
  href: string;
};

// 推薦好文：常逛、值得推薦的個人部落格
export const recommendedBlogs: RecommendedBlog[] = [
  {
    name: "wiwi.blog",
    href: "https://wiwi.blog/",
    note: "讓我認識部落格這個生態的起點，官老師對網路有很強烈的看法。",
  },
  {
    name: "JN",
    href: "https://blog.giveanornot.com/",
    note: "語氣很舒服，像素風格很有家的味道，更新也很頻繁。",
  },
  {
    name: "毛哥EM",
    href: "https://emtech.cc/",
    note: "網站風格和排版一直是我參考的對象，還有史上最完整的特選心得。",
  },
  {
    name: "Skychopath",
    href: "https://skyhong.tw/",
    note: "資訊工程、AI 的文章，也有其他主題的想法分享。",
  },
  {
    name: "yimang's blog",
    href: "https://yimang.tw/",
    note: "分享一些有趣的開源應用以及想法。",
  },
  {
    name: "淳の網站",
    href: "https://chuen666666.com/",
    note: "花了很大篇幅在 SITCON Camp 的心得，也有很多證照的資訊。",
  },
];

// 偷摸搭機（ともだち）：朋友們的網站
export const friendSites: FriendSite[] = [
  { name: "Wolf Yuan", href: "https://wolf-yuan.dev/" },
  { name: "OsGa", href: "https://osga.dev/" },
  { name: "Justin", href: "https://justin0711.com/" },
  { name: "伊藤倉太", href: "https://itousouta.me/about" },
  { name: "twcat", href: "https://twcat0503.org/" },
  { name: "Flashingtw's Blog", href: "https://flashing.tw/" },
  { name: "Robin's blog", href: "https://robin.nycu.cc/" },
  { name: "魔閻", href: "https://moyan-5hx.pages.dev/zh" },
  { name: "Eric's Blog", href: "https://blog.ichika.tw/" },
  { name: "Frank", href: "https://frk.tw/" },
];
