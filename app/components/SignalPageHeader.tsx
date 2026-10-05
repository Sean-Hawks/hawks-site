import type { ReactNode } from "react";

type SignalPageHeaderProps = {
  title: string;
  description: string;
  statLabel?: string;
  statValue?: ReactNode;
  children?: ReactNode;
};

export default function SignalPageHeader({
  title,
  description,
  statLabel,
  statValue,
  children,
}: SignalPageHeaderProps) {
  return (
    <header className="signal-page-header home-panel mb-8 overflow-hidden">
      <div className="signal-page-kicker">
        <span>{title}</span>
        <span>內容總覽</span>
      </div>
      <div
        className={
          statValue === undefined
            ? undefined
            : "grid sm:grid-cols-[minmax(0,1fr)_10rem]"
        }
      >
        <div className="p-5 sm:p-7">
          <h1 className="signal-page-title">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base sm:leading-8">
            {description}
          </p>
          {children && <div className="mt-5">{children}</div>}
        </div>
        {statValue !== undefined && (
          <div className="signal-page-stat flex flex-row items-end justify-between gap-3 border-t p-5 sm:flex-col sm:items-start sm:justify-end sm:border-l sm:border-t-0 sm:p-6">
            <div className="text-xs text-[rgb(var(--muted))]">{statLabel}</div>
            <div className="font-mono text-3xl font-bold leading-none">
              {statValue}
            </div>
          </div>
        )}
      </div>
      <div className="panel-source">hawks.tw · 站內內容</div>
    </header>
  );
}
