"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  commentsRequest,
  type CommentFeatures,
  type CommentUser,
} from "../lib/comments-client";

const sessionKey = "hawks:comments-session";
const pendingKey = "hawks:comments-login";
type PendingLogin = { state: string; verifier: string; started: number };
type LoginResult = { pending?: boolean; token?: string; user?: CommentUser };

function storageGet(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* The current tab can still authenticate without storage. */
  }
}
function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default function useCommentIdentity(api: string | null) {
  const [features, setFeatures] = useState<CommentFeatures | null>(null);
  const [user, setUser] = useState<CommentUser | null>(null);
  const [token, setToken] = useState("");
  const [pending, setPending] = useState<PendingLogin | null>(null);
  const [starting, setStarting] = useState(false);
  const startInFlight = useRef(false);
  const attemptId = useRef(0);
  const [error, setError] = useState("");
  const popup = useRef<Window | null>(null);
  const invalidate = useCallback(() => {
    storageSet(sessionKey, null);
    setToken("");
    setUser(null);
  }, []);
  useEffect(() => {
    if (!api) return;
    let active = true;
    void (async () => {
      try {
        const config = await commentsRequest<CommentFeatures>(
          `${api}/v1/comments/config`,
        );
        if (!active) return;
        setFeatures(config);
        const saved = storageGet(sessionKey);
        if (saved) {
          try {
            const session = await commentsRequest<{ user: CommentUser }>(
              `${api}/v1/comments/auth/me`,
              { headers: { Authorization: `Bearer ${saved}` } },
            );
            if (!session.user) throw new Error("Session expired");
            if (active) {
              setToken(saved);
              setUser(session.user);
            }
          } catch {
            if (active) invalidate();
          }
        }
        const storedPending = storageGet(pendingKey);
        if (active && storedPending && config.githubEnabled) {
          try {
            const login = JSON.parse(storedPending) as PendingLogin;
            if (
              /^[A-Za-z0-9_-]{43}$/.test(login.state) &&
              /^[A-Za-z0-9_-]{43}$/.test(login.verifier) &&
              Date.now() - login.started < 10 * 60_000
            )
              setPending(login);
            else storageSet(pendingKey, null);
          } catch {
            storageSet(pendingKey, null);
          }
        }
      } catch {
        if (active) setError("登入與通知設定暫時無法讀取，請稍後重新整理。");
      }
    })();
    return () => {
      active = false;
    };
  }, [api, invalidate]);
  useEffect(() => {
    if (!api || !pending) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (!api || !pending || !active) return;
      try {
        if (Date.now() - pending.started >= 10 * 60_000)
          throw new Error("登入已逾時，請重新登入。");
        const result = await commentsRequest<LoginResult>(
          `${api}/v1/comments/auth/github/session`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              state: pending.state,
              verifier: pending.verifier,
            }),
          },
        );
        if (!active) return;
        if (result.pending) {
          timer = setTimeout(() => void poll(), 2500);
          return;
        }
        if (!result.token || !result.user)
          throw new Error("登入回應無效，請重新登入。");
        storageSet(sessionKey, result.token);
        storageSet(pendingKey, null);
        setToken(result.token);
        setUser(result.user);
        setPending(null);
        try {
          popup.current?.close();
        } catch {
          /* A separated popup can be closed manually. */
        }
      } catch (failure) {
        if (!active) return;
        storageSet(pendingKey, null);
        setPending(null);
        setError(
          failure instanceof Error &&
            failure.name !== "TypeError" &&
            failure.name !== "TimeoutError"
            ? failure.message
            : "登入服務暫時無法連線，請重試。",
        );
      }
    }
    timer = setTimeout(() => void poll(), 1000);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, pending]);
  async function login() {
    if (!api || !features?.githubEnabled || pending || startInFlight.current)
      return;
    startInFlight.current = true;
    const attempt = ++attemptId.current;
    setStarting(true);
    setError("");
    popup.current = window.open(
      "",
      "hawks-comments-github",
      "popup=yes,width=560,height=720",
    );
    if (!popup.current) {
      startInFlight.current = false;
      setStarting(false);
      setError("請允許開啟登入視窗後再試。");
      return;
    }
    try {
      const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
      const challenge = base64url(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(verifier),
          ),
        ),
      );
      const result = await commentsRequest<{
        authorizeUrl: string;
        state: string;
      }>(`${api}/v1/comments/auth/github/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge }),
      });
      if (attempt !== attemptId.current) return;
      const target = new URL(result.authorizeUrl);
      if (
        target.origin !== "https://github.com" ||
        target.pathname !== "/login/oauth/authorize" ||
        target.searchParams.get("state") !== result.state
      )
        throw new Error("登入網址無效，請稍後再試。");
      const login = { state: result.state, verifier, started: Date.now() };
      storageSet(pendingKey, JSON.stringify(login));
      setPending(login);
      popup.current.location.href = target.href;
    } catch {
      if (attempt !== attemptId.current) return;
      popup.current?.close();
      setError("GitHub 登入暫時無法使用，請稍後再試。");
    } finally {
      if (attempt === attemptId.current) {
        startInFlight.current = false;
        setStarting(false);
      }
    }
  }
  function cancel() {
    attemptId.current++;
    startInFlight.current = false;
    setStarting(false);
    storageSet(pendingKey, null);
    setPending(null);
    try {
      popup.current?.close();
    } catch {
      /* A separated popup can be closed manually. */
    }
  }
  async function logout() {
    if (!api) return;
    setError("");
    try {
      await commentsRequest(`${api}/v1/comments/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: "{}",
      });
      invalidate();
    } catch {
      setError("暫時無法登出，請稍後再試。");
    }
  }
  return {
    features,
    user,
    token,
    pending: Boolean(pending) || starting,
    error,
    login,
    cancel,
    logout,
    invalidate,
  };
}
