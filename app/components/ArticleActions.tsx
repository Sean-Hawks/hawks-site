"use client";
import { useId, useRef, useState } from "react";
import { Copy, Link2, MoreHorizontal, Printer, Share2 } from "lucide-react";
import ArticleHeart from "./ArticleHeart";
import SaveForLater from "./SaveForLater";
import {
  articleCitation,
  canonicalArticleUrl,
  copyArticleText,
  shareArticle,
} from "../lib/article-actions";

export default function ArticleActions({
  id,
  title,
  path,
  date,
}: {
  id: string;
  title: string;
  path: string;
  date?: string;
}) {
  const url = canonicalArticleUrl(path);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copyId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const buttonClass = "article-action-button";
  const port = () => ({
    share: navigator.share?.bind(navigator),
    clipboard: navigator.clipboard,
  });
  function result(status: "copied" | "manual", text: string, success: string) {
    setManual(status === "manual" ? text : null);
    setMessage(
      status === "copied"
        ? success
        : "瀏覽器無法自動複製。請選取下方文字後複製。",
    );
  }
  async function copy(text: string, success: string) {
    result(await copyArticleText(text, port()), text, success);
  }
  async function share() {
    setBusy(true);
    const status = await shareArticle(title, url, port());
    setBusy(false);
    if (status === "cancelled") return;
    if (status === "shared") {
      setManual(null);
      setMessage("已開啟分享");
    } else result(status, url, "已複製分享連結");
  }
  return (
    <>
      <section
        aria-label="閱讀後操作"
        data-print-hide
        className="border-t border-[rgb(var(--line)/0.12)] px-4 py-4 sm:px-10"
      >
        <div className="flex flex-wrap items-start gap-1.5">
          <ArticleHeart id={id} />
          <SaveForLater id={id} />
          <button
            type="button"
            onClick={share}
            disabled={busy}
            className={buttonClass}
          >
            <Share2 aria-hidden="true" className="h-4 w-4" />
            分享
          </button>
          <details className="article-action-more">
            <summary className={buttonClass} aria-label="更多操作" title="更多操作">
              <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(url, "已複製文章連結")}
                className={buttonClass}
              >
                <Link2 aria-hidden="true" className="h-4 w-4" />
                複製連結
              </button>
              <button
                type="button"
                onClick={() =>
                  copy(articleCitation(title, url, date), "已複製標題、日期與來源")
                }
                className={buttonClass}
              >
                <Copy aria-hidden="true" className="h-4 w-4" />
                複製引用
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className={buttonClass}
              >
                <Printer aria-hidden="true" className="h-4 w-4" />
                列印文字版
              </button>
            </div>
            <p className="mt-2 text-xs leading-6 text-[rgb(var(--muted))]">
              文字版保留正文和來源網址，略過封面與相簿；可在列印視窗選擇另存 PDF。
            </p>
          </details>
        </div>
        <p role="status" className={message ? "mt-2 text-xs text-[rgb(var(--muted))]" : "sr-only"}>
          {message}
        </p>
        {manual !== null && (
          <div className="mt-3 text-xs font-medium">
            <label htmlFor={copyId}>手動複製</label>
            <textarea
              id={copyId}
              ref={textRef}
              readOnly
              value={manual}
              rows={3}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-1 w-full rounded-lg border border-[rgb(var(--line)/0.2)] bg-[rgb(var(--bg))] p-3 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                textRef.current?.focus();
                textRef.current?.select();
              }}
              className="mt-1 min-h-11 underline"
            >
              選取全部文字
            </button>
          </div>
        )}
      </section>
      <p className="article-print-source">
        來源：{title} — Hawks{date ? ` · ${date}` : ""}
        <br />
        <a href={url}>{url}</a>
      </p>
    </>
  );
}
