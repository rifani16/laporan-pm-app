/* eslint-disable no-undef */
export default async function handler(req, res) {
  // 1. Validasi origin (CORS)
  const allowedOrigins = [
    'https://laporan-pm-app.vercel.app',
    'http://localhost:5173',
    // tambahkan domain lain
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Batasi hanya method yang diperlukan
  const allowedMethods = ['GET', 'POST'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 3. (Opsional) Rate limiting sederhana - butuh storage eksternal di Vercel
  //    (tidak bisa diandalkan tanpa database, tapi bisa gunakan Vercel KV atau Upstash)

  // 4. Validasi path — GAS_URL server-only (tidak pakai VITE_ agar tidak bocor ke client)
  const gasUrl = process.env.GAS_URL;
  if (!gasUrl) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }
  let target = gasUrl;
  const pathPart = req.url.replace(/^\/api/, '');
  if (pathPart && pathPart !== '/') {
    target += pathPart;
  }
  // Pastikan target masih dalam domain yang diharapkan (misal script.google.com)
  if (!target.startsWith('https://script.google.com/')) {
    return res.status(400).json({ error: 'Invalid target' });
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Bisa tambahkan API key jika GAS memerlukan autentikasi
        // 'X-API-Key': process.env.API_KEY_GAS,
      },
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }
    // Tambahkan timeout (misal 15 detik)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(target, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Gateway Timeout' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
}