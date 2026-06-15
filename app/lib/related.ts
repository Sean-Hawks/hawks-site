import { Post, Talk } from "../types";
import { stripMarkdown } from "./content";

function toList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function keywords(value: string) {
  return stripMarkdown(value)
    .toLowerCase()
    .split(/[\s,，。:：;；!！?？/\\()[\]{}"'`~]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3)
    .slice(0, 18);
}

export function getRelatedTalksForPost(post: Post, talks: Talk[], limit = 3) {
  const manualIds = toList(post.relatedTalks);
  const manualTalks = manualIds
    .map((id) => talks.find((talk) => talk.id === id))
    .filter((talk): talk is Talk => Boolean(talk));

  const terms = [
    ...post.tags.map((tag) => tag.replace(/^#/, "")),
    ...keywords(`${post.title} ${post.desc}`),
  ].filter(Boolean);

  const autoTalks = talks
    .filter((talk) => !manualIds.includes(talk.id))
    .map((talk) => {
      const haystack = stripMarkdown(`${talk.title} ${talk.event ?? ""} ${talk.desc}`).toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
      return { talk, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.talk.date < b.talk.date ? 1 : -1))
    .map((item) => item.talk);

  return [...manualTalks, ...autoTalks].slice(0, limit);
}

export function getRelatedPostsForTalk(talk: Talk, posts: Post[], limit = 3) {
  const manualSlugs = toList(talk.relatedPosts);
  const manualPosts = manualSlugs
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is Post => Boolean(post));

  const terms = keywords(`${talk.title} ${talk.event ?? ""} ${talk.desc}`);

  const autoPosts = posts
    .filter((post) => !manualSlugs.includes(post.slug))
    .map((post) => {
      const haystack = stripMarkdown(`${post.title} ${post.desc} ${post.tags.join(" ")} ${post.content ?? ""}`).toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.post.date < b.post.date ? 1 : -1))
    .map((item) => item.post);

  return [...manualPosts, ...autoPosts].slice(0, limit);
}
