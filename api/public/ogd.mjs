export default async function handler(request) {
  if (request.method !== 'POST') return Response.json({ error: 'Use POST for OGD resource requests.' }, { status: 405, headers: { allow: 'POST' } });
  try {
    const payload = await request.json(), resourceId = String(payload.resourceId || '').trim(), apiKey = String(payload.apiKey || '').trim(), limit = Math.max(1, Math.min(1000, Number(payload.limit) || 100));
    if (!/^[0-9a-f-]{20,}$/i.test(resourceId) || !apiKey || apiKey.length > 500) return Response.json({ error: 'A resource ID and API key are required.' }, { status: 400 });
    const url = new URL(`https://api.data.gov.in/resource/${encodeURIComponent(resourceId)}`);
    url.searchParams.set('api-key', apiKey); url.searchParams.set('format', 'json'); url.searchParams.set('limit', String(limit));
    const upstream = await fetch(url, { signal: AbortSignal.timeout(25000), headers: { accept: 'application/json' } });
    const text = await upstream.text();
    if (!upstream.ok) return Response.json({ error: `OGD API returned HTTP ${upstream.status}.`, detail: text.slice(0, 500) }, { status: upstream.status });
    try { return Response.json(JSON.parse(text), { headers: { 'cache-control': 'no-store' } }); }
    catch { return Response.json({ error: 'OGD returned an unreadable response.' }, { status: 502 }); }
  } catch (error) {
    return Response.json({ error: error.message || 'OGD request failed.' }, { status: 502 });
  }
}
