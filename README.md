# Hawks Site

Hawks 的個人網站、Blog 與近況紀錄。整體視覺以 Discord profile 的深色介面為起點，延伸成更適合閱讀與往下瀏覽的個人站。

網站內容以 Markdown 管理，適合搭配 Obsidian 寫草稿，再發布到 `content/posts/` 或 `content/talks/`。

## Features

- Scroll-first homepage with profile, latest blog posts, now updates, and projects
- Markdown blog with frontmatter metadata
- URL-safe blog slugs, including optional custom `slug`
- Tag index and tag archive pages sorted by usage count
- Talk / Now archive for shorter updates and sharing notes
- Full-site search across posts, talks, tags, and excerpts
- Blog / Talk related-content links
- Guestbook entry point powered by GitHub issue templates
- RSS feed at `/rss.xml`
- Static Open Graph images generated into `public/og/`
- Light / dark theme toggle, defaulting to dark mode
- Static export for GitHub Pages

## Tech Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Markdown content powered by `gray-matter`, `react-markdown`, `remark-gfm`, and `remark-directive`
- GitHub Pages deployment through GitHub Actions

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
```

Run the Next.js development server.

```bash
npm run lint
```

Run ESLint.

```bash
npm run build
```

Build the static site export.

```bash
npm run og
```

Generate Open Graph images into `public/og/`.

## Content Workflow

### Blog Posts

Published blog posts live in `content/posts/`.

Example:

```yaml
---
title: "文章標題"
date: "2026-06-16"
desc: "一句話說完這篇文章在講什麼"
slug: "optional-custom-slug"
tags:
  - "#blog"
  - "#web"
relatedTalks:
  - "0223"
ogImage: ""
status: published
---
```

Notes:

- `slug` is optional. If omitted, the filename is slugified.
- `tags` are the main index system. More frequently used tags appear earlier on `/tags/`.
- `status: draft` and `status: private` are excluded from public pages.
- Old posts without `status` are treated as public.

### Talks / Now

Shorter updates live in `content/talks/`.

Example:

```yaml
---
title: "雜談"
date: "2026-06-16"
event: ""
banner: ""
slides: ""
video: ""
relatedPosts:
  - "first-web"
ogImage: ""
status: published
---
```

The `/now/` page is generated from recent posts, recent talks, and projects, so it does not need separate status text.

## Project Structure

```text
app/
  blog/          Blog list, detail pages, and tag archive routes
  components/    Shared UI components
  data/          Small static data sets
  guestbook/     Guestbook page
  lib/           Content loaders, search, related-content helpers
  now/           Now page
  project/       Projects page
  rss.xml/       RSS route
  search/        Search page
  tags/          Tag index page
  talk/          Talk archive and detail pages
content/
  posts/         Published blog posts
  talks/         Talk / now archive entries
  templates/     Obsidian-friendly content templates
docs/            Writing and publishing workflow notes
public/
  images/        Static images
  og/            Generated Open Graph images
scripts/
  generate-og-images.mjs
```

## Obsidian Workflow

This repo includes templates and a publishing workflow for writing in Obsidian:

- Start loose long-form notes in `Inbox/`
- Open Daily Notes directly as Now / Talk drafts in `content/talks/`
- Move stronger ideas into `Drafts/`
- Publish final posts into `content/posts/`
- Publish shorter updates by changing `status: draft` to `status: published`

See [docs/OBSIDIAN_WORKFLOW.md](docs/OBSIDIAN_WORKFLOW.md) for the full workflow.

## Deployment

The site is configured for static export and GitHub Pages. Pushing to `main` triggers the GitHub Actions Pages workflow.

Before pushing, run:

```bash
npm run lint
npm run build
```

If content changed, regenerate OG images:

```bash
npm run og
```
