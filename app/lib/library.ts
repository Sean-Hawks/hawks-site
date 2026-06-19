import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  libraryCategories,
  type LibraryCategory,
  type LibraryImage,
  type LibraryItem,
  type LibraryRecommendation,
  type LibraryRecommendedWork,
  type LibraryStatus,
} from "../data/library";

const libraryDirectory = path.join(process.cwd(), "content/library");

function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "library-item";
}

function isPublicStatus(value: unknown) {
  if (typeof value !== "string") return true;
  const status = value.trim().toLowerCase();
  return status !== "draft" && status !== "private";
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function formatDate(value: unknown) {
  if (!value) return "";

  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }

  const str = String(value);
  if (str.includes("GMT") || str.match(/^[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d{2}\s\d{4}/)) {
    const date = new Date(str);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
  }

  return str;
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
}

function normalizeRecommendations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): LibraryRecommendedWork | null => {
      if (typeof item === "string") {
        const title = item.trim();
        return title ? { title } : null;
      }

      if (item && typeof item === "object" && "title" in item) {
        const work = item as Record<string, unknown>;
        const title = normalizeString(work.title).trim();
        if (!title) return null;

        return {
          title,
          image: normalizeString(work.image) || undefined,
          link: normalizeString(work.link) || undefined,
          source: normalizeString(work.source) || undefined,
          note: normalizeString(work.note) || undefined,
        };
      }
      return null;
    })
    .filter((item): item is LibraryRecommendedWork => Boolean(item));
}

function getYouTubeVideoId(link?: string) {
  if (!link) return "";

  try {
    const url = new URL(link);
    if (url.hostname === "youtu.be") {
      return url.pathname.replace(/^\//, "");
    }
    if (url.hostname.endsWith("youtube.com")) {
      return url.searchParams.get("v") ?? "";
    }
  } catch {
    return "";
  }

  return "";
}

function withFallbackRecommendationImage(work: LibraryRecommendedWork) {
  if (work.image) return work;

  const videoId = getYouTubeVideoId(work.link);
  if (!videoId) return work;

  return {
    ...work,
    image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

function splitRecommendationSection(content: string) {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex((line) =>
    /^##\s+(推薦作品|Recommended Works|Recommendations)\s*$/i.test(line.trim())
  );

  if (startIndex < 0) {
    return { body: content, recommendationBlock: "" };
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index].trim())) {
      endIndex = index;
      break;
    }
  }

  const body = [
    ...lines.slice(0, startIndex),
    ...lines.slice(endIndex),
  ].join("\n").trim();
  const recommendationBlock = lines.slice(startIndex + 1, endIndex).join("\n");

  return { body, recommendationBlock };
}

function parseInlineRecommendation(line: string): LibraryRecommendedWork | null {
  const value = line.replace(/^[-*]\s+/, "").trim();
  if (!value) return null;

  const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)(.*)$/.exec(value);
  if (linkMatch) {
    const [, title, link, rest] = linkMatch;
    const parts = rest
      .replace(/^\s*[—–-]\s*/, "")
      .split(/\s+[—–]\s+|\s*\|\s*/)
      .map((part) => part.trim())
      .filter(Boolean);
    const image = parts.find((part) => part.startsWith("/images/"));
    const textParts = parts.filter((part) => part !== image);

    return {
      title: title.trim(),
      link: link.trim(),
      source: textParts[0],
      note: textParts[1],
      image,
    };
  }

  const parts = value
    .split(/\s+[—–]\s+|\s*\|\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  const [title, source, linkOrNote, maybeNote] = parts;
  if (!title) return null;

  const image = parts.find((part) => part.startsWith("/images/"));
  const link =
    linkOrNote && /^https?:\/\//.test(linkOrNote) ? linkOrNote : undefined;
  const noteCandidate = link ? maybeNote : linkOrNote;
  const note = noteCandidate === image ? undefined : noteCandidate;

  return {
    title,
    source,
    link,
    note,
    image,
  };
}

function parseMarkdownRecommendations(content: string) {
  const { body, recommendationBlock } = splitRecommendationSection(content);
  const recommendations = recommendationBlock
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map(parseInlineRecommendation)
    .filter((item): item is LibraryRecommendedWork => Boolean(item));

  return { body, recommendations };
}

function normalizeRating(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === "n/a" || normalized === "na") {
      return null;
    }
  }

  const rating = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(rating)) return null;
  return Math.max(0, Math.min(10, rating));
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "yes", "1"].includes(value.trim().toLowerCase());
  }
  return false;
}

function normalizeFeaturedOrder(value: unknown) {
  const order = typeof value === "number" ? value : Number(value);
  return Number.isFinite(order) ? order : undefined;
}

function ratingValue(rating: number | null) {
  return rating ?? -1;
}

function normalizeImage(value: unknown, title: string): LibraryImage {
  if (!value || typeof value !== "object") {
    return {
      src: "",
      alt: `${title} cover`,
      credit: "",
      source: "",
    };
  }

  const image = value as Record<string, unknown>;

  return {
    src: normalizeString(image.src),
    alt: normalizeString(image.alt, `${title} cover`),
    credit: normalizeString(image.credit),
    source: normalizeString(image.source),
    fit: normalizeString(image.fit) === "contain" ? "contain" : "cover",
  };
}

function normalizeCategory(value: unknown): LibraryCategory {
  const category = normalizeString(value);
  if (category === "music" || category === "artist") {
    return "artist";
  }
  if (category === "movie" || category === "game") {
    return category;
  }
  return "anime";
}

function normalizeStatus(value: unknown): LibraryStatus {
  const status = normalizeString(value);
  if (
    status === "listened" ||
    status === "watching" ||
    status === "playing" ||
    status === "played" ||
    status === "planned" ||
    status === "recommended"
  ) {
    return status;
  }
  return "watched";
}

function recommendationFromRating(rating: number | null): LibraryRecommendation {
  if (rating === null) return "casual";
  if (rating >= 9.5) return "brilliant";
  if (rating >= 9.0) return "favorite";
  if (rating >= 8.5) return "recommended";
  return "casual";
}

function readLibraryItem(fileName: string): LibraryItem {
  const sourceFile = fileName;
  const fileSlug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(libraryDirectory, fileName);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const parsedContent = parseMarkdownRecommendations(content);
  const title = normalizeString(data.title, fileSlug);
  const explicitSlug = normalizeString(data.slug);
  const slug = slugify(explicitSlug || fileSlug);
  const rating = normalizeRating(data.rating);
  const hasReview = parsedContent.body.trim().length > 0;
  const frontmatterRecommendations = normalizeRecommendations(data.recommendations);
  const recommendedWorks =
    parsedContent.recommendations.length > 0
      ? parsedContent.recommendations
      : frontmatterRecommendations;
  const recommendedWorksWithImages = recommendedWorks.map(withFallbackRecommendationImage);

  return {
    id: slug,
    slug,
    sourceFile,
    title,
    subtitle: normalizeString(data.subtitle) || undefined,
    category: normalizeCategory(data.category),
    year: normalizeString(data.year) || undefined,
    date: formatDate(data.date),
    status: normalizeStatus(data.status),
    recommendation: recommendationFromRating(rating),
    rating,
    featured: normalizeBoolean(data.featured),
    featuredOrder: normalizeFeaturedOrder(data.featuredOrder),
    tags: normalizeTags(data.tags),
    note: normalizeString(data.note),
    link: normalizeString(data.link) || undefined,
    recommendedWorks: recommendedWorksWithImages,
    image: normalizeImage(data.image, title),
    content: parsedContent.body,
    hasReview,
    statusVisibility: normalizeString(data.statusVisibility),
  };
}

export function getAllLibraryItems() {
  if (!fs.existsSync(libraryDirectory)) {
    return [];
  }

  return fs
    .readdirSync(libraryDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map(readLibraryItem)
    .filter((item) => isPublicStatus(item.statusVisibility))
    .sort(
      (a, b) =>
        ratingValue(b.rating) - ratingValue(a.rating) ||
        a.title.localeCompare(b.title)
    );
}

export function getLibraryItemsByCategory(category: LibraryCategory) {
  return getAllLibraryItems().filter((item) => item.category === category);
}

export function getLibraryItemBySlug(category: string, slug: string) {
  return getAllLibraryItems().find(
    (item) => item.category === category && item.slug === slug
  );
}

export function getLibraryCategory(category: string) {
  return libraryCategories.find((item) => item.id === category);
}
