"use client";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { useReadingList, updateReadingList } from "../lib/reading-store";
export default function SaveForLater({ id }: { id: string }) {
  const { entries, ready } = useReadingList();
  const saved = entries.some((entry) => entry.id === id);
  const [message, setMessage] = useState("");
  const Icon = saved ? BookmarkCheck : Bookmark;
  return (
    <div className="max-w-full text-sm" data-print-hide>
      <button
        type="button"
        disabled={!ready}
        aria-pressed={saved}
        onClick={() =>
          setMessage(
            updateReadingList({ type: "toggle", id }).message ||
              (saved ? "已從清單移除" : "已加入稍後閱讀"),
          )
        }
        className="article-action-button"
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
        {saved ? "已加入清單" : "稍後閱讀"}
      </button>
      <p
        role="status"
        className={
          message ? "mt-1 text-xs text-[rgb(var(--muted))]" : "sr-only"
        }
      >
        {message}
      </p>
    </div>
  );
}
