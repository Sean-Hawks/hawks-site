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
          ? "border-[rgb(var(--purple)/0.24)] bg-[rgb(var(--purple)/0.11)] text-[rgb(var(--text))]"
          : "border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--muted))]",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
