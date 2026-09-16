import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const apiNames = new Set(['health', 'attendance_test', 'send_sms', 'send_media', 'send_gateway_sms', 'send_whatsapp']);
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/\.js$/, '');
      if (!apiNames.has(name)) { res.writeHead(404).end(); return; }
      req.query = Object.fromEntries(url.searchParams);
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1024 * 1024) { res.writeHead(413).end(); return; }
      }
      try { req.body = body ? JSON.parse(body) : {}; }
      catch { res.writeHead(400).end('Invalid JSON'); return; }
      res.status = code => { res.statusCode = code; return res; };
      res.send = value => res.end(String(value));
      res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
      const { default: handler } = await import(pathToFileURL(resolve(root, 'api', name + '.js')));
      await handler(req, res);
      return;
    }
    const path = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    // Serve only public legacy assets, never local backups, source credentials or .git.
    if (!/^\/(?:index\.html|app\.js|style\.css|manifest\.json|sw\.js|(?:assets|patch|templates)\/[^?]+)$/.test(path)) { res.writeHead(404).end(); return; }
    const file = resolve(root, '.' + path);
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch { if (!res.headersSent) res.writeHead(404); res.end('Not found'); }
}).listen(5174, '127.0.0.1', () => console.log('Legacy ERP: http://127.0.0.1:5174'));
