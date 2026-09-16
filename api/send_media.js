import { parameters, forward } from '../lib/proxy.js';
export default async function handler(req, res) {
  const q = parameters(req, res);
  if (!q) return;
  const type = q.type || 'send_img';
  if (!/^send_[a-z_]+$/.test(type) || !q.api_token?.trim() || !/^(?:\+?91)?\d{10}$/.test(q.mobile || '')) {
    return res.status(400).json({ status: false, error: 'Valid media type, api_token and mobile required' });
  }
  delete q.type;
  const url = new URL('https://whatsbot.tech/api/' + type);
  url.search = new URLSearchParams(q);
  return forward(url, res);
}
