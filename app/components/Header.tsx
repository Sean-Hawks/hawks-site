"use client";

import React from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";

type ThemeMode = "light" | "dark";

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemeMode>("dark");

  const navItems = [
    { label: "README", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Now", href: "/now" },
    { label: "Library", href: "/library" },
    { label: "Project", href: "/project" },
    { label: "Search", href: "/search" },
    { label: "Contact", href: "/contact" },
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
      className="grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--line)/0.07)]"
    >
      <ThemeIcon className="h-4 w-4" />
    </button>
  );

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[rgb(var(--line)/0.10)] bg-[rgb(var(--bg)/0.88)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-3">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-wide text-[rgb(var(--text))] transition-opacity hover:opacity-80 sm:text-2xl"
        >
          <div>hawks.tw</div>
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
                    "rounded-xl px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--text))] border border-[rgb(var(--accent)/0.24)]"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:bg-[rgb(var(--line)/0.05)]",
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
            className="grid h-10 w-10 place-items-center rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--line)/0.04)] text-[rgb(var(--text))] transition-colors hover:bg-[rgb(var(--line)/0.07)] lg:hidden"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        className={[
          "mx-auto grid max-w-6xl gap-2 px-4 pb-4 transition-[grid-template-rows,opacity] lg:hidden",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="grid gap-2 rounded-xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.94)] p-2 shadow-[0_18px_60px_rgba(90,76,55,0.12)]">
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
                    "rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-[rgb(var(--accent)/0.12)] text-[rgb(var(--text))]"
                      : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--line)/0.05)] hover:text-[rgb(var(--text))]",
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
