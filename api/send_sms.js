import { parameters, validMessage, forward } from '../lib/proxy.js';
export default async function handler(req, res) {
  const q = parameters(req, res);
  if (!q || !validMessage(q, res)) return;
  const url = new URL('https://whatsbot.tech/api/send_sms');
  url.search = new URLSearchParams({ api_token: q.api_token, mobile: q.mobile, message: q.message, device_id: q.device_id || '' });
  return forward(url, res);
}
