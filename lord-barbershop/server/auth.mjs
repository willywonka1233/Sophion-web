import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { store } from './db.mjs';

const scrypt = promisify(scryptCb);

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// Secreto para firmar sesiones: LORD_SECRET si está definido; si no, uno aleatorio
// que se genera una sola vez y queda guardado en el almacenamiento.
let secretPromise;
export function getSecret() {
  if (process.env.LORD_SECRET) return Promise.resolve(process.env.LORD_SECRET);
  if (!secretPromise) {
    secretPromise = (async () => {
      const s = store('meta');
      const cur = await s.get('secret');
      if (cur?.data?.value) return cur.data.value;
      const value = randomBytes(32).toString('hex');
      const r = await s.set('secret', { value }, { onlyIfNew: true });
      if (r.modified) return value;
      return (await s.get('secret')).data.value;
    })().catch((e) => { secretPromise = null; throw e; });
  }
  return secretPromise;
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');

export async function signToken(payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = createHmac('sha256', await getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export async function readToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const good = createHmac('sha256', await getSecret()).update(body).digest();
  let given;
  try { given = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (given.length !== good.length || !timingSafeEqual(given, good)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (p.exp && Date.now() > p.exp) return null;
    return p;
  } catch { return null; }
}

export function bearer(req) {
  const h = req.headers.get('authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

export async function hashPin(pin, salt = randomBytes(16).toString('hex')) {
  const hash = (await scrypt(String(pin), salt, 32)).toString('hex');
  return { salt, hash };
}

export async function checkPin(pin, salt, hash) {
  const h = (await scrypt(String(pin), salt, 32));
  const ref = Buffer.from(hash, 'hex');
  return h.length === ref.length && timingSafeEqual(h, ref);
}

export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

// Versión del PIN admin: si se cambia ADMIN_PIN, las sesiones admin viejas dejan de valer.
export function adminVersion() {
  return createHash('sha256').update('lord-admin:' + (process.env.ADMIN_PIN || '')).digest('hex').slice(0, 12);
}

export function randomKey(len = 12) {
  const abc = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += abc[bytes[i] % abc.length];
  return out;
}

// Bloqueo progresivo tras intentos fallidos: 5 fallos → 15 min, 10 → 30 min, … tope 24 h.
export function lockMsFor(fails) {
  if (fails < 5) return 0;
  const steps = Math.floor(fails / 5) - 1;
  return Math.min(15 * 60e3 * 2 ** steps, 24 * 3600e3);
}
