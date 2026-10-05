"use client";

import React from "react";

export default function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      data-tone={tone}
      className="inline-flex items-center rounded-full border border-[rgb(var(--line))] px-2.5 py-1 text-xs text-[rgb(var(--muted))]"
    >
      {children}
    </span>
  );
}
