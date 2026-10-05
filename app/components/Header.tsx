"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  ChevronDown,
  Code2,
  Compass,
  Home,
  Library,
  Menu,
  Rss,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";

const mainLinks = [
  { label: "總覽", detail: "最新動態", href: "/" },
  { label: "文章", detail: "文章與近況", href: "/blog/" },
  { label: "收藏", detail: "收藏與評論", href: "/library/" },
  { label: "專案", detail: "程式與作品", href: "/project/" },
];
const readingLinks = [
  { label: "隨機探索", href: "/explore/", icon: Compass },
  { label: "稍後閱讀", href: "/saved/", icon: Bookmark },
  { label: "部落卷", href: "/blogroll/", icon: Users },
  { label: "訂閱更新", href: "/subscribe/", icon: Rss },
];
const railLinks = [
  { label: "總覽", href: "/", icon: Home },
  { label: "文章", href: "/blog/", icon: BookOpen },
  { label: "收藏", href: "/library/", icon: Library },
  { label: "專案", href: "/project/", icon: Code2 },
  { label: "搜尋", href: "/search/", icon: Search },
];
const aboutLinks = [
  { label: "經歷時間軸", href: "/timeline/" },
  { label: "聯絡我", href: "/contact/" },
];

export default function Header() {
  const pathname = usePathname();
  const headerRef = React.useRef<HTMLElement>(null);
  const desktopNavRef = React.useRef<HTMLElement>(null);
  const panelRef = React.useRef<HTMLElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const [menuPath, setMenuPath] = React.useState<string | null>(null);
  const isOpen = menuPath === pathname;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    const section = href.replace(/\/$/, "");
    return (
      pathname === section ||
      pathname.startsWith(`${section}/`) ||
      (href === "/blog/" &&
        (pathname === "/talk" || pathname.startsWith("/talk/")))
    );
  };
  const current = (href: string) =>
    !isActive(href)
      ? undefined
      : pathname.replace(/\/$/, "") === href.replace(/\/$/, "")
        ? ("page" as const)
        : ("location" as const);
  const moreActive = [...readingLinks, ...aboutLinks].some((item) =>
    isActive(item.href),
  );
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
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
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
      if (
        panelRef.current?.contains(document.activeElement) ||
        (!event.matches &&
          desktopNavRef.current?.contains(document.activeElement))
      ) {
        menuButtonRef.current?.focus();
      }
      setMenuPath(null);
    };
    const railBreakpoint = window.matchMedia("(min-width: 1280px)");
    const onRailBreakpoint = (event: MediaQueryListEvent) => {
      if (
        (event.matches &&
          desktopNavRef.current?.contains(document.activeElement)) ||
        (!event.matches && document.activeElement?.closest(".site-rail"))
      ) {
        menuButtonRef.current?.focus();
      }
      setMenuPath(null);
    };
    breakpoint.addEventListener("change", onBreakpoint);
    railBreakpoint.addEventListener("change", onRailBreakpoint);
    return () => {
      breakpoint.removeEventListener("change", onBreakpoint);
      railBreakpoint.removeEventListener("change", onRailBreakpoint);
    };
  }, []);

  return (
    <>
      <nav className="site-rail" aria-label="桌面主要導覽">
        <Link
          href="/"
          className="rail-brand"
          aria-label="hawks.tw 首頁"
          onClick={closeMenu}
        >
          H
        </Link>
        <div className="rail-content">
          {railLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={current(href)}
              onClick={closeMenu}
              className="rail-link"
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
        <div className="rail-about">
          <Link
            href="/timeline/"
            aria-current={current("/timeline/")}
            onClick={closeMenu}
            className="rail-link"
          >
            <UserRound size={18} aria-hidden="true" />
            <span>經歷</span>
          </Link>
          <Link
            href="/subscribe/"
            aria-current={current("/subscribe/")}
            onClick={closeMenu}
            className="rail-link"
          >
            <Rss size={18} aria-hidden="true" />
            <span>訂閱</span>
          </Link>
        </div>
      </nav>
      <header
        ref={headerRef}
        className="site-header sticky top-0 z-20 w-full border-b"
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            aria-label="hawks.tw 首頁"
            onClick={closeMenu}
            className="header-wordmark shrink-0 text-[rgb(var(--text))]"
          >
            <span>hawks.tw</span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <nav
              ref={desktopNavRef}
              aria-label="主要導覽"
              className="mr-3 hidden items-center gap-1 md:flex xl:hidden"
            >
              {mainLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={current(item.href)}
                  className="header-main-link"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/search/"
              aria-label="搜尋全站"
              title="搜尋全站"
              aria-current={current("/search/")}
              onClick={closeMenu}
              className="header-icon-button"
            >
              <Search aria-hidden="true" className="h-[18px] w-[18px]" />
            </Link>
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
              <ChevronDown
                aria-hidden="true"
                className={`hidden h-4 w-4 md:block ${isOpen ? "rotate-180" : ""}`}
              />
              {isOpen ? (
                <X aria-hidden="true" className="h-5 w-5 md:hidden" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5 md:hidden" />
              )}
            </button>
          </div>

          <nav
            id="site-navigation-panel"
            ref={panelRef}
            aria-label="網站導覽"
            hidden={!isOpen}
            className="header-navigation-panel"
          >
            <div className="header-nav-group header-mobile-content md:hidden">
              <h2 className="header-nav-heading">瀏覽內容</h2>
              <div className="grid grid-cols-2 gap-2">
                {mainLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={current(item.href)}
                    className="header-content-link"
                  >
                    <span className="font-mono text-sm font-bold">
                      {item.label}
                    </span>
                    <span className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                      {item.detail}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="header-nav-group">
              <h2 className="header-nav-heading">閱讀工具</h2>
              <div className="grid grid-cols-2 gap-2">
                {readingLinks.map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    aria-current={current(href)}
                    className="header-tool-link"
                  >
                    <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="header-nav-group">
              <h2 className="header-nav-heading">關於我</h2>
              <div className="grid grid-cols-2 gap-2">
                {aboutLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={current(item.href)}
                    className="header-about-link"
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
