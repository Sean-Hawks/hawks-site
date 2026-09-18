import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { staticAssetPath, sameOriginPage, fetchBounded } from "./static-assets.mjs";

const outDir = path.join(process.cwd(), "out");
const legacyDir = path.join(process.cwd(), "legacy-static");
const origin =
  process.env.PRESERVE_LIVE_STATIC_ORIGIN || process.argv[2] || "";

function copyDirectory(fromDir, toDir) {
  if (!existsSync(fromDir)) return 0;

  let copied = 0;

  for (const entry of readdirSync(fromDir)) {
    const fromPath = path.join(fromDir, entry);
    const toPath = path.join(toDir, entry);

    if (statSync(fromPath).isDirectory()) {
      copied += copyDirectory(fromPath, toPath);
      continue;
    }

    mkdirSync(path.dirname(toPath), { recursive: true });
    copyFileSync(fromPath, toPath);
    copied += 1;
  }

  return copied;
}

function extractStaticPaths(html) {
  return new Set(
    [...html.matchAll(/\/_next\/static\/[^"' <>)]+/g)].map((match) =>
      match[0].replace(/\\+$/g, ""),
    ),
  );
}

async function fetchText(url) {
  return (await fetchBounded(url, 4 * 1024 * 1024)).toString("utf8");
}

async function collectPageUrls(siteOrigin) {
  const urls = new Set([`${siteOrigin}/`]);

  try {
    const sitemap = await fetchText(`${siteOrigin}/sitemap.xml`);
    for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const pageUrl = sameOriginPage(match[1], siteOrigin);
      if (pageUrl) urls.add(pageUrl);
    }
  } catch (error) {
    console.warn(`Could not read sitemap for static asset preservation: ${error.message}`);
  }

  return [...urls].slice(0, 120);
}

async function preserveLiveStaticAssets(siteOrigin) {
  if (!siteOrigin) return { discovered: 0, downloaded: 0 };

  const normalizedOrigin = siteOrigin.replace(/\/+$/g, "");
  const pageUrls = await collectPageUrls(normalizedOrigin);
  const staticPaths = new Set();

  for (const pageUrl of pageUrls) {
    try {
      const html = await fetchText(pageUrl);
      for (const staticPath of extractStaticPaths(html)) {
        staticPaths.add(staticPath);
      }
    } catch (error) {
      console.warn(`Could not inspect ${pageUrl}: ${error.message}`);
    }
  }

  let downloaded = 0;

  for (const staticPath of [...staticPaths].slice(0, 500)) {
    const outputPath = staticAssetPath(staticPath, outDir);
    if (!outputPath || existsSync(outputPath)) continue;

    const assetUrl = `${normalizedOrigin}${staticPath}`;

    try {
      const bytes = await fetchBounded(assetUrl, 8 * 1024 * 1024);
      mkdirSync(path.dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, bytes);
      downloaded += 1;
    } catch (error) {
      console.warn(`Could not preserve ${assetUrl}: ${error.message}`);
    }
  }

  return { discovered: staticPaths.size, downloaded };
}

if (existsSync(outDir)) {
  const copied = copyDirectory(legacyDir, outDir);
  const { discovered, downloaded } = await preserveLiveStaticAssets(origin);

  if (copied || discovered || downloaded) {
    console.log(
      `Preserved static assets: ${copied} legacy copied, ${downloaded}/${discovered} live downloaded.`,
    );
  }
}
