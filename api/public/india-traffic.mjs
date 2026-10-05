function decodeHtml(value) {
  return value.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
}
function parseStats(html) {
  const years = {};
  for (const match of html.matchAll(/Monthly Operational Statistics for FY (\d{4}-\d{2}) on scheduled domestic services/gi)) {
    const start = html.lastIndexOf('<table', match.index), end = html.indexOf('</table>', match.index);
    if (start < 0 || end < 0) continue;
    const rows = [];
    for (const tr of html.slice(start, end + 8).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => decodeHtml(c[1]));
      if (cells.length) rows.push(cells);
    }
    const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    const index = Object.fromEntries(months.map((m, i) => [m.toLowerCase(), i]));
    const monthRows = rows.map(cells => {
      const key = (cells[0] || '').toLowerCase().slice(0, 3), nums = cells.slice(1).map(v => v.trim() ? Number(v.replace(/,/g, '')) : NaN), i = index[key];
      if (i === undefined || nums.length < 7 || ![nums[0], nums[1], nums[6]].every(Number.isFinite)) return null;
      return [months[i], nums[0], nums[1], nums[6]];
    }).filter(Boolean);
    const total = rows.find(c => (c[0] || '').toLowerCase().startsWith('total'))?.slice(1).map(v => Number(v.replace(/,/g, '')));
    if (monthRows.length && total?.length >= 7 && [total[0], total[1], total[6]].every(Number.isFinite)) {
      years[match[1]] = { label: `FY ${match[1]}${monthRows.length < 12 ? ` · ${monthRows[0][0]}–${monthRows.at(-1)[0]} YTD` : ''}`, source: 'IndiGo operational statistics · reported as DGCA figures', total: [total[0], total[1], total[6]], rows: monthRows };
    }
  }
  if (!Object.keys(years).length) throw new Error('Published tables could not be parsed.');
  return years;
}
export default async function handler(request) {
  try {
    const response = await fetch('https://www.goindigo.in/information/investor-relations/operational-statistics/domestic.html', { signal: AbortSignal.timeout(25000), headers: { accept: 'text/html' } });
    if (!response.ok) return Response.json({ error: `Statistics source returned HTTP ${response.status}.` }, { status: 502 });
    const series = parseStats(await response.text());
    return Response.json({ ok: true, source: 'IndiGo operational statistics, reported as DGCA figures', fetchedAt: new Date().toISOString(), series }, { headers: { 'cache-control': 's-maxage=900, stale-while-revalidate=3600' } });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not fetch the published statistics.' }, { status: 502 });
  }
}
