import { pageCatalog } from './page-catalog.js';
import { calendarRows, periodSummary, estimateViews, weeklyComparison, popularRows } from './report.js';
/* This page deliberately keeps its credential in memory only. */
const byId = id => document.getElementById(id);
const number = n => new Intl.NumberFormat('zh-TW').format(n);
let token = '', report = null, detail = null, detailRequest = 0, reportRequest = 0;
const errors = { unauthorized:'金鑰不正確，請重新輸入。', rate_limited:'請求較頻繁，請稍候一分鐘再試。', archive_unavailable:'目前無法讀取歸檔，請稍後再試。', invalid_range:'請檢查起訖日期。', day_not_archived:'這一天尚未歸檔。', not_configured:'報表尚未完成設定。', archive_source_mismatch:'歸檔來源設定不一致，請先檢查設定。' };
function message(text) { byId('message').textContent = text; }
async function api(path) {
  const response = await fetch(path, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', credentials: 'omit' });
  const data = await response.json();
  if (!response.ok) throw new Error(errors[data.error] || '暫時無法取得資料，請稍後再試。');
  return data;
}
function cell(row, text) { const td = document.createElement('td'); td.textContent = text; row.append(td); }
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function svgNode(name, attributes = {}, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
function chart(rows) {
  byId('chart').replaceChildren();
  if (!rows.some(row => row.saved === row.expected)) {
    const note = document.createElement('p'); note.className='hint'; note.textContent='尚無完整紀錄可繪製，請在下表查看已保存的數值。'; byId('chart').append(note); return;
  }
  const width = Math.max(280, byId('chart').clientWidth), left = 48, right = width - 12;
  const svg = svgNode('svg', { viewBox:`0 0 ${width} 260` });
  const max = Math.max(1, ...rows.filter(row => row.saved === row.expected).map(row => row.pageviews));
  const xAt = index => rows.length === 1 ? (left + right) / 2 : left + index / (rows.length - 1) * (right-left);
  for (let i = 0; i <= 3; i++) {
    const y = 216 - i * 64;
    svg.append(svgNode('line', { x1:left, x2:right, y1:y, y2:y }));
    svg.append(svgNode('text', { x:44, y:y+4, 'text-anchor':'end' }, number(Math.round(max*i/3))));
  }
  let points = [];
  const line = () => { if (!points.length) return; svg.append(svgNode('polyline', { points:points.join(' ') })); points=[]; };
  rows.forEach((row, index) => {
    if (row.saved !== row.expected) { line(); return; }
    const x = xAt(index), y = 216 - row.pageviews / max * 192;
    points.push(`${x},${y}`);
    const dot = svgNode('circle', { cx:x, cy:y, r:rows.length > 100 ? 2 : 3 });
    dot.append(svgNode('title', {}, `${row.key}：${number(row.pageviews)} 次瀏覽${row.sampled ? '（含抽樣估計）' : ''}`)); svg.append(dot);
  });
  line();
  const labels = [...new Set(width < 500 ? [0, rows.length-1] : [0, Math.floor((rows.length-1)/2), rows.length-1])];
  for (const i of labels) svg.append(svgNode('text', { x:xAt(i), y:247, 'text-anchor':i===0?'start':i===rows.length-1?'end':'middle' }, rows[i].key));
  byId('chart').append(svg);
}
function renderTrend() {
  if (!report) return;
  const mode = byId('granularity').value;
  const rows = calendarRows(report, mode);
  byId('trend-title').textContent = mode === 'day' ? '每日瀏覽趨勢' : '每月瀏覽趨勢';
  byId('table-caption').textContent = mode === 'day' ? '每日統計' : '每月統計（僅計所選日期範圍）';
  byId('chart-note').textContent = mode === 'day' ? '缺少紀錄的日期以斷線呈現，不視為零瀏覽。完整數值可在下方展開。' : '月份只加總所選日期，不一定是整月；缺日月份以斷線呈現。';
  chart(rows); byId('months').replaceChildren();
  for (const item of [...rows].reverse()) {
    const row=document.createElement('tr'); cell(row,item.key); cell(row,item.saved?number(item.pageviews):'—'); cell(row,item.saved?number(item.visits):'—'); cell(row,`${item.saved} / ${item.expected}`); byId('months').append(row);
  }
}
function renderEstimate() {
  if (!report) return;
  const missed = Number(byId('missed').value), estimate = estimateViews(report.total.pageviews, missed);
  byId('missed-label').textContent = `${missed}%`;
  byId('estimate').textContent = report.days.length && estimate !== null ? number(estimate) : '—';
  byId('estimate-formula').textContent = `${number(report.total.pageviews)} ÷ ${(1-missed/100).toFixed(2)}；假設有 ${100-missed}% 的瀏覽被記錄。`;
  byId('estimate-coverage').textContent = report.missingDays ? `所選期間尚缺 ${report.missingDays} 天，僅試算已保存的 ${report.days.length} 天，不補猜缺日。` : `僅適用於 ${report.from} 至 ${report.to} 已保存的期間。`;
}
let popularLimit = 10;
function renderPopular() {
  if (!report) return;
  const pages = report.popularPages || {rows:[],total:0,count:0};
  const rows = popularRows(pages.rows,pageCatalog,byId('page-search').value,byId('content-only').checked);
  const visible=rows.slice(0,popularLimit), maximum=Math.max(1,...rows.map(row=>row.pageviews));
  byId('popular-note').textContent=`${report.from} — ${report.to} · 已保存 ${report.days.length} 天${report.missingDays ? `，尚缺 ${report.missingDays} 天` : ''} · 同頁面的結尾斜線已合併。`;
  byId('popular-status').textContent=rows.length ? `顯示 ${visible.length} / ${rows.length} 個頁面${pages.count>pages.rows.length ? `（僅載入瀏覽最多的 ${pages.rows.length} 個，共 ${pages.count} 個頁面）` : ''}` : pages.rows.length ? '沒有符合條件的頁面，試試其他名稱或取消篩選。' : '這段期間尚無頁面瀏覽紀錄。';
  byId('popular-list').replaceChildren();
  for (const [index,item] of visible.entries()) {
    const li=document.createElement('li');
    const rank=document.createElement('span');rank.className='page-rank';rank.textContent=String(index+1).padStart(2,'0');rank.setAttribute('aria-hidden','true');
    const main=document.createElement('div');main.className='rank-content';
    const heading=document.createElement('div');heading.className='rank-heading';
    const title=document.createElement(item.href?'a':'span');title.textContent=item.title;
    if(item.href){title.href=item.href;title.target='_blank';title.rel='noopener noreferrer';title.setAttribute('aria-label',`${item.title}（開新分頁）`);}
    const count=document.createElement('strong');count.textContent=`${number(item.pageviews)} 次`;
    heading.append(title,count);
    const info=document.createElement('div');info.className='rank-meta';
    const path=document.createElement('span');path.textContent=`${item.kind} · ${item.key}`;
    const share=document.createElement('span');const percentage=pages.total?item.pageviews/pages.total*100:0;share.textContent=percentage>0 && percentage<0.1 ? '<0.1%' : `${percentage.toFixed(1)}%`;
    info.append(path,share);
    const bar=svgNode('svg',{viewBox:'0 0 1000 5',preserveAspectRatio:'none','aria-hidden':'true',class:'rank-bar'});
    bar.append(svgNode('rect',{width:1000,height:5,class:'rank-track'}),svgNode('rect',{width:Math.round(item.pageviews/maximum*1000),height:5,class:'rank-fill'}));
    main.append(heading,info,bar);li.append(rank,main);byId('popular-list').append(li);
  }
  byId('popular-more').hidden=visible.length>=rows.length;
}
function render(data) {
  report = data;
  byId('from').value = data.from; byId('to').value = data.to;
  byId('pageviews').textContent = number(data.total.pageviews);
  byId('visits').textContent = number(data.total.visits);
  const { average, peak } = periodSummary(data);
  byId('average').textContent = average === null ? '—' : number(Math.round(average * 10) / 10);
  byId('average-note').textContent = `依已保存的 ${data.days.length} 天計算${data.missingDays ? '，不含缺日' : ''}`;
  byId('peak').textContent = peak ? number(peak.pageviews) : '—';
  byId('peak-note').textContent = peak ? `${peak.day}${data.missingDays ? ' · 已保存部分' : ''}` : '所選期間尚無紀錄';
  const comparison = weeklyComparison(data);
  byId('comparison').textContent = comparison ? `區間最後 7 天 ${number(comparison.current)} 次瀏覽，前 7 天 ${number(comparison.previous)} 次${comparison.change === null ? '；前期為零，不計算成長率。' : `，${comparison.change >= 0 ? '增加' : '減少'} ${number(Math.abs(Math.round(comparison.change * 10) / 10))}%。`}` : '累積連續 14 天完整紀錄後，可比較區間最後兩週的變化。';
  byId('coverage').textContent = `${data.from} — ${data.to} · 台灣時間 · ${data.missingDays ? `缺少 ${data.missingDays} 天，總數為已保存部分` : '所選期間已完整歸檔'} · ${data.sampledDays} 天包含抽樣估計。`;
  const warnings = [];
  if (!data.scheduleConfigured) warnings.push('自動歸檔尚未啟用，需要設定 Cloudflare 統計讀取權杖。');
  if (data.status?.last_error) warnings.push('最近一次歸檔失敗，既有資料仍保留。');
  if (data.scheduleConfigured && (!data.status?.last_success || Date.now()-Date.parse(data.status.last_success)>48*3600000)) warnings.push('超過 48 小時未確認歸檔成功，請檢查排程。');
  byId('sync').classList.toggle('warning', warnings.length > 0);
  byId('sync').textContent = warnings.join(' ') || (data.status?.last_success ? `最近歸檔成功：${new Date(data.status.last_success).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})} · 每天 04:00 更新` : '尚未有成功歸檔紀錄。');
  byId('granularity').value = data.expectedDays > 400 ? 'month' : 'day';
  popularLimit=10; renderPopular(); renderTrend(); renderEstimate();
  byId('detail-day').replaceChildren();
  for (const day of [...data.days].reverse()) { const option=document.createElement('option'); option.value=day.day; option.textContent=day.day; byId('detail-day').append(option); }
  byId('export').disabled = !data.days.length;
}
async function loadDetail() {
  const sequence = ++detailRequest;
  detail=null; byId('export-day').disabled=true; byId('pages').replaceChildren(); byId('sources').replaceChildren();
  const day = byId('detail-day').value;
  if (!day) { byId('detail-note').textContent='所選區間尚無每日明細。'; return; }
  byId('detail-note').textContent='正在讀取每日明細…';
  try {
    const data = await api(`/api/day?date=${encodeURIComponent(day)}`);
    if (sequence !== detailRequest) return;
    detail=data;
    byId('detail-note').textContent=`${day} · 抓取於 ${new Date(data.capturedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}。數值沿用 Cloudflare 的估計，不再乘上抽樣倍數。`;
    for (const kind of ['pages','sources']) {
      const metric=kind==='pages'?'pageviews':'visits';
      for (const item of [...data[kind]].sort((a,b)=>b[metric]-a[metric])) {
        const row=document.createElement('tr'); cell(row,item.key || (kind==='sources'?'直接造訪／未提供來源':'（空路徑）')); cell(row,number(item[metric])); byId(kind).append(row);
      }
    }
    byId('export-day').disabled=false;
  } catch(error) { if(sequence===detailRequest) byId('detail-note').textContent=error.message; }
}
async function load(from='',to='') {
  const sequence = ++reportRequest;
  detailRequest++; detail=null; byId('export-day').disabled=true;
  message('正在讀取紀錄…');
  const data = await api(`/api/report?${new URLSearchParams({ ...(from?{from}:{}),...(to?{to}:{}) })}`);
  if (sequence !== reportRequest || !token) return;
  byId('dashboard').hidden=false; byId('login').hidden=true; byId('logout').hidden=false; render(data); message(''); await loadDetail();
}
byId('login-form').addEventListener('submit',async event=>{
  event.preventDefault(); token=byId('token').value.trim(); byId('token').value='';
  const button=event.submitter; button.disabled=true;
  try { await load(); } catch(error) { token=''; message(error.message); } finally { button.disabled=false; }
});
byId('logout').addEventListener('click',()=>{ token=''; report=null; detail=null; detailRequest++; reportRequest++; byId('dashboard').hidden=true; byId('login').hidden=false; byId('logout').hidden=true; for(const id of ['pages','sources','months','chart','detail-day','popular-list']) byId(id).replaceChildren(); message('已登出。'); });
byId('range').addEventListener('submit',async event=>{event.preventDefault();try{await load(byId('from').value,byId('to').value);}catch(error){message(error.message);}});
byId('all').addEventListener('click',async()=>{try{await load();}catch(error){message(error.message);}});
byId('year').addEventListener('click',async()=>{try{await load(new Date(Date.now()+8*3600000).getUTCFullYear()+'-01-01');}catch(error){message(error.message);}});
byId('detail-day').addEventListener('change',loadDetail);
byId('export').addEventListener('click',()=>{if(!report)return; const rows=[['day_taipei','pageviews','visits','sample_interval','captured_at'],...report.days.map(d=>[d.day,d.pageviews,d.visits,d.sample_interval??'',d.captured_at])]; download(`hawks-traffic-${report.from}-${report.to}.csv`,'\ufeff'+rows.map(r=>r.join(',')).join('\r\n'),'text/csv;charset=utf-8');});
byId('export-day').addEventListener('click',()=>{if(detail)download(`hawks-traffic-${detail.day}.json`,JSON.stringify(detail,null,2),'application/json');});

byId('granularity').addEventListener('change',renderTrend);
byId('missed').addEventListener('input',renderEstimate);
byId('recent').addEventListener('click',async()=>{const end=Date.now()+8*3600000-86400000;try{await load(new Date(end-29*86400000).toISOString().slice(0,10),new Date(end).toISOString().slice(0,10));}catch(error){message(error.message);}});

let resizeFrame;
window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(report)chart(calendarRows(report,byId('granularity').value));});});

byId('page-search').addEventListener('input',()=>{popularLimit=10;renderPopular();});
byId('content-only').addEventListener('change',()=>{popularLimit=10;renderPopular();});
byId('popular-more').addEventListener('click',()=>{popularLimit+=20;renderPopular();});
