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
function monthlyRows(data) {
  const months = new Map();
  const dayMap = new Map(data.days.map(day => [day.day, day]));
  const start = data.from > data.archiveStart ? data.from : data.archiveStart;
  const yesterday = new Date(Date.now() + 8 * 3600000 - 86400000).toISOString().slice(0,10);
  const end = data.to < yesterday ? data.to : yesterday;
  for (let date = Date.parse(start); date <= Date.parse(end); date += 86400000) {
    const key = new Date(date).toISOString().slice(0,10), month = key.slice(0,7);
    if (!months.has(month)) months.set(month, { month, pageviews:0, visits:0, saved:0, expected:0 });
    const value = months.get(month), day = dayMap.get(key); value.expected++;
    if (day) { value.saved++; value.pageviews += day.pageviews; value.visits += day.visits; }
  }
  return [...months.values()];
}
function chart(months) {
  byId('chart').replaceChildren();
  if (!months.some(month => month.saved === month.expected)) {
    const note = document.createElement('p'); note.className='hint'; note.textContent='所選月份尚有缺日，請先在下表查看已保存的數值。'; byId('chart').append(note); return;
  }
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns,'svg'); svg.setAttribute('viewBox','0 0 960 180');
  const max = Math.max(1, ...months.map(m => m.pageviews));
  let points = [];
  const line = () => { if (!points.length) return; const path = document.createElementNS(ns,'polyline'); path.setAttribute('points',points.join(' ')); svg.append(path); points=[]; };
  months.forEach((m,i) => {
    // Missing periods are gaps, never plotted as measured zeroes.
    if (m.saved !== m.expected) { line(); return; }
    const x = 12 + i / Math.max(1,months.length-1) * 936, y = 165 - m.pageviews / max * 145;
    points.push(`${x},${y}`);
    const dot = document.createElementNS(ns,'circle'); dot.setAttribute('cx',x); dot.setAttribute('cy',y); dot.setAttribute('r','3'); dot.setAttribute('fill','#3d654d');
    const title = document.createElementNS(ns,'title'); title.textContent=`${m.month}：${number(m.pageviews)} 次瀏覽`; dot.append(title); svg.append(dot);
  }); line(); byId('chart').append(svg);
}
function render(data) {
  report = data;
  byId('from').value = data.from; byId('to').value = data.to;
  byId('pageviews').textContent = number(data.total.pageviews);
  byId('visits').textContent = number(data.total.visits);
  byId('days').textContent = number(data.days.length);
  byId('coverage').textContent = `${data.from} — ${data.to} · 台灣時間 · ${data.missingDays ? `缺少 ${data.missingDays} 天，總數為已保存部分` : '所選期間已完整歸檔'} · ${data.sampledDays} 天包含抽樣估計。`;
  const warnings = [];
  if (!data.scheduleConfigured) warnings.push('自動歸檔尚未啟用，需要設定 Cloudflare 統計讀取權杖。');
  if (data.status?.last_error) warnings.push('最近一次歸檔失敗，既有資料仍保留。');
  if (data.scheduleConfigured && (!data.status?.last_success || Date.now()-Date.parse(data.status.last_success)>48*3600000)) warnings.push('超過 48 小時未確認歸檔成功，請檢查排程。');
  byId('sync').textContent = warnings.join(' ') || `最近歸檔成功：${new Date(data.status.last_success).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})}`;
  const months = monthlyRows(data); chart(months); byId('months').replaceChildren();
  for (const month of months) { const row = document.createElement('tr'); cell(row,month.month); cell(row,month.saved ? number(month.pageviews) : '—'); cell(row,month.saved ? number(month.visits) : '—'); cell(row,`${month.saved} / ${month.expected}`); byId('months').append(row); }
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
  message('正在讀取紀錄…');
  const data = await api(`/api/report?${new URLSearchParams({ ...(from?{from}:{}),...(to?{to}:{}) })}`);
  if (sequence !== reportRequest || !token) return;
  render(data); byId('dashboard').hidden=false; byId('login').hidden=true; byId('logout').hidden=false; message(''); await loadDetail();
}
byId('login-form').addEventListener('submit',async event=>{
  event.preventDefault(); token=byId('token').value.trim(); byId('token').value='';
  const button=event.submitter; button.disabled=true;
  try { await load(); } catch(error) { token=''; message(error.message); } finally { button.disabled=false; }
});
byId('logout').addEventListener('click',()=>{ token=''; report=null; detail=null; detailRequest++; reportRequest++; byId('dashboard').hidden=true; byId('login').hidden=false; byId('logout').hidden=true; for(const id of ['pages','sources','months','chart','detail-day']) byId(id).replaceChildren(); message('已登出。'); });
byId('range').addEventListener('submit',async event=>{event.preventDefault();try{await load(byId('from').value,byId('to').value);}catch(error){message(error.message);}});
byId('all').addEventListener('click',async()=>{try{await load();}catch(error){message(error.message);}});
byId('year').addEventListener('click',async()=>{try{await load(new Date(Date.now()+8*3600000).getUTCFullYear()+'-01-01');}catch(error){message(error.message);}});
byId('detail-day').addEventListener('change',loadDetail);
byId('export').addEventListener('click',()=>{if(!report)return; const rows=[['day_taipei','pageviews','visits','sample_interval','captured_at'],...report.days.map(d=>[d.day,d.pageviews,d.visits,d.sample_interval??'',d.captured_at])]; download(`hawks-traffic-${report.from}-${report.to}.csv`,'\ufeff'+rows.map(r=>r.join(',')).join('\r\n'),'text/csv;charset=utf-8');});
byId('export-day').addEventListener('click',()=>{if(detail)download(`hawks-traffic-${detail.day}.json`,JSON.stringify(detail,null,2),'application/json');});
