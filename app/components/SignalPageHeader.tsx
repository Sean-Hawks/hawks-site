import type { ReactNode } from "react";

type SignalPageHeaderProps = {
  code: string;
  title: string;
  description: string;
  statLabel?: string;
  statValue?: ReactNode;
  children?: ReactNode;
};

export default function SignalPageHeader({
  code,
  title,
  description,
  statLabel,
  statValue,
  children,
}: SignalPageHeaderProps) {
  return (
    <header className="signal-page-header home-panel mb-8 overflow-hidden">
      <div className="signal-page-kicker flex items-center justify-between gap-4 border-b border-[rgb(var(--line)/0.12)] px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] sm:px-6">
        <span className="text-[rgb(var(--accent))]">{code}</span>
        <span className="text-[rgb(var(--muted))]">HAWKS.TW / SIGNAL GRID</span>
      </div>

      <div className={statValue === undefined ? undefined : "grid sm:grid-cols-[minmax(0,1fr)_10rem]"}>
        <div className="p-5 sm:p-7">
          <h1 className="signal-page-title font-serif text-4xl font-bold leading-[0.94] tracking-[-0.045em] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[rgb(var(--muted))] sm:text-base sm:leading-8">
            {description}
          </p>
          {children && <div className="mt-5">{children}</div>}
        </div>

        {statValue !== undefined && (
          <div className="signal-page-stat flex flex-row items-end justify-between gap-3 border-t border-[rgb(var(--line)/0.12)] p-5 sm:flex-col sm:items-start sm:justify-end sm:border-l sm:border-t-0 sm:p-6">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              {statLabel}
            </div>
            <div className="font-mono text-3xl font-bold leading-none text-[rgb(var(--accent))] sm:text-4xl">
              {statValue}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
