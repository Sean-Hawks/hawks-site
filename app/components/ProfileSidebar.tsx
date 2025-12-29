"use client";

import React from "react";
import Image from "next/image";
import { BadgeCheck, Dot, Github, Mail, Pin, Sparkles } from "lucide-react";
import Chip from "./Chip";
import SectionTitle from "./SectionTitle";
import { RoleTag } from "../types";

const AVATAR_SRC = "/avatar.jpg";
const BANNER_SRC = "/banner.jpg";
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export default function ProfileSidebar({ roles }: { roles: RoleTag[] }) {
  const [avatarError, setAvatarError] = React.useState(false);
  const [bannerError, setBannerError] = React.useState(false);

  return (
    <>
      {/* Banner */}
      <div className="relative h-28 bg-[rgb(var(--panel2))] overflow-hidden">
        <Image
          src={bannerError ? TRANSPARENT_PIXEL : BANNER_SRC}
          alt="Banner"
          fill
          className="object-cover"
          priority
          onError={() => setBannerError(true)}
        />
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-[rgba(167,139,250,0.7)]" />
          <div className="absolute left-10 top-10 h-1.5 w-1.5 rounded-full bg-[rgba(251,191,36,0.7)]" />
          <div className="absolute right-6 top-7 h-2 w-2 rounded-full bg-[rgba(255,255,255,0.25)]" />
        </div>
      </div>

      <div className="px-4 pb-4">
        {/* Avatar */}
        <div className="-mt-10 flex items-end justify-between">
          <div className="relative">
            <div className="relative h-20 w-20 rounded-2xl border-4 border-[rgb(var(--panel))] bg-[rgba(255,255,255,0.06)] overflow-hidden">
              <Image
                src={avatarError ? TRANSPARENT_PIXEL : AVATAR_SRC}
                alt="Avatar"
                fill
                className="object-cover"
                onError={() => setAvatarError(true)}
              />
            </div>

            {/* Online dot */}
            <div className="absolute -right-1 -bottom-1 h-5 w-5 rounded-full border-4 border-[rgb(var(--panel))] bg-[rgb(var(--accent))]" />
          </div>
        </div>

        {/* Name / status */}
        <div className="mt-3">
          <div className="text-lg font-bold leading-tight flex items-center gap-2">
            <span className="text-[rgb(var(--purple))]"></span>
            <span>Hawks</span>
            <Chip tone="accent">⚡ DAAN</Chip>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <span className="opacity-90">1awks</span>
            <span className="opacity-40">•</span>
            <span>A normal human, nothing else...</span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <Sparkles className="h-4 w-4" />
            <span>正在玩 FINAL FANTASY XIV</span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <SectionTitle icon={<BadgeCheck className="h-4 w-4" />} title="關於我" />
            <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.10)] p-3 text-sm leading-relaxed text-[rgb(var(--muted))]">
               我可能正在思考人生，又或許只是想找點事做。
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle icon={<Pin className="h-4 w-4" />} title="身分組" />
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <span
                  key={r.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-3 py-1.5 text-xs"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-[rgb(var(--text))]">{r.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle title="聯絡方式" />
            <div className="grid gap-2">
              <a
                href="#"
                className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-[rgb(var(--muted))] hover:bg-[rgba(255,255,255,0.07)]"
              >
                <Github className="h-4 w-4" />
                @Sean-Hawks
              </a>
              <a
                href="#"
                className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-[rgb(var(--muted))] hover:bg-[rgba(255,255,255,0.07)]"
              >
                <Mail className="h-4 w-4" />
                me@hawks.tw
              </a>
            </div>
          </div>

          <div className="space-y-2">
            <SectionTitle title="成為成員時間" />
            <div className="flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--muted))]">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2">
                <Dot className="h-5 w-5 text-[rgba(255,255,255,0.40)]" />
                2008/03/21
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
