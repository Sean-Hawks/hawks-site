import { commentsApiOrigin } from "./comments-client";

// Public build configuration only; the Turnstile secret and admin token stay on WSL.
export const commentsConfig = {
  apiOrigin: commentsApiOrigin(process.env.NEXT_PUBLIC_COMMENTS_API_URL),
  siteKey: process.env.NEXT_PUBLIC_COMMENTS_TURNSTILE_SITE_KEY || "",
};
