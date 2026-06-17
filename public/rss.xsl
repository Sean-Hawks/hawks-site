<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html lang="zh-TW">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="/rss/channel/title" /> RSS Feed</title>
        <style>
          :root {
            color-scheme: dark;
            --bg: #111114;
            --panel: #191a1f;
            --panel2: #202127;
            --text: #f3eee8;
            --muted: #a7a09a;
            --line: rgba(255, 255, 255, 0.1);
            --accent: #f7c84f;
            --purple: #a78bfa;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background:
              linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              var(--bg);
            background-size: 32px 32px;
            color: var(--text);
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          a {
            color: inherit;
            text-decoration: none;
          }

          .shell {
            max-width: 960px;
            margin: 0 auto;
            padding: 28px 18px 56px;
          }

          .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 28px;
          }

          .brand {
            font-size: 24px;
            font-weight: 850;
            letter-spacing: 0.01em;
          }

          .nav {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }

          .nav a,
          .button {
            border: 1px solid var(--line);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.04);
            padding: 10px 12px;
            color: var(--muted);
            font-size: 14px;
            transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
          }

          .nav a:hover,
          .button:hover {
            border-color: rgba(247, 200, 79, 0.34);
            background: rgba(247, 200, 79, 0.09);
            color: var(--text);
          }

          .hero {
            border: 1px solid var(--line);
            border-radius: 18px;
            background: rgba(25, 26, 31, 0.86);
            padding: 28px;
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
          }

          .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 14px;
            color: var(--accent);
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            font-size: clamp(32px, 7vw, 56px);
            line-height: 1.02;
            letter-spacing: 0;
          }

          .hero p {
            max-width: 680px;
            margin: 16px 0 0;
            color: var(--muted);
            line-height: 1.8;
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 22px;
          }

          .button.primary {
            background: rgba(247, 200, 79, 0.12);
            border-color: rgba(247, 200, 79, 0.28);
            color: var(--text);
            font-weight: 750;
          }

          .feed-url {
            margin-top: 18px;
            display: inline-flex;
            max-width: 100%;
            border: 1px solid var(--line);
            border-radius: 10px;
            background: rgba(255, 255, 255, 0.035);
            padding: 10px 12px;
            color: var(--muted);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 13px;
            overflow-wrap: anywhere;
          }

          .items {
            margin-top: 22px;
            display: grid;
            gap: 12px;
          }

          .item {
            display: block;
            border: 1px solid var(--line);
            border-radius: 14px;
            background: rgba(25, 26, 31, 0.72);
            padding: 18px;
            transition: border-color 160ms ease, background 160ms ease;
          }

          .item:hover {
            border-color: rgba(247, 200, 79, 0.28);
            background: rgba(32, 33, 39, 0.88);
          }

          .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            margin-bottom: 8px;
            color: var(--muted);
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .pill {
            border: 1px solid rgba(247, 200, 79, 0.2);
            border-radius: 999px;
            background: rgba(247, 200, 79, 0.08);
            padding: 4px 8px;
            color: var(--accent);
            font-size: 11px;
            font-weight: 750;
          }

          .item h2 {
            margin: 0;
            font-size: 18px;
            line-height: 1.45;
          }

          .item p {
            margin: 8px 0 0;
            color: var(--muted);
            font-size: 14px;
            line-height: 1.75;
          }

          .note {
            margin: 20px 0 0;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.7;
          }

          @media (max-width: 640px) {
            .top {
              align-items: flex-start;
              flex-direction: column;
            }

            .hero {
              padding: 22px;
            }
          }
        </style>
      </head>
      <body>
        <main class="shell">
          <div class="top">
            <a class="brand" href="/">hawks.tw</a>
            <nav class="nav" aria-label="RSS navigation">
              <a href="/">README</a>
              <a href="/subscribe/">Subscribe</a>
              <a href="/blog/">Blog</a>
            </nav>
          </div>

          <section class="hero">
            <div class="eyebrow">RSS Feed</div>
            <h1>Subscribe to hawks.tw</h1>
            <p>
              這是一個給 RSS reader 讀取的更新流。你可以把這個網址貼到 Feedly、Inoreader、
              NetNewsWire、Reeder、Thunderbird 或其他 RSS reader，之後就能收到 Blog、Talk 和 Library Review 的更新。
            </p>
            <div class="actions">
              <a class="button primary" href="/subscribe/">訂閱說明</a>
              <a class="button" href="/subscribe/">Email 訂閱</a>
            </div>
            <div class="feed-url">
              <xsl:value-of select="/rss/channel/atom:link/@href" />
            </div>
          </section>

          <section class="items" aria-label="Latest feed items">
            <xsl:for-each select="/rss/channel/item">
              <a class="item">
                <xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute>
                <div class="meta">
                  <span class="pill"><xsl:value-of select="category" /></span>
                  <span><xsl:value-of select="pubDate" /></span>
                </div>
                <h2><xsl:value-of select="title" /></h2>
                <p><xsl:value-of select="description" /></p>
              </a>
            </xsl:for-each>
          </section>

          <p class="note">
            RSS reader 會讀取這份 XML；瀏覽器看到的是加上樣式後的版本。真正訂閱時請使用
            <xsl:value-of select="/rss/channel/atom:link/@href" />。
          </p>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
