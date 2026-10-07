import test from "node:test";
import assert from "node:assert/strict";
import gateway from "../gateway/worker.mjs";

const origin = "https://hawks.tw";
function request(
  path = "/v1/comments/messages?page=%2Fblog%2Ftest%2F",
  init = {},
) {
  return new Request(`https://hawks-comments.sean-hawks.workers.dev${path}`, {
    ...init,
    headers: {
      Origin: origin,
      "CF-Connecting-IP": "203.0.113.7",
      ...init.headers,
    },
  });
}
const forbiddenBackend = {
  COMMENTS_BACKEND: {
    fetch() {
      assert.fail("must not reach WSL");
    },
  },
};

test("gateway forwards only the fixed service and trusted header set", async () => {
  let forwarded;
  const response = await gateway.fetch(
    request(undefined, {
      method: "POST",
      body: JSON.stringify({ body: "文章回覆" }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer private-admin",
        Cookie: "private-session",
        "X-Forwarded-For": "198.51.100.99",
        Host: "other.internal",
      },
    }),
    {
      COMMENTS_BACKEND: {
        async fetch(req) {
          forwarded = req;
          assert.deepEqual(await req.json(), { body: "文章回覆" });
          return new Response('{"message":{"id":42}}', {
            status: 201,
            headers: {
              "Access-Control-Allow-Origin": origin,
              "Cache-Control": "no-store",
            },
          });
        },
      },
    },
  );
  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(
    forwarded.url,
    "http://127.0.0.1:8790/v1/comments/messages?page=%2Fblog%2Ftest%2F",
  );
  assert.equal(forwarded.headers.get("CF-Connecting-IP"), "203.0.113.7");
  assert.deepEqual(
    [...forwarded.headers.keys()],
    ["cf-connecting-ip", "content-type", "origin"],
  );
  assert.equal(forwarded.redirect, "manual");
});

test("gateway blocks administrator operations and arbitrary internal routes", async () => {
  for (const path of [
    "/v1/comments/messages/42",
    "/admin",
    "//other.internal/",
  ]) {
    assert.equal(
      (await gateway.fetch(request(path), forbiddenBackend)).status,
      404,
    );
  }
  assert.equal(
    (
      await gateway.fetch(
        request(undefined, { method: "DELETE" }),
        forbiddenBackend,
      )
    ).status,
    405,
  );
  assert.equal(
    (
      await gateway.fetch(
        request("/healthz", { method: "POST" }),
        forbiddenBackend,
      )
    ).status,
    405,
  );
});

test("gateway rejects unrelated origins and does not grant CORS to them", async () => {
  const response = await gateway.fetch(
    request(undefined, { headers: { Origin: "https://other.example" } }),
    forbiddenBackend,
  );
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
});

test("preflight allows login sessions while administrator routes stay blocked", async () => {
  const response = await gateway.fetch(
    request(undefined, { method: "OPTIONS" }),
    forbiddenBackend,
  );
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(
    response.headers.get("Access-Control-Allow-Methods"),
    "GET, POST, OPTIONS",
  );
  assert.equal(
    response.headers.get("Access-Control-Allow-Headers"),
    "Content-Type, Authorization",
  );
});

test("gateway forwards application sessions but never administrator credentials", async () => {
  const token = `Bearer hcs_${"a".repeat(43)}`;
  for (const path of ["/v1/comments/messages", "/v1/comments/auth/me"]) {
    const response = await gateway.fetch(
      request(path, { headers: { Authorization: token } }),
      {
        COMMENTS_BACKEND: {
          fetch(req) {
            assert.equal(req.headers.get("Authorization"), token);
            return new Response("{}");
          },
        },
      },
    );
    assert.equal(response.status, 200);
  }
  await gateway.fetch(
    request("/v1/comments/auth/me", {
      headers: { Authorization: "Bearer admin-secret" },
    }),
    {
      COMMENTS_BACKEND: {
        fetch(req) {
          assert.equal(req.headers.get("Authorization"), null);
          return new Response("{}");
        },
      },
    },
  );
});

test("notification forms accept their own origin without widening comment CORS", async () => {
  const headers = {
    Origin: "https://hawks-comments.sean-hawks.workers.dev",
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const response = await gateway.fetch(
    request("/v1/comments/notifications/confirm?token=abc", {
      method: "POST",
      headers,
    }),
    {
      COMMENTS_BACKEND: {
        fetch(req) {
          assert.equal(req.method, "POST");
          return new Response("confirmed");
        },
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(
    (
      await gateway.fetch(
        request(undefined, { method: "POST", headers }),
        forbiddenBackend,
      )
    ).status,
    403,
  );
});

test("oversized bodies and missing connection identity fail before forwarding", async () => {
  assert.equal(
    (
      await gateway.fetch(
        request(undefined, {
          method: "POST",
          body: "x".repeat(12 * 1024 + 1),
        }),
        forbiddenBackend,
      )
    ).status,
    413,
  );
  const req = request();
  req.headers.delete("CF-Connecting-IP");
  assert.equal((await gateway.fetch(req, forbiddenBackend)).status, 403);
});

test("offline WSL returns a readable noncached error with website CORS", async () => {
  const response = await gateway.fetch(request(), {
    COMMENTS_BACKEND: {
      fetch() {
        throw new Error("private tunnel details");
      },
    },
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), {
    error: "留言服務暫時無法連線，請稍後再試。",
  });
});

test("gateway does not follow or expose origin redirects", async () => {
  const response = await gateway.fetch(request(), {
    COMMENTS_BACKEND: {
      fetch() {
        return new Response(null, {
          status: 302,
          headers: { Location: "http://other.internal/" },
        });
      },
    },
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Location"), null);
});
