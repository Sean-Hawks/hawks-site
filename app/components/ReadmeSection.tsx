"use client";

import Link from "next/link";
import { ArrowRight, BookOpenText, FileText, NotebookText, Radio } from "lucide-react";
import Chip from "./Chip";

type ActivityItem = {
  key: string;
  label: string;
  title: string;
  desc: string;
  date: string;
  tags: string[];
  href: string;
};

const activityIcons = {
  Post: FileText,
  Talk: NotebookText,
  Library: BookOpenText,
};

export default function ReadmeSection({
  activityItems,
}: {
  activityItems: ActivityItem[];
}) {
  return (
    <div className="grid gap-6">
      <section className="max-w-3xl">
        <div className="mb-2 text-sm text-[rgb(var(--muted))]">{`>_ $ whoami`}</div>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Oh Hi, I&apos;m <span className="text-[rgb(var(--purple))]">Hawks</span> :D 👋
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
          學生、管樂人、半個寫 code 的人。這個網站現在最想做好的事，是把我喜歡的作品、
          正在學的技術，和一些生活筆記整理成可以慢慢逛的地方。
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Chip>Library</Chip>
          <Chip>Machine Learning</Chip>
          <Chip>Music</Chip>
          <Chip>ACGM</Chip>
          <Chip>Web</Chip>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.12)] px-4 py-2 text-sm font-bold text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.17)]"
          >
            進入 Library
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-4 py-2 text-sm font-medium text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.24)] hover:text-[rgb(var(--text))]"
          >
            讀一些筆記
          </Link>
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

        <div className="relative space-y-3 before:absolute before:left-[0.45rem] before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-[rgb(var(--accent)/0.22)]">
          {activityItems.map((item) => {
          const Icon =
            activityIcons[item.label as keyof typeof activityIcons] ?? FileText;
          const visibleTags = item.tags.slice(0, 3);
          const hiddenTagCount = Math.max(0, item.tags.length - visibleTags.length);

          return (
            <Link
              key={item.key}
              href={item.href}
              className="group relative grid grid-cols-[1.1rem_minmax(0,1fr)] gap-3 rounded-xl px-1 py-2 transition-colors hover:bg-[rgb(var(--accent)/0.035)]"
            >
              <div className="relative z-10 mt-4 grid h-4 w-4 place-items-center rounded-full border border-[rgb(var(--accent)/0.34)] bg-[rgb(var(--panel))] shadow-[0_0_0_5px_rgb(var(--accent)/0.06)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--accent))]" />
              </div>

              <div className="rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel2)/0.34)] p-4 shadow-[0_12px_36px_rgba(90,76,55,0.08)] transition-colors group-hover:border-[rgb(var(--accent)/0.28)] group-hover:bg-[rgb(var(--panel2)/0.50)]">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-[rgb(var(--muted))]">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[rgb(var(--accent)/0.18)] bg-[rgb(var(--accent)/0.08)] px-2 py-1 font-bold text-[rgb(var(--accent))]">
                    <Icon className="h-3 w-3" />
                    {item.label}
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
