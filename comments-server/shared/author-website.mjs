/**
 * Shared by the form and API. This module is browser-safe and performs no I/O.
 * @param {unknown} input
 * @returns {{ value: string, error: string }}
 */
export function normalizeAuthorWebsite(input) {
  const invalid = {
    value: "",
    error: "請填寫有效的 http:// 或 https:// 網址。",
  };
  if (input === undefined || input === null || input === "")
    return { value: "", error: "" };
  if (typeof input !== "string") return invalid;
  const value = input.trim();
  if (!value) return { value: "", error: "" };
  if (value.length > 300 || /[\u0000-\u0020\u007f]/.test(value)) return invalid;
  try {
    // A bare domain is a useful shortcut, but an explicit scheme is never rewritten.
    const url = new URL(
      /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`,
    );
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !url.hostname.includes(".") ||
      url.href.length > 300
    )
      return invalid;
    return { value: url.href, error: "" };
  } catch {
    return invalid;
  }
}
