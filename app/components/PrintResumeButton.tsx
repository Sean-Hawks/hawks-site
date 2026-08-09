"use client";

import { Printer } from "lucide-react";

export default function PrintResumeButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print-hidden inline-flex items-center gap-2 rounded-xl border border-[rgb(var(--accent)/0.24)] bg-[rgb(var(--accent)/0.12)] px-4 py-2 text-sm font-bold text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.18)]"
    >
      <Printer className="h-4 w-4" />
      列印 / Save as PDF
    </button>
  );
}
