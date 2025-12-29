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
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs",
        "border",
        tone === "accent"
          ? "border-[rgba(255,255,255,0.12)] bg-[rgba(167,139,250,0.14)] text-[rgb(var(--text))]"
          : "border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] text-[rgb(var(--muted))]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
