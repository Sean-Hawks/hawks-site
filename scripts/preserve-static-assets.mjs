import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

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

function staticPathToOutputPath(staticPath) {
  const cleanPath = staticPath.replace(/\\+$/g, "");
  return path.join(outDir, decodeURIComponent(cleanPath.replace(/^\//, "")));
}

function extractStaticPaths(html) {
  return new Set(
    [...html.matchAll(/\/_next\/static\/[^"' <>)]+/g)].map((match) =>
      match[0].replace(/\\+$/g, ""),
    ),
  );
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.text();
}

async function collectPageUrls(siteOrigin) {
  const urls = new Set([`${siteOrigin}/`]);

  try {
    const sitemap = await fetchText(`${siteOrigin}/sitemap.xml`);
    for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      urls.add(match[1]);
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

  for (const staticPath of staticPaths) {
    const outputPath = staticPathToOutputPath(staticPath);
    if (existsSync(outputPath)) continue;

    const assetUrl = `${normalizedOrigin}${staticPath}`;

    try {
      const response = await fetch(assetUrl);
      if (!response.ok) {
        console.warn(`Skipping ${assetUrl}: ${response.status} ${response.statusText}`);
        continue;
      }

      const bytes = Buffer.from(await response.arrayBuffer());
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
