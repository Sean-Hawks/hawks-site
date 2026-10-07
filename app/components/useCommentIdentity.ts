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
type LoginResult = { pending?: boolean; token?: string; user?: CommentUser; notificationEmail?: string };

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
  const [notificationEmail, setNotificationEmail] = useState("");
  const [removingEmail, setRemovingEmail] = useState(false);
  const unlinkInFlight = useRef(false);
  const [pending, setPending] = useState<PendingLogin | null>(null);
  const [starting, setStarting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const logoutInFlight = useRef(false);
  const [notice, setNotice] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [configRevision, setConfigRevision] = useState(0);
  const startInFlight = useRef(false);
  const attemptId = useRef(0);
  const [error, setError] = useState("");
  const popup = useRef<Window | null>(null);
  const invalidate = useCallback(() => {
    storageSet(sessionKey, null);
    setToken("");
    setUser(null);
    setNotificationEmail("");
    setNotice("");
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
            const session = await commentsRequest<{ user: CommentUser; notificationEmail?: string }>(
              `${api}/v1/comments/auth/me`,
              { headers: { Authorization: `Bearer ${saved}` } },
            );
            if (!session.user) throw new Error("Session expired");
            if (active) {
              setToken(saved);
              setUser(session.user);
              setNotificationEmail(session.notificationEmail || "");
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
  }, [api, invalidate, configRevision]);
  useEffect(() => {
    if (!api || !token) return;
    let active = true;
    // Returning from the email confirmation page refreshes the private binding
    // without a full-page reload that would discard the comment draft.
    async function refreshEmail() {
      try {
        const session = await commentsRequest<{ notificationEmail?: string }>(
          `${api}/v1/comments/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (active) setNotificationEmail(session.notificationEmail || "");
      } catch {
        /* A temporary outage must not discard an otherwise valid session. */
      }
    }
    window.addEventListener("focus", refreshEmail);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshEmail);
    };
  }, [api, token]);
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
        setNotificationEmail(result.notificationEmail || "");
        setPending(null);
        setNoticeTitle("GitHub 登入成功");
        setNotice(`已登入 @${result.user.githubLogin}，接下來的留言會顯示 GitHub 身分。`);
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
    setNotice("");
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
    setNoticeTitle("已取消登入");
    setNotice("已取消登入，仍可匿名留言。");
    try {
      popup.current?.close();
    } catch {
      /* A separated popup can be closed manually. */
    }
  }
  async function logout() {
    if (!api || logoutInFlight.current) return;
    logoutInFlight.current = true;
    setSigningOut(true);
    setError("");
    setNotice("");
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
      setNoticeTitle("已切換匿名留言");
      setNotice("已登出，接下來會以匿名或你填寫的暱稱留言。");
    } catch {
      setError("暫時無法登出，請稍後再試。");
    } finally {
      logoutInFlight.current = false;
      setSigningOut(false);
    }
  }
  function retryConfig() {
    setError("");
    setConfigRevision((value) => value + 1);
  }
  async function unlinkEmail() {
    if (!api || !token || unlinkInFlight.current) return false;
    unlinkInFlight.current = true;
    setRemovingEmail(true);
    setError("");
    setNotice("");
    try {
      await commentsRequest(`${api}/v1/comments/auth/email/unlink`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: "{}",
      });
      setNotificationEmail("");
      setNoticeTitle("已移除通知信箱");
      setNotice("已取消此 GitHub 帳號的所有回覆通知。之後仍可重新驗證信箱。");
      return true;
    } catch {
      setError("無法移除通知信箱，請稍後重試。");
      return false;
    } finally {
      unlinkInFlight.current = false;
      setRemovingEmail(false);
    }
  }
  return {
    features,
    user,
    token,
    notificationEmail,
    removingEmail,
    pending: Boolean(pending) || starting,
    signingOut,
    notice,
    noticeTitle,
    error,
    login,
    cancel,
    logout,
    invalidate,
    retryConfig,
    unlinkEmail,
  };
}
