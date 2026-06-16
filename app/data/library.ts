export type LibraryCategory = "anime" | "movie" | "music" | "game";

export type LibraryStatus =
  | "watched"
  | "listened"
  | "watching"
  | "playing"
  | "played"
  | "planned"
  | "recommended";

export type LibraryRecommendation =
  | "brilliant"
  | "favorite"
  | "recommended"
  | "casual";

export type LibraryImage = {
  src: string;
  alt: string;
  credit: string;
  source: string;
  fit?: "cover" | "contain";
};

export type LibraryItem = {
  id: string;
  slug: string;
  sourceFile: string;
  title: string;
  subtitle?: string;
  category: LibraryCategory;
  year?: string;
  date: string;
  status: LibraryStatus;
  recommendation: LibraryRecommendation;
  rating: number; // Personal score from 0 to 10.
  tags: string[];
  note: string;
  link?: string;
  image: LibraryImage;
  content?: string;
  hasReview: boolean;
  statusVisibility?: string;
};

export type LibraryCategoryInfo = {
  id: LibraryCategory;
  label: string;
  title: string;
  description: string;
  href: string;
};

export const libraryCategories: LibraryCategoryInfo[] = [
  {
    id: "anime",
    label: "Anime",
    title: "動畫收藏",
    description: "看過、想補，或想再次推薦給別人的動畫。",
    href: "/library/anime",
  },
  {
    id: "movie",
    label: "Movie",
    title: "電影收藏",
    description: "留下那些畫面、音樂或情緒特別有記憶點的電影。",
    href: "/library/movie",
  },
  {
    id: "music",
    label: "Music",
    title: "音樂推薦",
    description: "適合循環播放，也能代表一段時間心情的音樂。",
    href: "/library/music",
  },
  {
    id: "game",
    label: "Game",
    title: "遊戲收藏",
    description: "玩過、想補，或值得留下一些感想的遊戲。",
    href: "/library/game",
  },
];
