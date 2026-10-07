export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function html(res, title, content) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  });
  res.end(
    `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font:18px/1.8 system-ui;background:#09121b;color:#e7edf5;max-width:650px;padding:40px 24px;margin:auto}button,a{color:#8edaff}button{background:#152535;border:1px solid #8edaff;padding:12px 24px;font:inherit;cursor:pointer}</style><h1>${title}</h1>${content}</html>`,
  );
}
