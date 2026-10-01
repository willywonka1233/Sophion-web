// Almacenamiento: Netlify Blobs en producción; carpeta local de JSON en desarrollo
// (se activa con la variable LORD_LOCAL_DB=<carpeta>).
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const LOCAL_DIR = process.env.LORD_LOCAL_DB;

function localStore(name) {
  const dir = path.join(LOCAL_DIR, name);
  fs.mkdirSync(dir, { recursive: true });
  const file = (key) => path.join(dir, encodeURIComponent(key) + '.json');
  const etagOf = (text) => createHash('sha1').update(text).digest('hex');
  return {
    async get(key) {
      try {
        const text = fs.readFileSync(file(key), 'utf8');
        return { data: JSON.parse(text), etag: etagOf(text) };
      } catch (e) {
        if (e.code === 'ENOENT') return null;
        throw e;
      }
    },
    async set(key, data, { onlyIfMatch, onlyIfNew } = {}) {
      const f = file(key);
      const exists = fs.existsSync(f);
      if (onlyIfNew && exists) return { modified: false };
      if (onlyIfMatch && (!exists || etagOf(fs.readFileSync(f, 'utf8')) !== onlyIfMatch)) return { modified: false };
      fs.writeFileSync(f, JSON.stringify(data));
      return { modified: true };
    },
    async del(key) {
      try { fs.unlinkSync(file(key)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    },
    async keys(prefix = '') {
      return fs.readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => decodeURIComponent(f.slice(0, -5)))
        .filter((k) => k.startsWith(prefix));
    },
  };
}

// En Netlify cada pedido trae su propio contexto de Blobs (URL + token de corta duración).
// Por eso el cliente se crea en cada operación: reutilizar uno viejo entre pedidos hace que
// falle con credenciales vencidas cuando la función queda "tibia".
function blobStore(name) {
  const s = () => getStore({ name, consistency: 'strong' });
  return {
    async get(key) {
      const r = await s().getWithMetadata(key, { type: 'json' });
      return r ? { data: r.data, etag: r.etag } : null;
    },
    async set(key, data, opts = {}) {
      const o = {};
      if (opts.onlyIfMatch) o.onlyIfMatch = opts.onlyIfMatch;
      else if (opts.onlyIfNew) o.onlyIfNew = true;
      const r = await s().setJSON(key, data, o);
      return { modified: r?.modified !== false };
    },
    async del(key) { await s().delete(key); },
    async keys(prefix = '') {
      const out = [];
      for await (const page of s().list({ prefix, paginate: true })) {
        for (const b of page.blobs) out.push(b.key);
      }
      return out;
    },
  };
}

const localCache = new Map();
export function store(name) {
  if (!LOCAL_DIR) return blobStore(name);
  if (!localCache.has(name)) localCache.set(name, localStore(name));
  return localCache.get(name);
}

export class Conflict extends Error {}

// Lee → modifica → escribe con control de concurrencia optimista.
// `fn(current)` recibe el valor actual (o null) y devuelve el nuevo valor.
// Si devuelve undefined no se escribe nada. Reintenta si otro proceso escribió en el medio.
export async function update(storeName, key, fn, tries = 6) {
  const s = store(storeName);
  for (let i = 0; i < tries; i++) {
    const cur = await s.get(key);
    const next = await fn(cur ? structuredClone(cur.data) : null);
    if (next === undefined) return cur ? cur.data : null;
    const r = await s.set(key, next, cur ? { onlyIfMatch: cur.etag } : { onlyIfNew: true });
    if (r.modified) return next;
    await new Promise((res) => setTimeout(res, 40 + Math.random() * 120));
  }
  throw new Conflict('Demasiada concurrencia, probá de nuevo.');
}

export async function getJSON(storeName, key) {
  const r = await store(storeName).get(key);
  return r ? r.data : null;
}
