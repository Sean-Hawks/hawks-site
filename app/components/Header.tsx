"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Bookmark, ChevronDown, Compass, Menu, Moon, Rss, Search, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";

type ThemeMode = "light" | "dark";

const mainLinks = [
  { label: "Blog", detail: "文章與近況", href: "/blog/" },
  { label: "Library", detail: "收藏與評論", href: "/library/" },
  { label: "Project", detail: "程式與作品", href: "/project/" },
];
const readingLinks = [
  { label: "隨機探索", href: "/explore/", icon: Compass },
  { label: "稍後閱讀", href: "/saved/", icon: Bookmark },
  { label: "訂閱更新", href: "/subscribe/", icon: Rss },
];
const aboutLinks = [
  { label: "經歷時間軸", href: "/timeline/" },
  { label: "聯絡我", href: "/contact/" },
];

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
  const headerRef = React.useRef<HTMLElement>(null);
  const desktopNavRef = React.useRef<HTMLElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuPath, setMenuPath] = React.useState<string | null>(null);
  const isOpen = menuPath === pathname;
  const theme = React.useSyncExternalStore(subscribeTheme, themeSnapshot, () => "light" as ThemeMode);

  const isActive = (href: string) => {
    const section = href.replace(/\/$/, "");
    return pathname === section || pathname.startsWith(`${section}/`) ||
      (href === "/blog/" && (pathname === "/talk" || pathname.startsWith("/talk/")));
  };
  const current = (href: string) => !isActive(href) ? undefined :
    pathname.replace(/\/$/, "") === href.replace(/\/$/, "") ? "page" as const : "location" as const;
  const moreActive = [...readingLinks, ...aboutLinks].some(item => isActive(item.href));
  const closeMenu = () => setMenuPath(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const closeAndFocus = () => {
      setMenuPath(null);
      menuButtonRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndFocus();
      }
    };
    const onOutside = (event: Event) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setMenuPath(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [isOpen]);

  React.useEffect(() => {
    const breakpoint = window.matchMedia("(min-width: 768px)");
    const onBreakpoint = (event: MediaQueryListEvent) => {
      // Keep focus visible when a panel closes or the desktop links disappear.
      if (panelRef.current?.contains(document.activeElement) ||
          (!event.matches && desktopNavRef.current?.contains(document.activeElement))) {
        menuButtonRef.current?.focus();
      }
      setMenuPath(null);
    };
    breakpoint.addEventListener("change", onBreakpoint);
    return () => breakpoint.removeEventListener("change", onBreakpoint);
  }, []);

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

  return (
    <header ref={headerRef} className="site-header sticky top-0 z-20 w-full border-b border-[rgb(var(--line)/0.12)] bg-[rgb(var(--bg)/0.94)] backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="hawks.tw 首頁" onClick={closeMenu} className="header-wordmark shrink-0 text-[rgb(var(--text))]">
          <span>HAWKS</span><span className="header-wordmark-outline">.TW</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <nav ref={desktopNavRef} aria-label="主要導覽" className="mr-3 hidden items-center gap-1 md:flex">
            {mainLinks.map(item => (
              <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={current(item.href)} className="header-main-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/search/" aria-label="搜尋全站" title="搜尋全站" aria-current={current("/search/")} onClick={closeMenu} className="header-icon-button">
            <Search aria-hidden="true" className="h-[18px] w-[18px]" />
          </Link>
          <button type="button" aria-label={themeLabel} aria-pressed={theme === "dark"} title={themeLabel} onClick={toggleTheme} className="header-icon-button">
            <ThemeIcon aria-hidden="true" className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            ref={menuButtonRef}
            aria-controls="site-navigation-panel"
            aria-expanded={isOpen}
            aria-label={isOpen ? "關閉更多導覽" : "開啟更多導覽"}
            onClick={() => setMenuPath(isOpen ? null : pathname)}
            className="header-icon-button header-menu-button"
            data-active={moreActive || undefined}
          >
            <span className="hidden md:inline">更多</span>
            <ChevronDown aria-hidden="true" className={`hidden h-4 w-4 md:block ${isOpen ? "rotate-180" : ""}`} />
            {isOpen ? <X aria-hidden="true" className="h-5 w-5 md:hidden" /> : <Menu aria-hidden="true" className="h-5 w-5 md:hidden" />}
          </button>
        </div>

        <nav id="site-navigation-panel" ref={panelRef} aria-label="網站導覽" hidden={!isOpen} className="header-navigation-panel">
          <div className="header-nav-group header-mobile-content md:hidden">
            <h2 className="header-nav-heading">瀏覽內容</h2>
            <div className="grid grid-cols-3 gap-2">
              {mainLinks.map(item => (
                <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={current(item.href)} className="header-content-link">
                  <span className="font-mono text-sm font-bold">{item.label}</span>
                  <span className="mt-1 text-[11px] text-[rgb(var(--muted))]">{item.detail}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="header-nav-group">
            <h2 className="header-nav-heading">閱讀工具</h2>
            <div className="grid grid-cols-3 gap-2">
              {readingLinks.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} onClick={closeMenu} aria-current={current(href)} className="header-tool-link">
                  <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="header-nav-group">
            <h2 className="header-nav-heading">關於我</h2>
            <div className="grid grid-cols-2 gap-2">
              {aboutLinks.map(item => (
                <Link key={item.href} href={item.href} onClick={closeMenu} aria-current={current(item.href)} className="header-about-link">
                  <span>{item.label}</span><ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
