export default async function handler(req, res) {
  // eslint-disable-next-line no-undef
  const gasUrl = process.env.VITE_GAS_URL;
  
  if (!gasUrl) {
    return res.status(500).json({ error: 'VITE_GAS_URL tidak diset di environment Vercel' });
  }

  // Hapus prefix /api dari path
  let target = gasUrl;
  const urlPath = req.url.replace('/api', '');
  if (urlPath && urlPath !== '/') {
    target += urlPath;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
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