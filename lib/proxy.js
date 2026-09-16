export function parameters(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return null; }
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    res.status(405).json({ status: false, error: 'Method not allowed' });
    return null;
  }
  const value = req.method === 'POST' ? req.body : req.query;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(v => typeof v !== 'string')) {
    res.status(400).json({ status: false, error: 'Expected string parameters' });
    return null;
  }
  return { ...value };
}

export function allowedUrl(value, allowedOrigins) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !allowedOrigins.includes(url.origin)) return null;
    return url;
  } catch { return null; }
}

export async function forward(url, res) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'error' });
    const body = await response.text();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(response.status).send(body);
  } catch {
    return res.status(502).json({ status: false, error: 'Message provider unavailable or timed out' });
  }
}

export function validMessage(q, res) {
  if (!q.api_token?.trim() || !/^(?:\+?91)?\d{10}$/.test(q.mobile || '') || !q.message?.trim()) {
    res.status(400).json({ status: false, error: 'Valid token, mobile and message required' });
    return false;
  }
  return true;
}
