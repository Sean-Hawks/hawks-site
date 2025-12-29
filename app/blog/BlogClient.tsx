"use client";

import React from "react";
import Link from "next/link";
import { Post } from "../types";
import Header from "../components/Header";
import ThemeStyles from "../components/ThemeStyles";

export default function BlogClient({ posts }: { posts: Post[] }) {
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const allTags = Array.from(new Set(posts.flatMap(p => p.tags))).sort();
  const filteredPosts = selectedTag
    ? posts.filter(p => p.tags.includes(selectedTag))
    : posts;

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--text))]">
      <ThemeStyles />
      <Header />

      <div className="w-full px-4 sm:px-3">
        <main className="max-w-4xl mx-auto py-5">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Blog</h1>
            <p className="mt-2 text-[rgb(var(--muted))]">所有的文章與想法。</p>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedTag === null
                  ? "bg-[rgba(251,191,36,0.20)] text-[rgb(var(--text))] border border-[rgba(251,191,36,0.30)]"
                  : "bg-[rgba(255,255,255,0.06)] text-[rgb(var(--muted))] hover:bg-[rgba(255,255,255,0.12)]"
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedTag === tag
                    ? "bg-[rgba(251,191,36,0.20)] text-[rgb(var(--text))] border border-[rgba(251,191,36,0.30)]"
                    : "bg-[rgba(255,255,255,0.06)] text-[rgb(var(--muted))] hover:bg-[rgba(255,255,255,0.12)]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredPosts.map(post => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block p-4 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgb(var(--panel))] hover:bg-[rgb(var(--panel2))] transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-[rgb(var(--text))]">
                      {post.title}
                    </h2>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                      {post.desc}
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {post.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded bg-[rgba(255,255,255,0.06)] text-[rgb(var(--muted))]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <time className="text-xs text-[rgb(var(--muted))] flex-shrink-0 mt-0.5">
                    {post.date}
                  </time>
                </div>
              </Link>
            ))}
          </div>
        </main>
        <footer className="mx-auto max-w-4xl px-4 pb-10 pt-8 text-xs text-[rgb(var(--muted))]">
          <div className="opacity-70">© {new Date().getFullYear()} Hawks • made to feel like a profile, not a resume.</div>
        </footer>
      </div>
    </div>
  );
}
