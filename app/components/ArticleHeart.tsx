"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, RotateCcw } from "lucide-react";
import {
  HEART_VISITOR_KEY,
  HeartRequestError,
  getHeartVisitor,
  heartsApiOrigin,
  requestHeart,
  type HeartValue,
} from "../lib/hearts-client";

function ConnectedHeart({ id, api }: { id: string; api: string }) {
  const [value, setValue] = useState<HeartValue | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "writing" | "error">("loading");
  const [message, setMessage] = useState("");
  const [temporary, setTemporary] = useState(false);
  const request = useRef<AbortController | null>(null);
  const pending = useRef(false);

  const refresh = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    const controller = new AbortController();
    request.current = controller;
    try {
      const visitor = getHeartVisitor();
      const next = await requestHeart(api, id, { token: visitor.token, signal: controller.signal });
      if (controller.signal.aborted || request.current !== controller) return;
      setValue(next);
      setTemporary(Boolean(visitor.token) && !visitor.persistent);
      setPhase("ready");
    } catch {
      if (controller.signal.aborted || request.current !== controller) return;
      setPhase("error");
      setMessage("暫時無法讀取喜歡數，請稍後重試。");
    } finally {
      if (request.current === controller) pending.current = false;
    }
  }, [api, id]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    const revalidate = () => {
      if (pending.current) return;
      setPhase("loading");
      setMessage("");
      void refresh();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === HEART_VISITOR_KEY || event.key === null) revalidate();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", revalidate);
    return () => {
      window.clearTimeout(initialLoad);
      request.current?.abort();
      pending.current = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", revalidate);
    };
  }, [refresh]);

  async function toggle() {
    if (!value || phase !== "ready" || pending.current) return;
    pending.current = true;
    const controller = new AbortController();
    request.current = controller;
    const liked = !value.liked;
    setPhase("writing");
    setMessage("");
    let token: string | null = null;
    try {
      const visitor = getHeartVisitor(true);
      token = visitor.token;
      setTemporary(!visitor.persistent);
      const next = await requestHeart(api, id, { token, liked, signal: controller.signal });
      if (controller.signal.aborted || request.current !== controller) return;
      setValue(next);
      setPhase("ready");
      setMessage(next.liked ? "已送出喜歡，謝謝你！" : "已取消喜歡。");
    } catch (error) {
      if (controller.signal.aborted || request.current !== controller) return;
      // A dropped response does not tell us whether the PUT reached the server.
      // Read the authoritative value before allowing another desired-state PUT.
      try {
        if (!token) throw error;
        const confirmed = await requestHeart(api, id, { token, signal: controller.signal });
        if (controller.signal.aborted || request.current !== controller) return;
        setValue(confirmed);
        setPhase("ready");
        setMessage(confirmed.liked === liked
          ? (liked ? "已確認送出喜歡，謝謝你！" : "已確認取消喜歡。")
          : error instanceof HeartRequestError && error.status === 429
            ? "操作太頻繁，請稍後再試。"
            : "這次變更未完成，請再按一次。");
      } catch {
        if (controller.signal.aborted || request.current !== controller) return;
        setPhase("error");
        setMessage("目前無法確認喜歡狀態，請重新讀取後再試。");
      }
    } finally {
      if (request.current === controller) pending.current = false;
    }
  }

  const loading = phase === "loading" || phase === "writing";
  return (
    <div className="mt-4 text-sm" data-print-hide>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={phase !== "ready"}
          aria-pressed={value?.liked ?? false}
          aria-label={`${value?.liked ? "已喜歡" : "喜歡"}${value && phase !== "error" ? `，共 ${value.count} 個喜歡` : ""}`}
          aria-busy={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgb(var(--accent)/0.25)] bg-[rgb(var(--accent)/0.07)] px-3 font-medium text-[rgb(var(--accent))] transition-colors hover:bg-[rgb(var(--accent)/0.13)] disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none"
        >
          <Heart aria-hidden="true" className="h-4 w-4" fill={value?.liked ? "currentColor" : "none"} />
          {value?.liked ? "已喜歡" : "喜歡"}
          {value && phase !== "error" && <span className="tabular-nums">{value.count.toLocaleString("zh-TW")}</span>}
          {!value && phase === "loading" && <span className="text-xs">讀取中</span>}
        </button>
        {phase === "error" && (
          <button type="button" onClick={() => {
            if (pending.current) return;
            setPhase("loading");
            setMessage("");
            void refresh();
          }} className="inline-flex min-h-11 items-center gap-1.5 px-2 text-xs text-[rgb(var(--accent))] underline">
            <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />重新讀取
          </button>
        )}
        <span className="text-xs text-[rgb(var(--muted))]">給這篇一點回應</span>
      </div>
      <p role="status" className={message ? "mt-1 text-xs text-[rgb(var(--muted))]" : "sr-only"}>{message}</p>
      {temporary && <p className="mt-1 text-xs text-[rgb(var(--muted))]">此瀏覽器無法保存喜歡狀態，重新開啟後可能不會記得你已按過。</p>}
    </div>
  );
}

export default function ArticleHeart({ id }: { id: string }) {
  const api = heartsApiOrigin(process.env.NEXT_PUBLIC_HEARTS_API_URL);
  return api ? <ConnectedHeart key={`${api}:${id}`} api={api} id={id} /> : null;
}
