import { readFileSync, existsSync, createReadStream, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const releaseDir = fileURLToPath(new URL('../releases/android/', import.meta.url));
const assets = {
  'release.json': 'application/json',
};

// Serve only the explicit release files, never arbitrary workspace paths.
export default function releaseAssets() {
  const release = JSON.parse(readFileSync(resolve(releaseDir, 'release.json'), 'utf8'));
  if (/^Perfect-Education-v[0-9A-Za-z.-]+\.apk$/.test(release.file)) assets[release.file] = 'application/vnd.android.package-archive';
  const mount = server => { server.middlewares.use((req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (!pathname.startsWith('/downloads/android/')) return next();
    const name = pathname.slice('/downloads/android/'.length);
    if (!Object.hasOwn(assets, name) || !['GET', 'HEAD'].includes(req.method)) {
      res.statusCode = 404; return res.end();
    }
    const path = resolve(releaseDir, name);
    if (!existsSync(path)) { res.statusCode = 404; return res.end(); }
    res.setHeader('Content-Type', assets[name]);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Length', statSync(path).size);
    if (name.endsWith('.apk')) res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    if (req.method === 'HEAD') return res.end();
    createReadStream(path).on('error', () => res.destroy()).pipe(res);
  }); };
  return {
    name: 'school-release-assets',
    configureServer: mount,
    configurePreviewServer: mount,
    generateBundle() {
      for (const name of Object.keys(assets)) {
        const path = resolve(releaseDir, name);
        if (existsSync(path)) this.emitFile({ type: 'asset', fileName: `downloads/android/${name}`, source: readFileSync(path) });
      }
    },
  };
}
