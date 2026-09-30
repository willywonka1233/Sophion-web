// Servidor local para probar sin Netlify: sirve /public y la API con datos en ./.data
//   npm run dev   →   http://localhost:8888   (PIN del panel: 1234, o ADMIN_PIN=xxxx)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.LORD_LOCAL_DB ||= path.join(root, '.data');
process.env.ADMIN_PIN ||= '1234';
const { default: api } = await import('../netlify/functions/api.mjs');

const PORT = Number(process.env.PORT || 8888);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
const REWRITES = { '/sello': '/cuenta.html', '/cuenta': '/cuenta.html', '/admin': '/admin.html', '/tarjeta': '/tarjeta.html', '/': '/index.html' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const r = await api(request, {});
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  const rel = REWRITES[url.pathname] || url.pathname;
  const file = path.join(root, 'public', path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('404'); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, () => console.log(`Lord local → http://localhost:${PORT}  (panel: /admin, PIN ${process.env.ADMIN_PIN})`));
