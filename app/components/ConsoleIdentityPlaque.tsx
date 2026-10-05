"use client";

import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function ConsoleIdentityPlaque({ firstDate, lastDate, entries }: {
  firstDate?: string;
  lastDate?: string;
  entries: number;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="identity-plaque" data-expanded={expanded}>
      <div className="plaque-stage">
        <div className="plaque-face">
          <div className="plaque-caption"><span>個人網站</span><span>台北 · UTC+8</span></div>
          <h1 id="intro-title"><span className="wordmark-solid">HAWKS</span><span className="wordmark-outline">.TW</span></h1>
          <button type="button" className="plaque-toggle" aria-expanded={expanded} aria-controls="plaque-details" onClick={() => setExpanded(!expanded)}>
            <span>{expanded ? "收起識別資訊" : "展開識別資訊"}</span><ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="plaque-details" id="plaque-details" inert={!expanded} aria-hidden={!expanded}>
        <div>
          <dl>
            <div><dt>網站</dt><dd>hawks.tw</dd></div>
            <div><dt>公開紀錄</dt><dd><strong>{entries}</strong> 則</dd></div>
            {firstDate && lastDate && <div><dt>記錄期間</dt><dd>{firstDate.slice(0, 4)} — {lastDate.slice(0, 4)}</dd></div>}
          </dl>
          <Link href="/timeline/">查看經歷<ArrowUpRight size={13} aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  );
}
