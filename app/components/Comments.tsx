"use client";

import { useEffect, useRef } from "react";
import { commentsEnabled, giscusConfig } from "../lib/comments-config";

function currentTheme(): "light" | "dark" {
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

export default function Comments() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!commentsEnabled) return;
    const container = containerRef.current;
    if (!container || container.querySelector("script,iframe.giscus-frame")) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", giscusConfig.repo);
    script.setAttribute("data-repo-id", giscusConfig.repoId);
    script.setAttribute("data-category", giscusConfig.category);
    script.setAttribute("data-category-id", giscusConfig.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", currentTheme());
    script.setAttribute("data-lang", "zh-TW");
    script.setAttribute("data-loading", "lazy");
    container.appendChild(script);

    // 主題切換時同步 giscus iframe 的配色
    const observer = new MutationObserver(() => {
      const iframe = document.querySelector<HTMLIFrameElement>(
        "iframe.giscus-frame",
      );
      iframe?.contentWindow?.postMessage(
        { giscus: { setConfig: { theme: currentTheme() } } },
        "https://giscus.app",
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  if (!commentsEnabled) return null;

  return (
    <section className="mt-8 rounded-2xl border border-[rgb(var(--line)/0.10)] bg-[rgb(var(--panel)/0.78)] p-5 sm:p-6">
      <h2 className="mb-4 font-bold text-[rgb(var(--text))]">留言</h2>
      <div ref={containerRef} className="giscus" />
    </section>
  );
}
