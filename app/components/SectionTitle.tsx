"use client";

import React from "react";

export default function SectionTitle({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[rgb(var(--muted))]">
      {icon}
      <span className="uppercase">{title}</span>
    </div>
  );
}
