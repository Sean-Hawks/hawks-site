export type LibraryCategory = "anime" | "movie" | "artist" | "game";

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

export type LibraryRecommendedWork = {
  title: string;
  image?: string;
  link?: string;
  source?: string;
  note?: string;
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
  rating: number | null; // Personal score from 0 to 10, or null when unrated.
  tags: string[];
  note: string;
  link?: string;
  recommendedWorks: LibraryRecommendedWork[];
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
    id: "artist",
    label: "Artist",
    title: "藝人收藏",
    description: "喜歡的歌手、樂團、作曲家，以及想推薦給別人的幾首作品。",
    href: "/library/artist",
  },
  {
    id: "game",
    label: "Game",
    title: "遊戲收藏",
    description: "玩過、想補，或值得留下一些感想的遊戲。",
    href: "/library/game",
  },
];
