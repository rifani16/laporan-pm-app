export default async function handler(req, res) {
  // eslint-disable-next-line no-undef
  const gasUrl = process.env.VITE_GAS_URL;
  if (!gasUrl) {
    return res.status(500).json({ error: 'VITE_GAS_URL tidak diset di environment Vercel' });
  }

  let target = gasUrl;
  const pathPart = req.url.replace(/^\/api/, '');
  if (pathPart && pathPart !== '/') {
    target += pathPart;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }
    const response = await fetch(target, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}