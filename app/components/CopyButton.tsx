"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function fallbackCopy(value: string) {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }

  async function handleCopy() {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      // 分頁未取得焦點 / 非 HTTPS 時 clipboard 會被擋，改用 fallback
    }
    if (!ok) ok = fallbackCopy(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "已複製" : "複製程式碼"}
      className="absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-lg border border-[rgb(var(--line)/0.14)] bg-[rgb(var(--panel)/0.85)] px-2 py-1 text-xs font-medium text-[rgb(var(--muted))] opacity-0 backdrop-blur transition-all hover:border-[rgb(var(--accent)/0.4)] hover:text-[rgb(var(--accent))] focus:opacity-100 focus:outline-none group-hover:opacity-100"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "已複製" : "複製"}</span>
    </button>
  );
}
