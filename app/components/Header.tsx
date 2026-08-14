"use client";

import React from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";

type ThemeMode = "light" | "dark";

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("light");

  const navItems = [
    { label: "README", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Library", href: "/library" },
    { label: "Project", href: "/project" },
    { label: "Search", href: "/search" },
    { label: "Subscribe", href: "/subscribe" },
    { label: "Contact", href: "/contact" },
    { label: "Timeline", href: "/timeline" },
  ];

  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const currentTheme =
      document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme((current) => {
      const nextTheme: ThemeMode = current === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      try {
        localStorage.setItem("theme-v2", nextTheme);
      } catch {
        // Theme still changes for the current page when storage is unavailable.
      }
      return nextTheme;
    });
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
          <nav className="hidden items-center gap-2 lg:flex">
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
          {renderThemeButton()}
          <button
            type="button"
            aria-controls="mobile-nav"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setIsOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center border border-[rgb(var(--line)/0.12)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--text))] transition-colors hover:border-[rgb(var(--accent)/0.40)] lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        className={[
          "mx-auto grid max-w-7xl gap-2 px-4 pb-4 transition-[grid-template-rows,opacity] sm:px-6 lg:hidden",
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
