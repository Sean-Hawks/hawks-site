/* eslint-disable react/no-unescaped-entities */
"use client";

import React from "react";
import Chip from "./Chip";

export default function ReadmeSection() {
  return (
    <>
      <div className="text-[rgb(var(--muted))] text-sm mb-2">{`>_ $ whoami`}</div>
      <h1 className="text-2xl font-bold">
        Oh Hi, I'm <span className="text-[rgb(var(--purple))]">Hawks</span> :D 👋
      </h1>
      <p className="mt-2 text-[rgb(var(--muted))] leading-relaxed">
        歡迎來到 Hawks 的個人網站，既然都來到了這裡，代表你對我有興趣對吧
      </p>

      <div className="mt-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">What am I doing currently</span>
        </div>

        <div className="mt-3 grid gap-3">
          {[
            { icon: "📌", text: "準備統測" },
            { icon: "📌", text: "似乎忙著管樂團與大安電資社團" },
            { icon: "📌", text: "白天請敲 Instagram，晚上請敲 Discord" },
            { icon: "📌", text: "從某天開始只寫自己有興趣的 code" },
          ].map((x, i) => (
            <div key={i} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{x.icon}</span>
                <span className="text-[rgb(var(--text))]">{x.text}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Chip>Algorithm</Chip>
          <Chip>Arch Linux</Chip>
          <Chip>Music</Chip>
          <Chip>Yes, I'm Vibe Coding</Chip>
        </div>
      </div>
    </>
  );
}
