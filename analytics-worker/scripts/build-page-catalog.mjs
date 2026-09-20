// Reuse the site's published-content rules and title/slug normalization.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root=fileURLToPath(new URL('../../',import.meta.url));
function load(url) {
  const compiled=ts.transpileModule(fs.readFileSync(url,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  const exports={}, require=createRequire(url);
  vm.runInNewContext(compiled,{exports,process:{cwd:()=>root},require:id=>id.startsWith('.')?load(new URL(`${id}.ts`,url)):require(id)});
  return exports;
}
const {getReadingCatalog}=load(new URL('../../app/lib/reading-catalog.ts',import.meta.url));
const catalog=Object.fromEntries(getReadingCatalog().map(({href,title,kind})=>[href,{title,kind}]));
for(const [href,title] of Object.entries({'/':'首頁','/blog/':'文章列表','/talk/':'近況列表','/library/':'收藏書架','/explore/':'探索','/project/':'專案','/search/':'搜尋','/subscribe/':'訂閱','/contact/':'聯絡','/timeline/':'時間軸','/reading-list/':'稍後閱讀'}))catalog[href]={title,kind:'導覽'};
for(const [category,title] of Object.entries({anime:'動畫',game:'遊戲',movie:'電影',music:'音樂',book:'書籍'}))catalog[`/library/${category}/`]={title:`${title}收藏`,kind:'導覽'};
fs.writeFileSync(path.join(root,'analytics-worker/public/page-catalog.js'),'// Generated from public site content by scripts/build-page-catalog.mjs.\nexport const pageCatalog = '+JSON.stringify(catalog,null,2)+';\n');
console.log(`Generated ${Object.keys(catalog).length} public page titles.`);
