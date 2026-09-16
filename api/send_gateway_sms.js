import { parameters, allowedUrl, forward } from '../lib/proxy.js';
export default async function handler(req, res) {
  const q = parameters(req, res);
  if (!q) return;
  if (!q.url) return res.status(400).json({ status: false, error: 'url required' });
  const origins = (process.env.SMS_GATEWAY_ORIGINS || '').split(',').filter(Boolean);
  if (!origins.length) return res.status(503).json({ status: false, error: 'SMS_GATEWAY_ORIGINS is not configured on the server' });
  const url = allowedUrl(q.url, origins);
  if (!url) return res.status(400).json({ status: false, error: 'Gateway origin is not allowed' });
  return forward(url, res);
}
