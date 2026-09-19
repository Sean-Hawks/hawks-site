"use client";
import { useId, useRef, useState } from "react";
import { Copy, Link2, Printer, Share2 } from "lucide-react";
import { articleCitation, canonicalArticleUrl, copyArticleText, shareArticle } from "../lib/article-actions";

export default function ArticleShare({ title, path, date }: { title: string; path: string; date?: string }) {
  const url = canonicalArticleUrl(path);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const copyId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const buttonClass = "inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgb(var(--line)/0.12)] px-3 text-sm text-[rgb(var(--muted))] transition-colors hover:border-[rgb(var(--accent)/0.4)] hover:text-[rgb(var(--accent))] disabled:opacity-50";
  const port = () => ({ share: navigator.share?.bind(navigator), clipboard: navigator.clipboard });
  function result(status: "copied" | "manual", text: string, success: string) {
    setManual(status === "manual" ? text : null);
    setMessage(status === "copied" ? success : "瀏覽器無法自動複製。請選取下方文字後複製。");
  }
  async function copy(text: string, success: string) { result(await copyArticleText(text,port()), text, success); }
  async function share() {
    setBusy(true);
    const status = await shareArticle(title,url,port());
    setBusy(false);
    if (status === "cancelled") return;
    if (status === "shared") { setManual(null); setMessage("已開啟分享"); }
    else result(status,url,"已複製分享連結");
  }
  return <>
    <section aria-label="分享與列印" data-print-hide className="border-t border-[rgb(var(--line)/0.12)] p-6 sm:px-10">
      <h2 className="text-sm font-bold">把這篇留給自己，或分享給朋友</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={share} disabled={busy} className={buttonClass}><Share2 className="h-4 w-4"/>分享文章</button>
        <button type="button" onClick={() => copy(url,"已複製文章連結")} className={buttonClass}><Link2 className="h-4 w-4"/>複製連結</button>
        <button type="button" onClick={() => copy(articleCitation(title,url,date),"已複製標題、日期與來源")} className={buttonClass}><Copy className="h-4 w-4"/>複製引用</button>
        <button type="button" onClick={() => window.print()} className={buttonClass}><Printer className="h-4 w-4"/>列印文字版</button>
      </div>
      <p className="mt-3 text-xs leading-6 text-[rgb(var(--muted))]">文字版保留正文和來源網址，略過封面與相簿；可在列印視窗選擇另存 PDF。</p>
      <p role="status" className="mt-1 text-xs text-[rgb(var(--muted))]">{message}</p>
      {manual !== null && <div className="mt-3 text-xs font-medium"><label htmlFor={copyId}>手動複製</label>
        <textarea id={copyId} ref={textRef} readOnly value={manual} rows={3} onFocus={event => event.currentTarget.select()} className="mt-1 w-full rounded-lg border border-[rgb(var(--line)/0.2)] bg-[rgb(var(--bg))] p-3 text-sm"/>
        <button type="button" onClick={() => {textRef.current?.focus(); textRef.current?.select();}} className="mt-1 min-h-11 underline">選取全部文字</button>
      </div>}
    </section>
    <p className="article-print-source">來源：{title} — Hawks{date ? ` · ${date}` : ""}<br/><a href={url}>{url}</a></p>
  </>;
}
