"use client";

import React from "react";
import Link from "next/link";
import { FileText, NotebookText } from "lucide-react";
import { Post, Talk } from "../types";

interface PostsAsideProps {
  posts: Post[];
  talks: Talk[];
}

export default function PostsAside({ posts, talks }: PostsAsideProps) {
  const items = [
    ...posts.map((p) => ({
      ...p,
      type: "post" as const,
      // Use slug for posts to ensure uniqueness
      key: `post-${p.slug}`,
      url: `/blog/${p.slug}`,
      icon: FileText,
    })),
    ...talks.map((t) => ({
      ...t,
      type: "talk" as const,
      // Use id for talks to ensure uniqueness
      key: `talk-${t.id}`,
      url: `/talk/${t.id}`,
      icon: NotebookText,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
          Latest Updates
        </h3>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Link
            // Use the unique key generated above
            key={item.key}
            href={item.url}
            className="group block rounded-lg p-2 -mx-2 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
          >
            <div className="mb-1.5 flex items-center gap-2 text-[10px] text-[rgb(var(--muted))] opacity-80">
              <item.icon className="h-3 w-3" />
              <span>{item.date}</span>
              <span className="px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[9px] uppercase">
                {item.type}
              </span>
            </div>

            <h3 className="text-sm font-medium text-[rgb(var(--text))] group-hover:text-[rgb(var(--accent))] transition-colors line-clamp-2">
              {item.title}
            </h3>

            {/* 修改：移除 item.type === 'post' 的判斷，讓 talk 也能顯示 desc (內容擷取) */}
            <p className="mt-1 text-xs text-[rgb(var(--muted))] line-clamp-1 opacity-60">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
