import test from 'node:test';
import assert from 'node:assert/strict';
import sms from '../api/send_sms.js';
import whatsapp from '../api/send_whatsapp.js';
import media from '../api/send_media.js';
import gateway from '../api/send_gateway_sms.js';
import health from '../api/health.js';

function response() {
  return { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, send(body) { this.body = body; return this; }, end() { return this; } };
}

test('health endpoint responds successfully', () => {
  const res = response(); health({}, res);
  assert.equal(res.code, 200); assert.equal(res.body.status, true);
});
test('invalid requests and preflight never contact providers', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected network'); });
  for (const handler of [sms, whatsapp, media, gateway]) {
    for (const body of [undefined, null, [], 'invalid', { mobile: {} }]) {
      const res = response(); await handler({ method: 'POST', body }, res); assert.equal(res.code, 400);
    }
    let res = response(); await handler({ method: 'DELETE' }, res); assert.equal(res.code, 405);
    res = response(); await handler({ method: 'OPTIONS' }, res); assert.equal(res.code, 204);
  }
  assert.equal(fetch.mock.callCount(), 0);
});
test('provider failure status is preserved and transport errors do not expose secrets', async t => {
  const req = { method: 'POST', body: { api_token: 'secret-token', mobile: '9999999999', message: 'test' } };
  t.mock.method(globalThis, 'fetch', async () => new Response('Rate limited', { status: 429 }));
  let res = response(); await sms(req, res); assert.equal(res.code, 429);
  fetch.mock.mockImplementation(async () => { throw Error('secret-token'); });
  res = response(); await sms(req, res); assert.equal(res.code, 502);
  assert.ok(!JSON.stringify(res.body).includes('secret-token'));
});
test('WhatsApp blocks unconfigured destinations; media preserves caller parameters', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('ok'));
  let res = response();
  await whatsapp({ method: 'GET', query: { token: 'secret', mobile: '9999999999', message: 'test', base: 'http://127.0.0.1' } }, res);
  assert.equal(res.code, 400); assert.equal(fetch.mock.callCount(), 0);
  const body = { type: 'send_img', api_token: 'secret', mobile: '9999999999', img: 'https://example.com/image.png' };
  res = response(); await media({ method: 'POST', body }, res);
  assert.equal(res.code, 200); assert.equal(body.type, 'send_img');
  assert.equal(fetch.mock.calls[0].arguments[1].redirect, 'error');
});
