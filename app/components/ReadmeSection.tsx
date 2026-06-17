"use client";

import React from "react";
import Link from "next/link";
import { BookOpenText, FileText, NotebookText, Radio } from "lucide-react";
import Chip from "./Chip";
import { Post, Talk } from "../types";
import type { LibraryItem } from "../data/library";

type ActivityItem = {
  key: string;
  type: "post" | "talk" | "library";
  title: string;
  desc: string;
  date: string;
  tags: string[];
  url: string;
  icon: typeof FileText;
};

interface ReadmeSectionProps {
  posts: Post[];
  talks: Talk[];
  libraryItems: LibraryItem[];
}

function plainExcerpt(value = "", length = 120) {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`~\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

export default function ReadmeSection({ posts, talks, libraryItems }: ReadmeSectionProps) {
  const activityItems: ActivityItem[] = [
    ...posts.map((post) => ({
      key: `post-${post.slug}`,
      type: "post" as const,
      title: post.title,
      desc: post.desc,
      date: post.date,
      tags: post.tags,
      url: `/blog/${post.slug}`,
      icon: FileText,
    })),
    ...talks.map((talk) => ({
      key: `talk-${talk.id}`,
      type: "talk" as const,
      title: talk.title,
      desc: talk.desc,
      date: talk.date,
      tags: [],
      url: `/talk/${talk.id}`,
      icon: NotebookText,
    })),
    ...libraryItems
      .filter((item) => item.hasReview)
      .map((item) => ({
        key: `library-${item.slug}`,
        type: "library" as const,
        title: `評論：${item.title}`,
        desc: item.note || plainExcerpt(item.content, 120),
        date: item.date,
        tags: item.tags,
        url: `/library/${item.category}/${item.slug}`,
        icon: BookOpenText,
      })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="grid gap-7">
      <section>
        <div className="mb-2 text-sm text-[rgb(var(--muted))]">{`>_ $ whoami`}</div>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Oh Hi, I&apos;m <span className="text-[rgb(var(--purple))]">Hawks</span> :D 👋
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
          學生、管樂人、半個寫 code 的人。這裡放我正在學的東西、做過的專案、喜歡的作品，
          還有一些生活和技術筆記。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip>Algorithm</Chip>
          <Chip>Machine Learning</Chip>
          <Chip>Arch Linux</Chip>
          <Chip>Music</Chip>
          <Chip>ACGM</Chip>
          <Chip>Personal Website</Chip>
        </div>
      </section>

      <section className="border-t border-[rgb(var(--line)/0.08)] pt-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--accent)/0.22)] bg-[rgb(var(--accent)/0.10)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[rgb(var(--accent))]">
              <Radio className="h-3.5 w-3.5 text-[rgb(var(--accent))]" />
              Activity
            </div>
            <p className="max-w-xl text-sm leading-7 text-[rgb(var(--muted))]">
              最近留下來的文章、評論、近況和一些不小心寫下來的碎片。
            </p>
          </div>
          <Link
            href="/now"
            className="inline-flex items-center rounded-lg border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.035)] px-3 py-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.22)] hover:text-[rgb(var(--accent))]"
          >
            View all
          </Link>
        </div>

        <div className="relative space-y-2 before:absolute before:left-[0.45rem] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-[rgb(var(--accent)/0.22)]">
          {activityItems.map((item) => {
            const Icon = item.icon;
            const visibleTags = item.tags.slice(0, 3);
            const hiddenTagCount = Math.max(0, item.tags.length - visibleTags.length);

            return (
              <Link
                key={item.key}
                href={item.url}
                className="group relative grid grid-cols-[1.1rem_minmax(0,1fr)] gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-[rgb(var(--accent)/0.035)]"
              >
                <div className="relative z-10 mt-1 grid h-4 w-4 place-items-center rounded-full border border-[rgb(var(--accent)/0.34)] bg-[rgb(var(--panel))] shadow-[0_0_0_4px_rgb(var(--accent)/0.06)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
                </div>

                <div className="rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel2)/0.34)] p-4 shadow-[0_12px_36px_rgba(90,76,55,0.08)] transition-colors group-hover:border-[rgb(var(--accent)/0.28)] group-hover:bg-[rgb(var(--panel2)/0.50)]">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[rgb(var(--muted))]">
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent)/0.08)] px-2 py-1 font-bold text-[rgb(var(--accent))]">
                      <Icon className="h-3 w-3" />
                      {item.type}
                    </span>
                    <span className="opacity-40">/</span>
                    <time>{item.date}</time>
                  </div>
                  <h3 className="line-clamp-2 text-sm font-bold leading-6 text-[rgb(var(--text))] transition-colors group-hover:text-[rgb(var(--accent))]">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[rgb(var(--muted))]">
                    {item.desc}
                  </p>
                  {item.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {visibleTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex max-w-full items-center rounded-md border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--panel)/0.42)] px-2 py-1 text-[10px] leading-none text-[rgb(var(--muted))]"
                        >
                          <span className="truncate">#{tag.replace(/^#/, "")}</span>
                        </span>
                      ))}
                      {hiddenTagCount > 0 && (
                        <span className="inline-flex items-center rounded-md border border-[rgb(var(--line)/0.08)] bg-[rgb(var(--line)/0.035)] px-2 py-1 text-[10px] leading-none text-[rgb(var(--muted))]">
                          +{hiddenTagCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
