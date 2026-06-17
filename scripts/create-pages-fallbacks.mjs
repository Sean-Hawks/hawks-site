import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "out");

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath);
    }
  }

  const indexPath = path.join(dir, "index.html");
  if (dir === outDir || !existsSync(indexPath)) return;

  const relativeDir = path.relative(outDir, dir);
  const htmlFallback = path.join(outDir, `${relativeDir}.html`);

  mkdirSync(path.dirname(htmlFallback), { recursive: true });
  copyFileSync(indexPath, htmlFallback);
}

if (existsSync(outDir)) {
  walk(outDir);
}
