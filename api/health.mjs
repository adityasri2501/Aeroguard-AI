export default async function handler() {
  return Response.json({ ok: true, service: 'Aeroguard AI Vercel functions', storage: 'browser-local imports; no shared database configured' });
}
