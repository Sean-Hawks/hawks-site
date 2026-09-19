"use client";
import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { useReadingList, updateReadingList } from "../lib/reading-store";
export default function SaveForLater({ id }: { id: string }) {
  const { entries, ready } = useReadingList();
  const saved = entries.some(entry => entry.id === id);
  const [message, setMessage] = useState("");
  const Icon = saved ? BookmarkCheck : Bookmark;
  return <div className="mt-4 text-sm" data-print-hide>
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={!ready} aria-pressed={saved} onClick={() => setMessage(updateReadingList({type:"toggle",id}).message || (saved ? "已從清單移除" : "已加入稍後閱讀"))} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgb(var(--accent)/0.25)] bg-[rgb(var(--accent)/0.07)] px-3 font-medium text-[rgb(var(--accent))]"><Icon className="h-4 w-4"/>{saved ? "已加入清單" : "稍後閱讀"}</button>
      <Link href="/saved/" className="inline-flex min-h-11 items-center text-xs text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]">檢視清單</Link>
    </div>
    <p role="status" className={message ? "mt-1 text-xs text-[rgb(var(--muted))]" : "sr-only"}>{message}</p>
  </div>;
}
