import { parameters, validMessage, forward, allowedUrl } from '../lib/proxy.js';
export default async function handler(req, res) {
  const q = parameters(req, res);
  if (!q || !validMessage({ ...q, api_token: q.token || q.api_token }, res)) return;
  const base = (q.base || 'https://whatsbot.tech/api').replace(/\/$/, '');
  const origins = ['https://whatsbot.tech', ...(process.env.MESSAGE_PROVIDER_ORIGINS || '').split(',').filter(Boolean)];
  const url = allowedUrl(base + '/send_sms', origins);
  if (!url) return res.status(400).json({ status: false, error: 'Provider origin is not configured on the server' });
  url.search = new URLSearchParams({ api_token: q.token || q.api_token, mobile: q.mobile, message: q.message, device_id: q.device_id || '' });
  return forward(url, res);
}
