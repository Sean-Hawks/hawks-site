export const timelineCategories = [
  "年會",
  "營隊",
  "社團",
  "專案",
  "競賽",
  "音樂比賽",
  "音樂發表",
  "學習",
] as const;

export type TimelineCategory = (typeof timelineCategories)[number];

export type ResumeItem = {
  period: string;
  dateTime?: string;
  categories: TimelineCategory[];
  title: string;
  organization?: string;
  summary: string;
  tags: string[];
  links?: {
    label: string;
    href: string;
    external?: boolean;
  }[];
};

export function sortResumeItemsByDate(items: ResumeItem[]) {
  return [...items].sort((a, b) =>
    (b.dateTime ?? "").localeCompare(a.dateTime ?? "")
  );
}

const external = (label: string, href: string) => ({
  label,
  href,
  external: true,
});

export const resumeItems: ResumeItem[] = [
  {
    period: "2026.08.03 卸任",
    dateTime: "2026-08-03",
    categories: ["社團"],
    title: "大安高工資訊安全研究社｜社長",
    summary:
      "任內將資安課程、實作與社群活動整理成可以累積的學習紀錄；現已卸任。",
    tags: ["Cybersecurity", "Community"],
  },
  {
    period: "2026.08.03 卸任",
    dateTime: "2026-08-03",
    categories: ["社團"],
    title: "大安高工電腦研究社｜公關",
    summary:
      "曾任電腦研究社公關，參與社團宣傳、活動籌備與社群交流；現已卸任。",
    tags: ["Computer Science", "Public Relations", "Community"],
  },
  {
    period: "2026.07.14 卸任",
    dateTime: "2026-07-14",
    categories: ["社團", "音樂發表"],
    title: "大安高工管樂團｜學生指揮",
    summary:
      "曾任管樂團學生指揮，從排練與演奏中練習溝通、聆聽，以及讓一群人一起完成一件事；現已卸任。",
    tags: ["Music", "Conducting", "Teamwork"],
  },
  {
    period: "2026.08.21 — 22",
    dateTime: "2026-08-21",
    categories: ["年會"],
    title: "HITCON 2026｜議程助理",
    organization: "台灣駭客年會（Hacks In Taiwan Conference）",
    summary:
      "以議程助理身分參與 HITCON 2026，協助講者與議程現場運作。",
    tags: ["Security", "Conference", "Volunteer"],
    links: [external("官方網站", "https://hitcon.org/2026/en-US/cfp/")],
  },
  {
    period: "2026.08.04 — 06",
    dateTime: "2026-08-04",
    categories: ["競賽"],
    title: "第五屆國網盃應用程式效能優化競賽",
    organization: "佳作・NVIDIA 特別獎・未來之星獎",
    summary:
      "參與 HiPAC 2026，在國網中心舉辦的應用程式效能優化競賽獲得三項獎項。",
    tags: ["HPC", "Optimization", "NVIDIA"],
    links: [
      external("競賽官網", "https://event1.nchc.org.tw/2026/hipac/"),
      external("獎項說明", "https://event1.nchc.org.tw/2026/hipac/awards.html"),
    ],
  },
  {
    period: "2026.07.20 — 26",
    dateTime: "2026-07-20",
    categories: ["營隊"],
    title: "AIS3 2026 新型態資安實務暑期課程",
    organization: "Advanced Information Security Summer School",
    summary:
      "課程接觸暗網情資、Android 逆向、Web Security 與 AI Agent，並以 LLM 資安能力評測作為專題方向。",
    tags: ["Cybersecurity", "LLM", "CTF"],
    links: [
      { label: "課程心得", href: "/blog/ais3" },
      external("課程官網", "https://ais3.org/"),
    ],
  },
  {
    period: "2026.07.14",
    dateTime: "2026-07-14",
    categories: ["音樂發表"],
    title: "大安管樂年度成果發表會",
    organization: "大安高工管樂團",
    summary: "參與管樂團年度成果發表，完成高中階段重要的一場舞台演出。",
    tags: ["Wind Band", "Concert", "Performance"],
  },
  {
    period: "2026.07",
    dateTime: "2026-07",
    categories: ["營隊"],
    title: "2026 臺大資訊營｜Code Code Nut",
    organization: "國立臺灣大學資訊工程學系",
    summary: "參與臺大資訊營，從課程、實作與團隊活動認識資訊工程領域。",
    tags: ["Computer Science", "Camp", "NTU"],
    links: [external("營隊官網", "https://csiecamp.csie.org/")],
  },
  {
    period: "2026.07",
    dateTime: "2026-07",
    categories: ["營隊"],
    title: "臺大電機系計算機訓練班｜2026 暑期班",
    organization: "國立臺灣大學電機工程學系",
    summary:
      "參與以多模態生成式 AI 與 AI Agent 為主題的暑期程式設計訓練。",
    tags: ["AI Agent", "Programming", "NTU EE"],
    links: [external("課程介紹", "https://ee.ntu.edu.tw/cc")],
  },
  {
    period: "2026.07",
    dateTime: "2026-07",
    categories: ["專案"],
    title: "AIS3 LLM SecEval",
    organization: "AIS3 AI 組專題",
    summary:
      "使用 Inspect AI 與 CTF 題組評測大型語言模型的資安能力，並把資料污染納入對照設計。",
    tags: ["Inspect AI", "Python", "LLM Eval"],
    links: [
      external("GitHub", "https://github.com/Sean-Hawks/ais3-llm-seceval"),
    ],
  },
  {
    period: "2026.06",
    dateTime: "2026-06",
    categories: ["學習"],
    title: "Machine Learning 自主學習",
    organization: "李宏毅 ML 2021",
    summary:
      "以李宏毅教授的課程為主軸，從模型訓練觀念、PyTorch 到作業實作，整理高中自主學習的過程。",
    tags: ["Machine Learning", "PyTorch", "Python"],
    links: [
      { label: "學習紀錄", href: "/blog/machine-learning-2021" },
      external("GitHub", "https://github.com/Sean-Hawks/ML2021-Spring"),
    ],
  },
  {
    period: "2026.05.16 — 18",
    dateTime: "2026-05-16",
    categories: ["競賽"],
    title: "AIS3 Pre-exam 2026｜第 12 名",
    organization: "AIS3 2026 資安實務測驗",
    summary:
      "參與 AIS3 Pre-exam 線上資安實務測驗，以第 12 名成績取得 AIS3 2026 暑期課程參加資格。",
    tags: ["CTF", "Cybersecurity", "Pre-exam #12"],
    links: [external("AIS3 2026", "https://ais3.org/")],
  },
  {
    period: "2026",
    dateTime: "2026",
    categories: ["競賽", "營隊"],
    title: "資訊之芽 2026 團體賽",
    organization: "資訊之芽（Sprout）",
    summary: "參與算法班團體賽，和隊友在限時情境中拆題、實作並協作解題。",
    tags: ["Algorithms", "Team Contest", "C++"],
    links: [external("資訊之芽 2026", "https://sprout.tw/")],
  },
  {
    period: "2026.03.28",
    dateTime: "2026-03-28",
    categories: ["年會"],
    title: "SITCON 學生計算機年會 2026｜會眾",
    organization: "Students’ Information Technology Conference",
    summary:
      "第二次以會眾身分參加 SITCON，在中研院聽自我紀錄、工控安全等議程，也留下自己的現場筆記。",
    tags: ["Conference", "Cybersecurity", "Community"],
    links: [external("官方網站", "https://sitcon.org/2026/")],
  },
  {
    period: "2025.12 — Now",
    dateTime: "2025-12",
    categories: ["專案"],
    title: "hawks.tw",
    organization: "Personal Website",
    summary:
      "用 Next.js 建立自己的網站，把文章、演講、收藏與專案整理成一個可以長期維護的數位基地。",
    tags: ["Next.js", "React", "TypeScript"],
    links: [
      { label: "關於這個 Blog", href: "/blog/first-web" },
      external("GitHub", "https://github.com/Sean-Hawks/hawks-site"),
    ],
  },
  {
    period: "2025.12",
    dateTime: "2025-12",
    categories: ["競賽", "專案"],
    title: "Gift Guru",
    organization: "郁秀杯提案競賽",
    summary:
      "負責提案專題的全端開發，用網頁產品整理送禮情境、需求與推薦流程。",
    tags: ["TypeScript", "React", "Product"],
    links: [external("GitHub", "https://github.com/Sean-Hawks/gift-guru")],
  },
  {
    period: "2025.11.22",
    dateTime: "2025-11-22",
    categories: ["競賽"],
    title: "HPE CodeWars 2025 挑戰賽",
    organization: "Hewlett Packard Enterprise",
    summary: "以三人團隊參與高中職組程式競賽，在限時題目中協作解題。",
    tags: ["Programming Contest", "Teamwork", "Algorithms"],
    links: [
      external(
        "競賽資訊",
        "https://www.yphs.tp.edu.tw/news/hpe-codewars-2025-%E6%8C%91%E6%88%B0%E8%B3%BD/"
      ),
    ],
  },
  {
    period: "2025.10.22",
    dateTime: "2025-10-22",
    categories: ["音樂比賽"],
    title: "臺北市 114 學年度學生音樂比賽｜管樂合奏優等",
    organization: "大安高工・高中職團體 B 組・南區",
    summary:
      "參與大安高工管樂團，在南區高中職團體 B 組管樂合奏獲優等（87.52 分）。",
    tags: ["Wind Band", "優等", "Competition"],
    links: [
      external(
        "官方成績查詢",
        "https://www.tpcityart.tp.edu.tw/Home/RecordData?RecordType=1"
      ),
    ],
  },
  {
    period: "2025.08.15 — 16",
    dateTime: "2025-08-15",
    categories: ["年會"],
    title: "HITCON 2025｜會眾",
    organization: "台灣駭客年會（Hacks In Taiwan Conference）",
    summary: "以會眾身分參與台灣駭客年會，接觸資安研究、攻防與社群議程。",
    tags: ["Security", "Conference", "Community"],
    links: [external("官方網站", "https://www.hitcon.org/2025/")],
  },
  {
    period: "2025.08",
    dateTime: "2025-08",
    categories: ["營隊"],
    title: "第 25 屆國立政治大學管樂營",
    organization: "國立政治大學管樂團",
    summary: "參與政大管樂營，在密集排練、分部課與合奏中累積演奏經驗。",
    tags: ["Wind Band", "Music Camp", "NCCU"],
    links: [external("營隊資訊", "https://linktr.ee/nccuwindcamp")],
  },
  {
    period: "2025.08.09 — 10",
    dateTime: "2025-08-09",
    categories: ["年會"],
    title: "COSCUP × RubyConf Taiwan 2025｜會眾",
    organization: "開源人年會",
    summary: "以會眾身分參與開源社群年會，接觸軟體、社群與開源文化議程。",
    tags: ["Open Source", "Conference", "Community"],
    links: [external("官方網站", "https://coscup.org/2025/")],
  },
  {
    period: "2025.07",
    dateTime: "2025-07",
    categories: ["營隊"],
    title: "2025 IONC 清大暑期程式競賽集訓營",
    organization: "IONCamp・國立清華大學",
    summary: "參與程式競賽集訓，集中練習演算法、資料結構與競賽解題。",
    tags: ["Competitive Programming", "Algorithms", "NTHU"],
    links: [external("營隊官網", "https://ionc.nthu.dev/")],
  },
  {
    period: "2025.07.21 — 25",
    dateTime: "2025-07-21",
    categories: ["營隊"],
    title: "2025 HPC × AI 夏令營",
    organization: "國家高速網路與計算中心 × 國立清華大學",
    summary: "在清大參與高效能運算與人工智慧課程，接觸超級電腦與平行運算應用。",
    tags: ["HPC", "AI", "Supercomputing"],
    links: [
      external(
        "活動資訊",
        "https://www.nchc.org.tw/Active/ActiveView/765?mid=47&page=1"
      ),
    ],
  },
  {
    period: "2025.03.08",
    dateTime: "2025-03-08",
    categories: ["年會"],
    title: "SITCON 學生計算機年會 2025｜編輯組",
    organization: "Students’ Information Technology Conference",
    summary: "加入年會籌備團隊編輯組，參與會前內容與現場工作的協作。",
    tags: ["Conference", "Editorial", "Volunteer"],
    links: [external("官方網站", "https://sitcon.org/2025/")],
  },
  {
    period: "2025",
    dateTime: "2025",
    categories: ["營隊", "學習"],
    title: "資訊之芽 2025 算法班｜結業",
    organization: "資訊之芽（Sprout）",
    summary:
      "完成算法班課程，透過 C++ 題目練習演算法與資料結構，留下課程實作與解題紀錄。",
    tags: ["C++", "Algorithms", "Data Structures"],
    links: [
      external("課程網站", "https://sprout.tw/algo2025/"),
      external("GitHub", "https://github.com/Sean-Hawks/sprout2025-algo"),
    ],
  },
  {
    period: "2024.12.20",
    dateTime: "2024-12-20",
    categories: ["音樂發表"],
    title: "Immortal｜大安 × 金甌 × 華江聯合音樂會",
    organization: "大安高工、金甌女中、華江高中管樂團",
    summary: "參與三校管樂團聯合音樂會，在跨校排練與演出中完成舞台合作。",
    tags: ["Wind Band", "Concert", "Collaboration"],
  },
  {
    period: "2024.10.28",
    dateTime: "2024-10-28",
    categories: ["音樂比賽"],
    title: "臺北市 113 學年度學生音樂比賽｜管樂合奏優等",
    organization: "大安高工・高中職團體 B 組・南區",
    summary:
      "參與大安高工管樂團，在南區高中職團體 B 組管樂合奏獲優等（87.40 分）。",
    tags: ["Wind Band", "優等", "Competition"],
    links: [
      external(
        "官方成績查詢",
        "https://www.tpcityart.tp.edu.tw/Home/RecordData?RecordType=1"
      ),
    ],
  },
  {
    period: "2024.08.03 — 04",
    dateTime: "2024-08-03",
    categories: ["年會"],
    title: "COSCUP 2024｜會眾",
    organization: "Conference for Open Source Coders, Users and Promoters",
    summary: "第一次以會眾身分參與 COSCUP，認識臺灣開源社群與不同技術議題。",
    tags: ["Open Source", "Conference", "Community"],
    links: [external("官方網站", "https://coscup.org/2024/")],
  },
  {
    period: "2024.03.09",
    dateTime: "2024-03-09",
    categories: ["年會"],
    title: "SITCON 學生計算機年會 2024｜會眾",
    organization: "Students’ Information Technology Conference",
    summary: "第一次以會眾身分參與 SITCON，開始接觸學生資訊社群與年會文化。",
    tags: ["Conference", "Technology", "Community"],
    links: [external("官方網站", "https://sitcon.org/2024/")],
  },
  {
    period: "2023.03",
    dateTime: "2023-03",
    categories: ["音樂比賽"],
    title: "111 學年度全國學生音樂比賽｜管樂合奏優等",
    organization: "南山高中・高中職團體 B 組・北區決賽",
    summary:
      "參與南山高中管樂團，在全國學生音樂比賽北區決賽獲管樂合奏優等。",
    tags: ["Wind Band", "優等", "National Competition"],
    links: [
      external(
        "南山中學公告",
        "https://www.nssh.ntpc.edu.tw/p/406-1000-11342%2Cr14.php"
      ),
      external(
        "全國成績查詢",
        "https://web.arte.gov.tw/point/index.asp?Action=View&GRPNO=HB0411&AREA=%E5%8C%97%E5%8D%80&sYear=111&SelectMenu=1&RaceNo=2"
      ),
    ],
  },
  {
    period: "111 學年度",
    dateTime: "2022",
    categories: ["音樂比賽"],
    title: "新北市學生音樂比賽｜管樂合奏、打擊樂合奏優等",
    organization: "南山高中管樂團",
    summary:
      "校方紀錄為高中組管樂合奏優等，以及國中組、高中組打擊樂合奏優等；其中管樂合奏晉級全國賽。",
    tags: ["Wind Band", "Percussion", "優等"],
    links: [
      external(
        "南山中學公告",
        "https://www.nssh.ntpc.edu.tw/p/406-1000-10433%2Cr14.php"
      ),
    ],
  },
];
