# Obsidian Publishing Workflow

這個站的內容來源是 Markdown。平常可以先在 Obsidian 寫，最後把要公開的文章放進 `content/posts/`，Talk/分享紀錄放進 `content/talks/`。

## 建議資料夾

- `Inbox/`: 隨手記，不一定會公開。
- `Notes/`: 長期筆記，整理想法用。
- `Drafts/`: 已經開始寫成文章，但還沒準備發布。
- `Journal/`: 私人日記或不想公開的 daily note 備用區。
- `content/posts/`: 會被網站讀取的 Blog 文章。
- `content/talks/`: 會被網站讀取的 Talk / Now archive。Daily Notes 也會直接建立在這裡。

## 我幫你設定好的 Obsidian 行為

- 新檔案預設會放進 `Inbox/`。
- Daily Notes 會放進 `content/talks/YYYY-MM-DD.md`。
- Daily Notes 會套用 `content/templates/daily-note.md`。
- Templates 插件的模板資料夾是 `content/templates/`。
- 附件預設放在 `public/images/`，方便之後文章引用圖片。

`.obsidian/` 目前在 `.gitignore` 裡，所以這些是本機 Obsidian 使用習慣設定，不會影響網站部署。

## 發文章流程

1. 平常先在 `Inbox/` 寫長想法；如果是短近況，直接開 Daily note 寫進 `content/talks/`。
2. 有一段想法長出來後，移到 `Drafts/`，用 `content/templates/blog-draft-template.md`。
3. 先填 `title`、`date`、`desc`。
4. 加 `tags`，用來做 `/blog/tag/...` 索引。
5. 寫完後移到 `content/posts/`，把 `status: draft` 改成 `status: published`。
6. 跑 `npm run lint` 和 `npm run build` 確認沒有壞。

如果你已經確定一開始就是正式文章，也可以直接用 `content/templates/post-template.md` 建立。

## 每日 Now 習慣

每天只要做這個就好：

1. 開 Obsidian 的 Daily note。
2. 直接在 frontmatter 下方寫今天想公開成 Now 的內容。
3. 寫完想發布，就把 `status: draft` 改成 `status: published`。
4. 還沒想公開就維持 `status: draft`。

週末或有空時再做：

1. 從 `content/talks/` 或 `Inbox/` 挑一段有意思的東西。
2. 移到 `Drafts/`。
3. 補成一篇有標題、有開頭、有結尾的文章。

## Frontmatter

文章最小格式：

```yaml
---
title: "文章標題"
date: "2026-06-16"
desc: "一句話說完這篇在講什麼"
tags:
  - "#blog"
  - "#web"
relatedTalks:
  - "0223"
ogImage: ""
status: draft
---
```

發布時改成：

```yaml
status: published
```

網站會自動排除 `status: draft` 和 `status: private`。沒有寫 `status` 的舊文章會視為公開。

## Blog / Talk 互相連結

文章可以手動指定相關 Talk：

```yaml
relatedTalks:
  - "0223"
  - "1230"
```

Talk 可以手動指定相關文章：

```yaml
relatedPosts:
  - "first-web"
```

如果沒填，網站會用標題、tag 和內文做簡單自動比對。但正式文章建議手動填，結果比較穩。

## Open Graph

分享預覽圖會放在 `public/og/`。更新文章或 Talk 後可以跑：

```bash
npm run og
```

這會自動產生：

- `public/og/default.png`
- `public/og/blog-<slug>.png`
- `public/og/talk-<id>.png`

如果某篇想使用自訂 OG 圖，可以在 frontmatter 填：

```yaml
ogImage: "/og/my-custom-image.png"
```

沒填的話會使用自動產生的圖片。

## Tags

`tags` 是這個站的主要索引，適合很多、短、可搜尋。使用越多次的 tag 會在 `/tags/` 越靠前。

```yaml
tags:
  - "#blog"
  - "#web"
  - "#personal-site"
```

建議每篇文章至少放：

- `#blog`
- 一個內容類型，例如 `#diary`、`#notes`、`#talk`
- 一到三個主題，例如 `#web`、`#SITCON`、`#music`

## Now Page

`/now/` 不需要另外維護狀態文字。它會自動抓最新文章、最新 Talk archive 和 Projects。

現在 Obsidian 的 Daily Note 會直接建立一篇 Talk / Now 草稿：

```text
content/talks/YYYY-MM-DD.md
```

預設是：

```yaml
status: draft
```

寫完要出現在 `/now/` 時改成：

```yaml
status: published
```

想讓某篇文章比較像近況，可以加 tag：

```yaml
tags:
  - "#diary"
  - "#now"
```

但不是每篇都需要。平常只要把文章或 Talk 發布出去，Now 頁就會自然更新。

## 建議寫作節奏

平常不用一開始就寫成文章。比較舒服的流程是：

1. `Inbox`: 先亂寫，把想法留下來。
2. `Notes`: 事後整理成比較清楚的觀點或段落。
3. `Drafts`: 有 70% 成形時才套文章模板。
4. `content/posts`: 確定要公開再搬進網站內容資料夾。
5. 發布後再補 tag 和 desc，讓讀者比較好找。
