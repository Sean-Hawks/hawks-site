"use client";

import React from "react";
import Link from "next/link";
import { FileText, MessageCircle } from "lucide-react";
import Chip from "./Chip";
import { Post, Talk } from "../types";

interface PostsAsideProps {
  posts: Post[];
  talks: Talk[];
}

export default function PostsAside({ posts, talks }: PostsAsideProps) {
  // 合併文章與演講，並依日期排序
  const items = [
    ...posts.map((p) => ({
      ...p,
      type: "post",
      url: `/blog/${p.slug}`,
      icon: FileText,
    })),
    ...talks.map((t) => ({
      ...t,
      type: "talk",
      url: `/talk#${t.id}`,
      icon: MessageCircle,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6); // 只顯示最新的 6 筆

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
        Latest Updates
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <Link
            key={item.type + item.title}
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

            {/* 如果是 Post 顯示描述，如果是 Talk 顯示 Event */}
            <p className="mt-1 text-xs text-[rgb(var(--muted))] line-clamp-1 opacity-60">
              {item.type === "post"
                ? (item as Post).desc
                : (item as Talk).event || "隨筆"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
