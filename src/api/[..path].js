/* eslint-disable no-undef */
// api/[...path].js
export default async function handler(req, res) {
  const gasUrl = process.env.VITE_GAS_URL;
  
  if (!gasUrl) {
    return res.status(500).json({ error: 'VITE_GAS_URL tidak diset di environment Vercel' });
  }

  // Tentukan target URL (hapus prefix /api jika ada)
  let target = gasUrl;
  if (req.url !== '/api') {
    const pathPart = req.url.replace('/api', '');
    target += pathPart;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (req.method !== 'GET') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(target, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: err.message });
  }
}