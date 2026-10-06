/* eslint-disable no-undef */
const DEFAULT_ALLOWED_ORIGINS = [
  'https://laporan-pm-app.vercel.app',
  'http://localhost:5173',
];

const MAX_BODY_BYTES = 100 * 1024;

function getAllowedOrigins() {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_ORIGINS;
}

export default async function handler(req, res) {
  // 1. Validasi origin (CORS). POST wajib punya origin yang diizinkan.
  const origin = req.headers.origin;
  const originAllowed = !!origin && getAllowedOrigins().includes(origin);
  if (originAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-Token');
  }
  if (req.method === 'OPTIONS') {
    return res.status(originAllowed ? 200 : 403).end();
  }

  // 2. Batasi hanya method yang diperlukan
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (origin && !originAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (req.method === 'POST' && !originAllowed) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  // 3. GAS_URL dan API key server-only (tanpa prefix VITE_ agar tidak bocor ke client)
  const gasUrl = process.env.GAS_URL;
  const apiKey = process.env.GAS_API_KEY;
  if (!gasUrl || !apiKey) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  if (!gasUrl.startsWith('https://script.google.com/')) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const sessionToken = req.headers['x-session-token'];
  const token = typeof sessionToken === 'string' ? sessionToken : '';

  const fetchOptions = { method: req.method, headers: { 'Content-Type': 'application/json' } };
  let target = gasUrl;

  if (req.method === 'GET') {
    const params = new URLSearchParams({ api_key: apiKey, token });
    target = `${gasUrl}?${params.toString()}`;
  } else {
    const body = req.body;
    if (!body || typeof body !== 'object' || typeof body.action !== 'string'
      || !body.data || typeof body.data !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    const payload = JSON.stringify({
      action: body.action,
      data: body.data,
      api_key: apiKey,
      session_token: token,
    });
    if (Buffer.byteLength(payload) > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Payload too large' });
    }
    fetchOptions.body = payload;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(target, { ...fetchOptions, signal: controller.signal });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Gateway Timeout' });
    } else {
      res.status(502).json({ error: 'Bad gateway' });
    }
  } finally {
    clearTimeout(timeout);
  }
}
