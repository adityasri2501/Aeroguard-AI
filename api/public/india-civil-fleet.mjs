function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); if (row.some(v => v.trim())) rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  row.push(field); if (row.some(v => v.trim())) rows.push(row);
  if (rows.length < 2) throw new Error('Aircraft CSV did not contain data rows.');
  const headers = rows.shift().map(v => v.trim().replace(/^\uFEFF/, '').toLowerCase());
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])));
}
export default async function handler() {
  try {
    const [csvResponse, metaResponse] = await Promise.all([
      fetch('https://vtaircrafts.in/data/latest/aircraft.csv', { signal: AbortSignal.timeout(25000), headers: { accept: 'text/csv,*/*' } }),
      fetch('https://vtaircrafts.in/data/latest/meta.json', { signal: AbortSignal.timeout(25000), headers: { accept: 'application/json' } }),
    ]);
    if (!csvResponse.ok) return Response.json({ error: `Aircraft-list source returned HTTP ${csvResponse.status}.` }, { status: 502 });
    const text = await csvResponse.text();
    if (text.length > 15_000_000) return Response.json({ error: 'Aircraft list exceeds the prototype import limit.' }, { status: 502 });
    const records = parseCsv(text), meta = metaResponse.ok ? await metaResponse.json().catch(() => ({})) : {};
    return Response.json({ ok: true, source: 'VT Aircrafts; compiled from DGCA scheduled/non-scheduled operator lists', snapshot: meta.snapshot || null, generatedAt: meta.generatedAt || null, counts: meta.counts || null, issues: meta.issues || [], count: records.length, records }, { headers: { 'cache-control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (error) {
    return Response.json({ error: error.message || 'Could not fetch the public civil aircraft list.' }, { status: 502 });
  }
}
