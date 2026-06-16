"use client";

import React from "react";
import Chip from "./Chip";

const currentItems = [
  "準備統測，也把空檔拿去碰 Machine Learning、Web 和音樂。",
  "管樂團與大安電資社團出沒中，偶爾會把社課、筆記和想法整理起來。",
  "白天請敲 Instagram，晚上請敲 Discord。",
  "從某天開始，只寫自己真的有興趣的 code。",
];

export default function ReadmeSection() {
  return (
    <>
      <div className="mb-2 text-sm text-[rgb(var(--muted))]">{`>_ $ whoami`}</div>
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        Oh Hi, I&apos;m <span className="text-[rgb(var(--purple))]">Hawks</span> :D 👋
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
        學生、管樂人、半個寫 code 的人。這裡放我正在學的東西、做過的專案、喜歡的作品，
        還有一些生活和技術筆記。
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip>Algorithm</Chip>
        <Chip>Machine Learning</Chip>
        <Chip>Arch Linux</Chip>
        <Chip>Music</Chip>
        <Chip>Personal Website</Chip>
      </div>

      <div className="mt-7">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">Currently</span>
        </div>

        <div className="mt-3 grid gap-3">
          {currentItems.map((text) => (
            <div key={text} className="rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] px-4 py-3">
              <div className="flex gap-3">
                <span className="text-lg leading-6">📌</span>
                <span className="leading-7 text-[rgb(var(--text))]">{text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
