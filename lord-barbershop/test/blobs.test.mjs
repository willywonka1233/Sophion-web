// Corre la API contra el servidor real de Netlify Blobs y simula lo que pasa en producción:
// cada pedido trae su propio contexto (URL + token) y los tokens viejos dejan de valer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';

delete process.env.LORD_LOCAL_DB;
process.env.ADMIN_PIN = '2468';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lord-blobs-'));

async function startServer(token) {
  const server = new BlobsServer({ directory: dir, token });
  const { port } = await server.start();
  const url = `http://localhost:${port}`;
  process.env.NETLIFY_BLOBS_CONTEXT = Buffer.from(JSON.stringify({ edgeURL: url, uncachedEdgeURL: url, siteID: 'site', token })).toString('base64');
  return server;
}

let server = await startServer('token-1');
const { default: api } = await import('../netlify/functions/api.mjs');

async function call(method, p, { body, token } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const r = await api(new Request(`https://lord.test${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined }));
  const text = await r.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* redirección */ }
  return { status: r.status, data, location: r.headers.get('location') };
}

test('la API usa el contexto de Blobs de cada pedido (no reutiliza tokens viejos)', { timeout: 30000 }, async () => {
  const admin = (await call('POST', '/api/admin/login', { body: { pin: '2468' } })).data.token;
  const cards = (await call('GET', '/api/admin/cards', { token: admin })).data.cards;
  assert.equal((await call('GET', '/api/config')).status, 200);
  assert.equal((await call('GET', `/t/${cards[0].code}`)).status, 302);

  // Netlify rota las credenciales: el servidor viejo se apaga y llega un contexto nuevo
  await server.stop();
  server = await startServer('token-2');

  const cfg = await call('GET', '/api/config');
  assert.equal(cfg.status, 200, JSON.stringify(cfg.data));
  const short = await call('GET', `/t/${cards[0].code}`);
  assert.equal(short.status, 302, JSON.stringify(short.data));
  assert.match(short.location, new RegExp(`/sello\\?c=${cards[0].code}$`));
  assert.equal((await call('GET', '/api/slots?date=2030-01-07&service=corte')).status, 200);
  const reg = await call('POST', '/api/register', { body: { name: 'Prueba', phone: '3564000001', pin: '1234' } });
  assert.equal(reg.status, 200, JSON.stringify(reg.data));
  const v = await call('POST', '/api/validate', { token: reg.data.token, body: { c: cards[0].code } });
  assert.equal(v.status, 200, JSON.stringify(v.data));
  await server.stop();
});
