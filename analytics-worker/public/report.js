const DAY = 86400000;
const dayString = time => new Date(time).toISOString().slice(0, 10);

export function calendarRows(data, mode = 'day', now = Date.now()) {
  const saved = new Map(data.days.map(day => [day.day, day]));
  const start = data.from > data.archiveStart ? data.from : data.archiveStart;
  const yesterday = dayString(now + 8 * 3600000 - DAY);
  const end = data.to < yesterday ? data.to : yesterday;
  const rows = new Map();
  for (let date = Date.parse(start); date <= Date.parse(end); date += DAY) {
    const day = dayString(date), key = mode === 'month' ? day.slice(0, 7) : day;
    if (!rows.has(key)) rows.set(key, { key, pageviews: 0, visits: 0, saved: 0, expected: 0, sampled: false });
    const row = rows.get(key), value = saved.get(day);
    row.expected++;
    if (value) {
      row.saved++; row.pageviews += value.pageviews; row.visits += value.visits;
      row.sampled ||= value.sample_interval > 1;
    }
  }
  return [...rows.values()];
}

export function periodSummary(data) {
  const peak = data.days.reduce((best, day) => !best || day.pageviews > best.pageviews ? day : best, null);
  return { average: data.days.length ? data.total.pageviews / data.days.length : null, peak };
}

// This is a user-selected sensitivity scenario, never a measured correction or confidence interval.
export function estimateViews(pageviews, missedPercent) {
  if (!Number.isFinite(pageviews) || pageviews < 0 || !Number.isFinite(missedPercent) || missedPercent < 0 || missedPercent > 50) return null;
  return Math.round(pageviews / (1 - missedPercent / 100));
}

export function weeklyComparison(data, now = Date.now()) {
  const rows = calendarRows(data, 'day', now).slice(-14);
  if (rows.length !== 14 || rows.some(row => row.saved !== row.expected)) return null;
  const previous = rows.slice(0, 7).reduce((sum, row) => sum + row.pageviews, 0);
  const current = rows.slice(7).reduce((sum, row) => sum + row.pageviews, 0);
  return { previous, current, change: previous ? (current - previous) / previous * 100 : null };
}
