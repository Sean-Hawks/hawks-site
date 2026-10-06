"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
export default function CommentVerification({
  siteKey,
  revision,
  onToken,
}: {
  siteKey: string;
  revision: number;
  onToken: (token: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const api = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    if (!ready || !api || !container.current) return;
    onToken("");
    const id = api.render(container.current, {
      sitekey: siteKey,
      action: "comment",
      theme: "auto",
      size: "flexible",
      callback: (token: string) => {
        setFailed(false);
        onToken(token);
      },
      "expired-callback": () => onToken(""),
      "error-callback": () => {
        setFailed(true);
        onToken("");
      },
    });
    return () => {
      api.remove(id);
      onToken("");
    };
  }, [ready, siteKey, revision, onToken]);
  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => setFailed(true)}
      />
      <div ref={container} className="min-h-16" aria-label="留言安全驗證" />
      {failed && (
        <p className="text-sm text-[rgb(var(--purple))]" role="alert">
          無法載入安全驗證，請檢查連線或內容封鎖設定後重新整理。
        </p>
      )}
    </>
  );
}
