import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUTS = path.join(ROOT, 'outputs');
const STORE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const STORE = path.join(STORE_DIR, 'records.json');
const HOST = '127.0.0.1';
const PORT = Number(process.env.AEROGUARD_AI_PORT || 3030);
const kinds = ['aircraft', 'maintenance', 'telemetry', 'parts'];
const blank = () => Object.fromEntries(kinds.map(k => [k, []]));

async function readStore() {
  try {
    const parsed = JSON.parse(await fs.readFile(STORE, 'utf8'));
    return Object.fromEntries(kinds.map(k => [k, Array.isArray(parsed[k]) ? parsed[k] : []]));
  } catch (err) {
    if (err.code === 'ENOENT') return blank();
    throw err;
  }
}
async function writeStore(db) {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const temp = STORE + '.tmp';
  await fs.writeFile(temp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(temp, STORE);
}
function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
async function bodyJson(req, maxBytes = 12_000_000) {
  let size = 0, chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('Request body is too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 }); }
}
function cleanRecord(kind, row) {
  const take = (...names) => {
    for (const n of names) {
      const v = row[n] ?? row[n.toLowerCase()];
      if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
  };
  if (kind === 'aircraft') return { id: take('id','aircraft_id','tail_number','registration','reg'), type: take('type','aircraft_type','model','type.name'), unit: take('unit','operator','squadron'), status: take('status','availability_status'), updated: take('updated','last_seen','source.asOn') };
  if (kind === 'maintenance') return { id: take('id','work_order_id','maintenance_id'), aircraft: take('aircraft','aircraft_id','tail_number','registration'), task: take('task','description','defect'), status: take('status'), priority: take('priority','severity'), due: take('due','due_date','scheduled_date'), opened: take('opened','opened_at','start_date'), rts: take('rts','return_to_service','closed_at') };
  if (kind === 'telemetry') {
    const value = Number(take('value','reading','measurement'));
    return { aircraft: take('aircraft','aircraft_id','tail_number','registration'), time: take('time','timestamp','datetime','date'), sensor: take('sensor','parameter','channel'), value, unit: take('unit','uom'), threshold: take('threshold','min_threshold') === '' ? null : Number(take('threshold','min_threshold')) };
  }
  return { number: take('number','part_number','part_no','pn','sku'), name: take('name','part_name','description'), qty: Number(take('qty','quantity_on_hand','quantity','stock')), reorder: Number(take('reorder','reorder_level','minimum_stock','reorder_point')), location: take('location','store','base') };
}
function rowKey(kind, row) {
  if (kind === 'aircraft') return row.id;
  if (kind === 'maintenance') return row.id;
  if (kind === 'parts') return row.number;
  return `${row.aircraft}|${row.time}|${row.sensor}`;
}
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
  if (rows.length < 2) throw new Error('The downloaded aircraft list did not contain data rows.');
  const headers = rows.shift().map(v => v.trim().replace(/^\uFEFF/, '').toLowerCase());
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()])));
}
function decodeHtml(value) {
  return value.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&#x27;/gi, "'").replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
}
function parseIndigoStats(html) {
  const years = {};
  const heading = /Monthly Operational Statistics for FY (\d{4}-\d{2}) on scheduled domestic services/gi;
  for (const match of html.matchAll(heading)) {
    const start = html.lastIndexOf('<table', match.index), end = html.indexOf('</table>', match.index);
    if (start < 0 || end < 0) continue;
    const table = html.slice(start, end + 8), rows = [];
    for (const tr of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...tr[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => decodeHtml(c[1]));
      if (cells.length) rows.push(cells);
    }
    const monthRows = rows.map(cells => {
      const month = (cells[0] || '').toLowerCase().slice(0, 3), nums = cells.slice(1).map(v => v.trim() ? Number(v.replace(/,/g, '')) : NaN);
      const idx = { apr: 0, may: 1, jun: 2, jul: 3, aug: 4, sep: 5, oct: 6, nov: 7, dec: 8, jan: 9, feb: 10, mar: 11 }[month];
      if (idx === undefined || nums.length < 7 || !Number.isFinite(nums[0]) || !Number.isFinite(nums[1]) || !Number.isFinite(nums[6])) return null;
      return [[ 'Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar' ][idx], nums[0], nums[1], nums[6]];
    }).filter(Boolean);
    const totalRow = rows.find(cells => (cells[0] || '').toLowerCase().startsWith('total'));
    const totals = totalRow?.slice(1).map(v => Number(v.replace(/,/g, '')));
    if (monthRows.length && totals?.length >= 7 && totals.slice(0, 2).every(Number.isFinite) && Number.isFinite(totals[6])) {
      years[match[1]] = { label: `FY ${match[1]}${monthRows.length < 12 ? ' · ' + monthRows[0][0] + '–' + monthRows.at(-1)[0] + ' YTD' : ''}`, source: 'IndiGo operational statistics · reported as DGCA figures', total: totals.slice(0, 2).concat(totals[6]), rows: monthRows };
    }
  }
  if (!Object.keys(years).length) throw new Error('Could not parse published statistics from the source page.');
  return years;
}
async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app-enhancements.js', ['app-enhancements.js', 'text/javascript; charset=utf-8']],
  ['/ngafid_flight_813_window.csv', ['ngafid_flight_813_window.csv', 'text/csv; charset=utf-8']],
  ['/ngafid_event_labels.csv', ['ngafid_event_labels.csv', 'text/csv; charset=utf-8']],
]);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, service: 'Aeroguard AI local prototype backend', storage: 'local JSON file' });
    if (req.method === 'GET' && url.pathname === '/api/records') return send(res, 200, await readStore());
    if (req.method === 'POST' && url.pathname === '/api/records/import') {
      const payload = await bodyJson(req), kind = payload.type;
      if (!kinds.includes(kind) || !Array.isArray(payload.records) || payload.records.length > 20000) return send(res, 400, { error: 'Provide a valid record type and up to 20,000 records.' });
      const incoming = payload.records.map(r => cleanRecord(kind, r));
      const required = { aircraft: r => r.id, maintenance: r => r.id && r.aircraft, telemetry: r => r.aircraft && r.time && r.sensor && Number.isFinite(r.value), parts: r => r.number && Number.isFinite(r.qty) && Number.isFinite(r.reorder) }[kind];
      if (incoming.some(r => !required(r))) return send(res, 400, { error: `One or more ${kind} records are missing required fields or contain invalid numbers.` });
      const db = await readStore(), merged = new Map(db[kind].map(r => [rowKey(kind, r), r]));
      for (const r of incoming) merged.set(rowKey(kind, r), r);
      db[kind] = [...merged.values()]; await writeStore(db);
      return send(res, 200, { ok: true, imported: incoming.length, total: db[kind].length });
    }
    if (req.method === 'DELETE' && url.pathname === '/api/records') {
      await writeStore(blank()); return send(res, 200, { ok: true, cleared: true });
    }
    if (req.method === 'POST' && url.pathname === '/api/public/ogd') {
      const p = await bodyJson(req, 20000), resourceId = String(p.resourceId || '').trim(), apiKey = String(p.apiKey || '').trim(), limit = Math.max(1, Math.min(1000, Number(p.limit) || 100));
      if (!/^[0-9a-f-]{20,}$/i.test(resourceId) || !apiKey || apiKey.length > 500) return send(res, 400, { error: 'A resource ID and API key are required.' });
      const remote = new URL(`https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`);
      remote.searchParams.set('api-key', apiKey); remote.searchParams.set('format', 'json'); remote.searchParams.set('limit', String(limit));
      const upstream = await fetchWithTimeout(remote, { headers: { accept: 'application/json' } });
      const text = await upstream.text();
      if (!upstream.ok) return send(res, upstream.status, { error: `OGD API returned HTTP ${upstream.status}.`, detail: text.slice(0, 500) });
      let parsed; try { parsed = JSON.parse(text); } catch { return send(res, 502, { error: 'OGD returned an unreadable response.' }); }
      return send(res, 200, parsed);
    }
    if (req.method === 'GET' && url.pathname === '/api/public/india-civil-fleet') {
      const [upstream, metaResponse] = await Promise.all([
        fetchWithTimeout('https://vtaircrafts.in/data/latest/aircraft.csv', { headers: { accept: 'text/csv,*/*' } }),
        fetchWithTimeout('https://vtaircrafts.in/data/latest/meta.json', { headers: { accept: 'application/json' } }),
      ]);
      if (!upstream.ok) return send(res, 502, { error: `Aircraft-list source returned HTTP ${upstream.status}.` });
      const [text, metaText] = await Promise.all([upstream.text(), metaResponse.ok ? metaResponse.text() : Promise.resolve('{}')]);
      if (text.length > 15_000_000) return send(res, 502, { error: 'Aircraft list exceeds the prototype import limit.' });
      const records = parseCsv(text);
      let meta = {}; try { meta = JSON.parse(metaText); } catch { /* CSV remains usable if metadata is temporarily unavailable. */ }
      return send(res, 200, { ok: true, source: 'VT Aircrafts; compiled from DGCA scheduled/non-scheduled operator lists', snapshot: meta.snapshot || null, generatedAt: meta.generatedAt || null, counts: meta.counts || null, issues: meta.issues || [], count: records.length, records });
    }
    if (req.method === 'GET' && url.pathname === '/api/public/india-traffic') {
      const upstream = await fetchWithTimeout('https://www.goindigo.in/information/investor-relations/operational-statistics/domestic.html', { headers: { accept: 'text/html' } });
      if (!upstream.ok) return send(res, 502, { error: `Published statistics source returned HTTP ${upstream.status}.` });
      const series = parseIndigoStats(await upstream.text());
      return send(res, 200, { ok: true, source: 'IndiGo operational statistics, reported as DGCA figures', fetchedAt: new Date().toISOString(), series });
    }
    if (req.method === 'GET' && staticFiles.has(url.pathname)) {
      const [name, type] = staticFiles.get(url.pathname);
      const content = await fs.readFile(path.join(OUTPUTS, name));
      res.writeHead(200, { 'content-type': type, 'cache-control': name.endsWith('.js') ? 'no-cache' : 'no-store', 'x-content-type-options': 'nosniff' });
      return res.end(content);
    }
    return send(res, 404, { error: 'Not found.' });
  } catch (err) {
    const status = err.status || 502;
    return send(res, status, { error: err.message || 'Backend request failed.' });
  }
});

server.on('error', err => {
  console.error(err.code === 'EADDRINUSE' ? `Port ${PORT} is already in use.` : err.message);
  process.exitCode = 1;
});
server.listen(PORT, HOST, () => console.log(`Aeroguard AI backend ready at http://${HOST}:${PORT}\nLocal record storage: ${STORE}\nPress Ctrl+C to stop.`));
