import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { JSDOM } from "jsdom";
import React, { act } from "react";

const require = createRequire(import.meta.url);
const dom = new JSDOM('<div id="root"></div>', {
  url: "https://hawks.tw/blog/test/",
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.sessionStorage = dom.window.sessionStorage;
globalThis.localStorage = dom.window.localStorage;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.matchMedia = () => ({ matches: true });
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
const { createRoot } = await import("react-dom/client");
const icons = await import("lucide-react");

// Run real components and hooks; substitute only Next routing/build configuration.
const modules = new Map();
function load(path) {
  path = resolve(path);
  if (modules.has(path)) return modules.get(path).exports;
  const compiledModule = { exports: {} };
  modules.set(path, compiledModule);
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const localRequire = (name) => {
    if (name === "next/navigation") return { usePathname: () => "/blog/test/" };
    if (name === "lucide-react") return icons;
    if (name.endsWith("/comments-config"))
      return {
        commentsConfig: { apiOrigin: "https://comments.test", siteKey: "" },
      };
    if (!name.startsWith(".")) return require(name);
    const target = resolve(dirname(path), name);
    return load([".ts", ".tsx"].map((ext) => target + ext).find(existsSync));
  };
  vm.runInThisContext(`(function(exports, require, module) {${code}\n})`, {
    filename: path,
  })(compiledModule.exports, localRequire, compiledModule);
  return compiledModule.exports;
}
const Comments = load("app/components/Comments.tsx").default;
const { readCommentDraft } = load("app/lib/comment-draft.ts");
const rootMessage = {
  id: 1,
  name: "讀者",
  body: "原留言",
  page: "/blog/test/",
  replyTo: null,
  createdAt: "2026-10-08T00:00:00Z",
  deleted: 0,
};
const user = { githubId: 1234, githubLogin: "reader", name: "讀者" };
const click = async (element) => act(async () => element.click());
const settle = async () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
const button = (text) =>
  [...document.querySelectorAll("button")].find(
    (node) => node.textContent === text,
  );
async function input(id, value) {
  await act(async () => {
    const node = document.getElementById(id);
    const prototype =
      node.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(node, value);
    node.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
async function fixture(t, { session, me, send } = {}) {
  sessionStorage.clear();
  localStorage.clear();
  document.getElementById("root").replaceChildren();
  if (session) sessionStorage.setItem("hawks:comments-session", session);
  const posts = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/config"))
      return Response.json({ githubEnabled: true, emailEnabled: true });
    if (path.endsWith("/auth/me"))
      return me
        ? me()
        : Response.json({ user, notificationEmail: "reader@example.com" });
    if (path.endsWith("/auth/logout")) return Response.json({ ok: true });
    if (path.endsWith("/messages") && init.method === "POST") {
      const payload = JSON.parse(init.body);
      posts.push({ payload, authorization: init.headers.Authorization });
      if (send) return send(payload);
      return Response.json({ message: { ...rootMessage, ...payload, id: 2 } });
    }
    if (path.endsWith("/messages"))
      return Response.json({ messages: [rootMessage], hasMore: false });
    assert.fail(`Unexpected request: ${path}`);
  };
  let root;
  async function mount() {
    await act(async () => {
      root = createRoot(document.getElementById("root"));
      root.render(React.createElement(Comments));
    });
    await settle();
  }
  async function unmount() {
    await act(async () => root.unmount());
  }
  await mount();
  t.after(async () => {
    await unmount();
    globalThis.fetch = originalFetch;
  });
  return { posts, mount, unmount };
}

test("restoring a saved GitHub session blocks posting until identity is known", async (t) => {
  let finish;
  const f = await fixture(t, {
    session: "saved-session",
    me: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  await input("comment-body", "保留身分的留言");
  assert.ok(button("送出留言").disabled);
  await act(async () =>
    finish(Response.json({ user, notificationEmail: "reader@example.com" })),
  );
  assert.equal(button("送出留言").disabled, false);
  await click(button("送出留言"));
  assert.equal(f.posts[0].authorization, "Bearer saved-session");
  assert.equal(
    f.posts[0].payload.email,
    "",
    "verified email does not opt in automatically",
  );
});

test("temporary identity failure preserves login and draft until an explicit anonymous choice", async (t) => {
  const f = await fixture(t, {
    session: "saved-session",
    me: () => {
      throw new TypeError("offline");
    },
  });
  await input("comment-body", "不要默默換身分");
  assert.ok(button("送出留言").disabled);
  assert.equal(
    sessionStorage.getItem("hawks:comments-session"),
    "saved-session",
  );
  await click(button("改用匿名"));
  assert.equal(document.getElementById("comment-body").value, "不要默默換身分");
  await click(button("送出留言"));
  assert.equal(f.posts[0].authorization, undefined);
  assert.equal(sessionStorage.getItem("hawks:comments-session"), null);
});

test("logout clears notification opt-in and email while preserving the comment", async (t) => {
  const f = await fixture(t, { session: "saved-session" });
  await input("comment-body", "切換匿名仍保留內容");
  await click(document.getElementById("comment-subscribe"));
  await input("comment-email", "other@example.com");
  await click(button("登出，改用匿名"));
  assert.equal(document.getElementById("comment-subscribe").checked, false);
  assert.equal(document.getElementById("comment-email"), null);
  await click(button("送出留言"));
  assert.equal(f.posts[0].payload.email, "");
  assert.equal(f.posts[0].authorization, undefined);
});

test("a timed-out reply survives remount and retries with the same request ID", async (t) => {
  let fail = true;
  const f = await fixture(t, {
    send: (payload) => {
      if (fail) throw new TypeError("response lost");
      return Response.json({ message: { ...rootMessage, ...payload, id: 2 } });
    },
  });
  await click(button("回覆"));
  await input("comment-body", "不重複的回覆");
  await click(button("送出回覆"));
  assert.match(document.body.textContent, /內容已保留/);
  const saved = sessionStorage.getItem("hawks:comment-draft:/blog/test/");
  assert.ok(!saved.includes("saved-session"));
  assert.ok(!saved.includes("authorization"));
  await f.unmount();
  await f.mount();
  assert.equal(document.getElementById("comment-body").value, "不重複的回覆");
  assert.match(document.body.textContent, /回覆 讀者/);
  fail = false;
  await click(button("送出回覆"));
  assert.equal(f.posts[0].payload.requestId, f.posts[1].payload.requestId);
  assert.equal(f.posts[1].payload.replyTo, 1);
  assert.equal(sessionStorage.getItem("hawks:comment-draft:/blog/test/"), null);
  assert.equal(document.querySelectorAll("#comment-2").length, 1);
});

test("malformed drafts cannot restore an invalid reply target or oversized content", () => {
  assert.equal(readCommentDraft("{"), null);
  assert.equal(
    readCommentDraft(JSON.stringify({ body: "x".repeat(2001), replyTo: null })),
    null,
  );
  assert.equal(
    readCommentDraft(
      JSON.stringify({
        body: "draft",
        replyTo: { id: -1, name: "x", body: "x" },
      }),
    ),
    null,
  );
  assert.deepEqual(
    readCommentDraft(
      JSON.stringify({
        body: "draft",
        replyTo: null,
        attempt: { id: "invalid", fingerprint: "invalid" },
      }),
    ),
    {
      name: "",
      body: "draft",
      email: null,
      subscribe: false,
      replyTo: null,
      attempt: null,
    },
  );
});

test("retrying a subscribed draft restores nickname and explicit notification choice", async (t) => {
  let fail = true;
  const f = await fixture(t, {
    send: (payload) => {
      if (fail) throw new TypeError("response lost");
      return Response.json({ message: { ...rootMessage, ...payload, id: 2 } });
    },
  });
  await input("comment-name", "我的暱稱");
  await input("comment-body", "訂閱與留言都保留");
  await click(document.getElementById("comment-subscribe"));
  await input("comment-email", "reader@example.com");
  await click(button("送出留言"));
  await f.unmount();
  await f.mount();
  assert.equal(document.getElementById("comment-name").value, "我的暱稱");
  assert.equal(document.getElementById("comment-subscribe").checked, true);
  assert.equal(
    document.getElementById("comment-email").value,
    "reader@example.com",
  );
  fail = false;
  await click(button("送出留言"));
  assert.deepEqual(f.posts[1].payload, f.posts[0].payload);
});

test("retrying a temporary identity outage restores the saved account without clearing the draft", async (t) => {
  let offline = true;
  const f = await fixture(t, {
    session: "saved-session",
    me: () => {
      if (offline) throw new TypeError("offline");
      return Response.json({ user, notificationEmail: "reader@example.com" });
    },
  });
  await input("comment-body", "網路恢復後送出");
  offline = false;
  await click(button("重試"));
  assert.equal(document.getElementById("comment-body").value, "網路恢復後送出");
  await click(button("送出留言"));
  assert.equal(f.posts[0].authorization, "Bearer saved-session");
});
