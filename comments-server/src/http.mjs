export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

export function html(res, title, content, status = 200) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    // no-referrer makes native form POSTs send Origin: null (Fetch standard).
    // Keep same-origin forms verifiable while hiding referrers on external links.
    "Referrer-Policy": "same-origin",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  });
  res.end(
    `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} · Hawks</title><style>body{font:16px/1.8 system-ui;background:#09121b;color:#e7edf5;max-width:650px;padding:48px 24px;margin:auto}main{border:1px solid #283b4b;padding:24px}h1{font-size:1.6rem;line-height:1.4}button,a{color:#8edaff}button{background:#152535;border:1px solid #8edaff;padding:12px 24px;font:inherit;cursor:pointer}a{display:inline-block;min-height:44px}button:focus-visible,a:focus-visible{outline:2px solid #8edaff;outline-offset:4px}</style></head><body><main><h1>${escapeHtml(title)}</h1>${content}</main></body></html>`,
  );
}
