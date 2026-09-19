"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, Menu, Moon, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";

type ThemeMode = "light" | "dark";

function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
function themeSnapshot(): ThemeMode {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export default function Header() {
  const pathname = usePathname();
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuPath, setMenuPath] = React.useState<string | null>(null);
  const isOpen = menuPath === pathname;
  const theme = React.useSyncExternalStore(subscribeTheme, themeSnapshot, () => "light" as ThemeMode);

  const navItems = [
    { label: "README", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Library", href: "/library" },
    { label: "Explore", href: "/explore" },
    { label: "Project", href: "/project" },
    { label: "Search", href: "/search" },
    { label: "Subscribe", href: "/subscribe" },
    { label: "Contact", href: "/contact" },
    { label: "Timeline", href: "/timeline" },
  ];

  React.useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPath(null);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const toggleTheme = React.useCallback(() => {
    const nextTheme: ThemeMode = themeSnapshot() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("theme-v2", nextTheme);
    } catch {
      // Theme still changes for this page when storage is unavailable.
    }
  }, []);

  const themeLabel = theme === "dark" ? "切換到淺色模式" : "切換到深色模式";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  const renderThemeButton = () => (
    <button
      type="button"
      aria-label={themeLabel}
      aria-pressed={theme === "dark"}
      title={themeLabel}
      onClick={toggleTheme}
      className="grid h-10 w-10 place-items-center border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--text))] transition-colors hover:border-[rgb(var(--accent)/0.40)] hover:text-[rgb(var(--accent))]"
    >
      <ThemeIcon className="h-4 w-4" />
    </button>
  );

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--bg)/0.88)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="hawks.tw README"
          className="header-wordmark group text-[rgb(var(--text))]"
        >
          <span>HAWKS</span>
          <span className="header-wordmark-outline">.TW</span>
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="主要導覽" className="hidden items-center gap-2 xl:flex">
            {navItems.map((item) => {
              // 簡單的路由匹配邏輯
              const isActive = 
                item.href === "/" 
                  ? pathname === "/" 
                  : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuPath(null)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "border-b px-3 py-2 font-mono text-xs font-semibold tracking-[0.04em] transition-colors",
                    isActive
                      ? "border-[rgb(var(--accent))] bg-[rgb(var(--accent)/0.07)] text-[rgb(var(--accent))]"
                      : "border-transparent text-[rgb(var(--muted))] hover:border-[rgb(var(--accent)/0.3)] hover:text-[rgb(var(--text))]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/saved/" aria-label="稍後閱讀" title="稍後閱讀" className="grid h-10 w-10 place-items-center border border-[rgb(var(--line)/0.12)] text-[rgb(var(--muted))] hover:text-[rgb(var(--accent))]"><Bookmark className="h-4 w-4" /></Link>
          {renderThemeButton()}
          <button
            type="button"
            ref={menuButtonRef}
            aria-controls="mobile-nav"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuPath(isOpen ? null : pathname)}
            className="grid h-10 w-10 place-items-center border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--text))] transition-colors hover:border-[rgb(var(--accent)/0.40)] xl:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="手機導覽"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={[
          "mx-auto grid max-w-7xl gap-2 px-4 pb-4 transition-[grid-template-rows,opacity] sm:px-6 xl:hidden",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="grid gap-px border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.12)] p-px shadow-[0_18px_60px_rgba(0,0,0,0.12)]">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuPath(null)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "bg-[rgb(var(--panel))] px-3 py-2 font-mono text-xs tracking-[0.04em] transition-colors",
                    isActive
                      ? "text-[rgb(var(--accent))]"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
