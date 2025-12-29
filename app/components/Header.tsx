"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: "README", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: "Talk", href: "/talk" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-20 w-full border-b border-[rgba(255,255,255,0.06)] bg-[rgb(var(--bg))]">
      <div className="flex items-center justify-between px-4 sm:px-3 py-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[rgba(255,255,255,0.06)]">
            <MessageCircle className="h-5 w-5 opacity-80" />
          </div>
          <div className="font-semibold tracking-wide">hawks.tw</div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
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
                    ? "bg-[rgba(251,191,36,0.10)] text-[rgb(var(--text))] border border-[rgba(251,191,36,0.20)]"
                    : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))] hover:bg-[rgba(255,255,255,0.06)]",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button className="md:hidden rounded-xl px-3 py-2 text-sm bg-[rgba(255,255,255,0.06)]">
          Menu
        </button>
      </div>
    </header>
  );
}
