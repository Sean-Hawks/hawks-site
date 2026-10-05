"use client";

import { useState } from "react";

type PublicationActivityProps = {
  dates: string[];
};

export default function PublicationActivity({
  dates,
}: PublicationActivityProps) {
  const [selectedMonth, setSelectedMonth] = useState(11);
  const newest = [...dates].sort().at(-1);
  if (!newest) return null;

  const [year, month] = newest.split("-").map(Number);
  const months = Array.from({ length: 12 }, (_, index) => {
    const key = new Date(Date.UTC(year, month - 12 + index, 1))
      .toISOString()
      .slice(0, 7);
    return { key, count: dates.filter((date) => date.startsWith(key)).length };
  });
  const peak = Math.max(1, ...months.map((item) => item.count));
  const total = months.reduce((sum, item) => sum + item.count, 0);
  const points = months.map((item, index) => ({
    ...item,
    x: 8 + index * (264 / 11),
    y: 84 - (item.count / peak) * 64,
  }));
  const selected = points[selectedMonth];

  return (
    <section className="publication-panel" aria-labelledby="activity-title">
      <div className="console-title-row">
        <h2 id="activity-title">發布活動</h2>
        <span>
          <strong>{total}</strong> 則
        </span>
      </div>
      <div className="publication-body">
        <div className="publication-readout">
          <div>
            <time dateTime={selected.key}>{selected.key.replace("-", " / ")}</time>
            <span>文章與近況</span>
          </div>
          <output htmlFor="publication-month" aria-live="off">
            <strong>{selected.count}</strong><small>則</small>
          </output>
        </div>
        <div className="publication-scale">
          <span>文章與近況 / 每月</span>
          <span>最高 {peak} 則</span>
        </div>
        <svg
          viewBox="0 0 280 96"
          role="img"
          aria-labelledby="activity-chart-title activity-chart-desc"
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse") return;
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 280;
            setSelectedMonth(Math.max(0, Math.min(11, Math.round((x - 8) / 24))));
          }}
        >
          <title id="activity-chart-title">最近 12 個月發布數量</title>
          <desc id="activity-chart-desc">
            {months.map((item) => `${item.key}：${item.count} 則`).join("；")}
          </desc>
          <path
            d="M8 20H272 M8 52H272 M8 84H272"
            className="publication-guides"
          />
          <polyline
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
            className="publication-line"
          />
          <path d={`M${selected.x} 12V88`} className="publication-cursor" />
          {points.map((point) => (
            <circle
              key={point.key}
              cx={point.x}
              cy={point.y}
              r={point.key === selected.key ? 4 : 2}
              className={`publication-point${point.key === selected.key ? " is-selected" : ""}`}
            >
              <title>{`${point.key} · ${point.count} 則`}</title>
            </circle>
          ))}
        </svg>
        <label className="publication-control-label" htmlFor="publication-month">選擇月份</label>
        <input
          id="publication-month"
          className="publication-slider"
          type="range"
          min={0}
          max={11}
          step={1}
          value={selectedMonth}
          aria-valuetext={`${selected.key}：${selected.count} 則文章與近況`}
          onChange={(event) => setSelectedMonth(Number(event.target.value))}
        />
        <div className="publication-scale">
          <span>{months[0].key}</span>
          <span>{newest.slice(0, 7)}</span>
        </div>
      </div>
      <div className="panel-source">發布日期 · 截至最新公開紀錄</div>
    </section>
  );
}
