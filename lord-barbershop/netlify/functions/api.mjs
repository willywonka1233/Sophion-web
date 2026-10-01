// API de Lord Barber Shop · Coffee — una sola función que atiende /api/*
import { randomBytes } from 'node:crypto';
import { QR_SERVICE } from '../../public/assets/config.mjs';
import { store, update, getJSON } from '../../server/db.mjs';
import {
  HttpError, signToken, readToken, bearer, hashPin, checkPin, safeEqual,
  adminVersion, randomKey, lockMsFor,
} from '../../server/auth.mjs';
import {
  getSettings, sanitizeSettings, computeSlots, nowLocal, isDate, isHHMM, toMin, toHHMM,
  epochOf, isActive, bookingView, syncUserBooking, applyCut, publicUser, pushHistory,
  addLog, normalizePhone, legacyPhone, membershipActive, normalizeStamps,
} from '../../server/logic.mjs';

const DAY = 24 * 3600e3;
const USER_TTL = 400 * DAY;
const ADMIN_TTL = 30 * DAY;

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function body(req) {
  try { return (await req.json()) || {}; } catch { throw new HttpError(400, 'Pedido inválido.'); }
}

// ---------- sesiones ----------
async function userToken(u) {
  return signToken({ r: 'u', p: u.phone, v: u.tv || 0, iat: Date.now(), exp: Date.now() + USER_TTL });
}

async function requireUser(req) {
  const t = await readToken(bearer(req));
  if (!t || t.r !== 'u') throw new HttpError(401, 'Tu sesión venció. Ingresá de nuevo.');
  const u = await getJSON('users', t.p);
  if (!u || (u.tv || 0) !== t.v) throw new HttpError(401, 'Tu sesión venció. Ingresá de nuevo.');
  return { u, t };
}

async function requireAdmin(req) {
  if (!process.env.ADMIN_PIN) throw new HttpError(503, 'Falta configurar ADMIN_PIN en Netlify.');
  const t = await readToken(bearer(req));
  if (!t || t.r !== 'a' || t.v !== adminVersion()) throw new HttpError(401, 'Sesión de barbero vencida. Ingresá el PIN.');
}

// ---------- NFC ----------
async function getNfc() {
  const s = store('meta');
  const cur = await s.get('nfc');
  if (cur?.data?.key) return cur.data;
  const fresh = { key: randomKey(12), rotatedAt: Date.now() };
  const r = await s.set('nfc', fresh, { onlyIfNew: true });
  return r.modified ? fresh : (await s.get('nfc')).data;
}
const tagUrl = (req, key) => `${new URL(req.url).origin}/sello?k=${key}`;

// ---------- tarjetas del barbero (QR + NFC con código propio) ----------
// Cada tarjeta impresa tiene un código único y su QR/NFC apunta a /t/CODIGO.
// Desde el panel se elige a dónde lleva (validar el corte u otro link) sin reimprimir.
const CODE_ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
function newCode(taken) {
  for (;;) {
    let c = '';
    for (const x of randomBytes(6)) c += CODE_ABC[x % CODE_ABC.length];
    if (!taken.has(c)) return c;
  }
}
function defaultCards() {
  const taken = new Set();
  const mk = (name, variant) => {
    const code = newCode(taken);
    taken.add(code);
    return { code, name, variant, target: 'validate', url: '', active: true, createdAt: Date.now(), uses: 0, lastUsedAt: null };
  };
  return [mk('Tarjeta clara', 'clara'), mk('Tarjeta oscura', 'oscura')];
}
async function getCards() {
  const cur = await getJSON('meta', 'cards');
  if (cur) return cur;
  return update('meta', 'cards', (c) => (c ? undefined : defaultCards()));
}
// link: el de validación de Lord (/t/CODIGO). qr: lo que va impreso en el QR y grabado en el NFC
// (el link de qrlocal si se cargó uno; si no, el de Lord). printCode: el código que se imprime.
function cardView(req, c) {
  const link = `${new URL(req.url).origin}/t/${c.code}`;
  let printCode = c.code;
  if (c.extUrl) {
    try {
      const seg = new URL(c.extUrl).pathname.split('/').filter(Boolean).pop();
      if (seg) { try { printCode = decodeURIComponent(seg); } catch { printCode = seg; } }
    } catch { /* link mal formado: se imprime el código propio */ }
  }
  return { ...c, link, qr: c.extUrl || link, printCode };
}

// Acepta el link completo de qrlocal (u otro servicio https) o solo el código ("lrd1").
function parseExtUrl(v) {
  const raw = String(v ?? '').trim();
  if (!raw) return '';
  const url = /^[a-z0-9_-]{2,40}$/i.test(raw) ? QR_SERVICE + raw : raw;
  let ok = /^https:\/\/[^\s/]+\/\S+$/i.test(url) && url.length <= 300;
  if (ok) { try { ok = new URL(url).protocol === 'https:'; } catch { ok = false; } }
  if (!ok) throw new HttpError(400, `Pegá el código de qrlocal (ej: lrd1) o el link completo (ej: ${QR_SERVICE}lrd1).`);
  return url;
}

async function shortLink(req, code) {
  const card = (await getCards()).find((x) => x.code === code);
  const to = card && card.active && card.target === 'url' && card.url
    ? card.url
    : new URL(`/sello?c=${encodeURIComponent(code)}`, req.url).href;
  return new Response(null, { status: 302, headers: { location: to, 'cache-control': 'no-store' } });
}

async function staffView() {
  const pins = (await getJSON('meta', 'staffpins')) || {};
  const settings = await getSettings();
  return { mode: settings.validation.mode, barbers: settings.barbers.map((x) => ({ id: x.id, name: x.name, hasPin: !!pins[x.id] })) };
}

// Busca la cuenta por celular (forma actual o la anterior, que guardaba el 15).
async function findUser(rawPhone) {
  const p = normalizePhone(rawPhone);
  if (!p) return null;
  const u = await getJSON('users', p);
  if (u) return u;
  const old = legacyPhone(rawPhone);
  return old && old !== p ? getJSON('users', old) : null;
}

// Turno de hoy que corresponde a un corte hecho ahora: el más cercano a la hora actual,
// desde 1 h antes de que empiece hasta 2 h después de que termine.
function bookingForNow(bookings, today) {
  const now = nowLocal().min;
  return (bookings || [])
    .filter((y) => y.date === today && y.status === 'booked' && now >= toMin(y.start) - 60 && now <= toMin(y.end) + 120)
    .sort((p, q) => Math.abs(now - toMin(p.start)) - Math.abs(now - toMin(q.start)))[0];
}

// ---------- validación del corte ----------
const PENDING_TTL = 10 * 60e3;

// Revisa la credencial que viene del QR/NFC: código de tarjeta (c) o clave del link directo (k).
async function checkCredential(b) {
  if (b.c) {
    const code = String(b.c).trim().toLowerCase();
    const card = (await getCards()).find((x) => x.code === code);
    if (!card || !card.active) throw new HttpError(403, 'Esta tarjeta no existe o fue desactivada. Pedile al barbero la nueva.');
    if (card.target !== 'validate') throw new HttpError(403, 'Esta tarjeta no está configurada para validar cortes.');
    return card;
  }
  const nfc = await getNfc();
  if (!b.k || !safeEqual(String(b.k), nfc.key)) {
    throw new HttpError(403, 'Este código NFC ya no es válido. Pedile al barbero que te muestre el nuevo.');
  }
  return null;
}

function cooldownUntil(u, settings) {
  const cd = settings.validation.cooldownHours * 3600e3;
  return cd && u.lastCutAt && Date.now() - u.lastCutAt < cd ? u.lastCutAt + cd : 0;
}

// PIN de validación de cada barbero (distinto del PIN del panel). Se guarda hasheado y nunca se publica.
async function checkStaffPin(u, rawPin, settings) {
  const pins = (await getJSON('meta', 'staffpins')) || {};
  const barbers = settings.barbers.filter((x) => pins[x.id]);
  if (!barbers.length) {
    throw new HttpError(409, 'El local todavía no configuró el PIN de validación. Avisale al barbero.', { need: 'setup' });
  }
  const pin = String(rawPin ?? '').trim();
  if (!pin) throw new HttpError(400, 'Pasale el celu al barbero para que ponga su PIN.', { need: 'pin' });
  if (u.staffLockUntil && Date.now() < u.staffLockUntil) {
    const mins = Math.ceil((u.staffLockUntil - Date.now()) / 60e3);
    throw new HttpError(423, `Demasiados intentos con PIN incorrecto. Probá de nuevo en ${mins} min.`, { need: 'pin' });
  }
  const thr = await getJSON('meta', 'pinthrottle');
  if (thr?.until && Date.now() < thr.until) {
    throw new HttpError(423, 'Hubo demasiados intentos con PIN incorrecto. Esperá unos minutos.', { need: 'pin' });
  }
  if (/^\d{4,6}$/.test(pin)) {
    for (const bb of barbers) {
      if (await checkPin(pin, pins[bb.id].salt, pins[bb.id].hash)) return bb;
    }
  }
  const x = await update('users', u.phone, (y) => {
    if (!y) return undefined;
    y.staffFails = (y.staffFails || 0) + 1;
    const ms = lockMsFor(y.staffFails);
    if (ms) y.staffLockUntil = Date.now() + ms;
    return y;
  });
  await update('meta', 'pinthrottle', (t) => {
    const now = Date.now();
    const cur = t && now - t.start < 10 * 60e3 ? t : { start: now, count: 0 };
    cur.count += 1;
    if (cur.count >= 40) cur.until = now + 10 * 60e3;
    return cur;
  });
  const fails = x?.staffFails || 0;
  if (lockMsFor(fails)) throw new HttpError(423, 'Demasiados intentos con PIN incorrecto. Probá de nuevo en 15 min.', { need: 'pin' });
  throw new HttpError(403, 'PIN del barbero incorrecto.', { need: 'pin', attemptsLeft: 5 - (fails % 5) });
}

// Registra el corte: cooldown, sello/membresía/premio, turno del día, uso de la tarjeta y registro.
async function performCut(phone, settings, { useReward = false, card = null, barber = null }) {
  const today = nowLocal().date;
  let result;
  let booking;
  const fresh = await update('users', phone, (x) => {
    if (!x) throw new HttpError(404, 'El cliente ya no existe.');
    const next = cooldownUntil(x, settings);
    if (next) throw new HttpError(429, 'Ya validaste un corte hace poco.', { nextAt: next });
    result = applyCut(x, settings, { useReward, via: 'nfc', note: barber?.name });
    delete x.staffFails;
    delete x.staffLockUntil;
    booking = bookingForNow(x.bookings, today);
    if (booking) { booking.status = 'done'; booking.validated = true; }
    return x;
  });
  if (booking) {
    await update('bookings', today, (doc) => {
      const it = doc?.items?.find((y) => y.id === booking.id);
      if (!it) return undefined;
      it.status = 'done';
      it.validated = true;
      return doc;
    });
  }
  if (card) {
    await update('meta', 'cards', (cs) => {
      const x = cs?.find((y) => y.code === card.code);
      if (!x) return undefined;
      x.uses = (x.uses || 0) + 1;
      x.lastUsedAt = Date.now();
      return cs;
    });
  }
  await addLog({ phone, name: fresh.name, type: result.type, earned: result.earned, via: 'nfc', card: card?.name || null, barber: barber?.name || null });
  return { result, fresh };
}

// Modo 'approval': el pedido queda pendiente hasta que el barbero lo aprueba en el panel.
async function createPending(u, card, useReward) {
  let id;
  await update('meta', 'pending', (list) => {
    const now = Date.now();
    list = (list || []).filter((p) => now - p.createdAt < 3600e3).slice(-80);
    const open = list.find((p) => p.phone === u.phone && p.status === 'pending' && now - p.createdAt < PENDING_TTL);
    if (open) {
      open.useReward = useReward;
      if (card) open.card = { code: card.code, name: card.name };
      id = open.id;
      return list;
    }
    id = randomKey(10);
    list.push({ id, phone: u.phone, name: u.name, useReward, card: card ? { code: card.code, name: card.name } : null, createdAt: now, status: 'pending' });
    return list;
  });
  return id;
}

// ---------- turnos ----------
async function setBookingStatus(date, id, patch) {
  let item;
  await update('bookings', date, (doc) => {
    const it = doc?.items?.find((x) => x.id === id);
    if (!it) throw new HttpError(404, 'No encontramos ese turno.');
    Object.assign(it, patch);
    item = it;
    return doc;
  });
  if (item.phone) await syncUserBooking(item.phone, item);
  return item;
}

function findService(settings, id) {
  const s = settings.services.find((x) => x.id === id);
  if (!s) throw new HttpError(400, 'Elegí un servicio.');
  return s;
}

// ================= rutas =================
const routes = {
  // ---- público ----
  'GET /config': async () => json(200, { settings: await getSettings(), today: nowLocal().date }),

  'GET /slots': async (req) => {
    const q = new URL(req.url).searchParams;
    const date = q.get('date');
    if (!isDate(date)) throw new HttpError(400, 'Fecha inválida.');
    const settings = await getSettings();
    const svc = findService(settings, q.get('service'));
    const doc = await getJSON('bookings', date);
    const slots = computeSlots(settings, date, doc?.items || [], svc.duration, q.get('barber') || 'any');
    return json(200, { date, slots });
  },

  // ---- clientes ----
  'POST /register': async (req) => {
    const b = await body(req);
    const name = String(b.name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const phone = normalizePhone(b.phone);
    const pin = String(b.pin || '');
    if (name.length < 2) throw new HttpError(400, 'Escribí tu nombre.');
    if (phone.length < 8 || phone.length > 13) throw new HttpError(400, 'Revisá el número: código de área + número, sin 0 ni 15.');
    if (!/^\d{4}$/.test(pin)) throw new HttpError(400, 'El PIN tiene que ser de 4 números.');
    if (await findUser(b.phone)) throw new HttpError(409, 'Ya hay una cuenta con ese número. Ingresá con tu PIN.');
    const n = await update('meta', 'counter', (c) => (c || 0) + 1);
    const { salt, hash } = await hashPin(pin);
    const u = {
      phone, name, memberNo: String(n).padStart(4, '0'), pinSalt: salt, pinHash: hash, tv: 0,
      createdAt: Date.now(), stamps: 0, rewards: 0, rewardsUsed: 0, visits: 0,
      membership: null, bookings: [], history: [{ at: Date.now(), type: 'welcome' }],
    };
    const r = await store('users').set(phone, u, { onlyIfNew: true });
    if (!r.modified) throw new HttpError(409, 'Ya hay una cuenta con ese número. Ingresá con tu PIN.');
    const settings = await getSettings();
    return json(200, { token: await userToken(u), user: publicUser(u, settings) });
  },

  'POST /login': async (req) => {
    const b = await body(req);
    const pin = String(b.pin || '');
    const u = await findUser(b.phone);
    const phone = u?.phone;
    if (!u) throw new HttpError(404, 'No encontramos una cuenta con ese número. ¿Querés crear una?');
    if (u.lockUntil && Date.now() < u.lockUntil) {
      const mins = Math.ceil((u.lockUntil - Date.now()) / 60e3);
      throw new HttpError(429, `Demasiados intentos. Probá de nuevo en ${mins} min o pedile al barbero que te resetee el PIN.`);
    }
    const ok = /^\d{4}$/.test(pin) && await checkPin(pin, u.pinSalt, u.pinHash);
    if (!ok) {
      await update('users', phone, (x) => {
        if (!x) return undefined;
        x.fails = (x.fails || 0) + 1;
        const lock = lockMsFor(x.fails);
        if (lock) x.lockUntil = Date.now() + lock;
        return x;
      });
      throw new HttpError(401, 'PIN incorrecto.');
    }
    let fresh = u;
    if (u.fails || u.lockUntil) {
      fresh = await update('users', phone, (x) => { delete x.fails; delete x.lockUntil; return x; });
    }
    const settings = await getSettings();
    return json(200, { token: await userToken(fresh), user: publicUser(fresh, settings) });
  },

  'GET /me': async (req) => {
    const { u, t } = await requireUser(req);
    const settings = await getSettings();
    const out = { user: publicUser(u, settings) };
    if (Date.now() - (t.iat || 0) > 30 * DAY) out.token = await userToken(u); // renovación silenciosa
    return json(200, out);
  },

  'POST /bookings': async (req) => {
    const { u } = await requireUser(req);
    const b = await body(req);
    const settings = await getSettings();
    const svc = findService(settings, b.serviceId);
    if (!isDate(b.date) || !isHHMM(b.time)) throw new HttpError(400, 'Elegí día y horario.');
    const now = Date.now();
    const upcoming = (u.bookings || []).filter((x) => x.status === 'booked' && epochOf(x.date, x.end) > now);
    if (upcoming.length >= settings.maxActiveBookings) {
      throw new HttpError(409, `Ya tenés ${upcoming.length} turno(s) reservado(s). Cancelá uno para sacar otro.`);
    }
    const wanted = b.barberId && b.barberId !== 'any' ? b.barberId : 'any';
    let created;
    await update('bookings', b.date, (doc) => {
      doc = doc || { items: [] };
      const slot = computeSlots(settings, b.date, doc.items, svc.duration, wanted).find((s) => s.time === b.time);
      if (!slot) throw new HttpError(409, 'Ese horario se acaba de ocupar. Elegí otro.');
      const barberId = wanted === 'any' ? slot.barbers[0] : wanted;
      const barber = settings.barbers.find((x) => x.id === barberId);
      created = {
        id: randomKey(10), date: b.date, start: b.time, end: toHHMM(toMin(b.time) + svc.duration),
        serviceId: svc.id, serviceName: svc.name, price: svc.price, barberId, barberName: barber?.name || '',
        phone: u.phone, name: u.name, status: 'booked', kind: 'client', createdAt: Date.now(),
      };
      doc.items.push(created);
      return doc;
    });
    await syncUserBooking(u.phone, created);
    const fresh = await getJSON('users', u.phone);
    // Si llegaron varias reservas a la vez y se pasó del límite, se deshace esta.
    const active = (fresh.bookings || []).filter((x) => x.status === 'booked' && epochOf(x.date, x.end) > Date.now());
    if (active.length > settings.maxActiveBookings) {
      await setBookingStatus(created.date, created.id, { status: 'cancelled', cancelledBy: 'limit' });
      throw new HttpError(409, `Ya tenés ${settings.maxActiveBookings} turno(s) reservado(s). Cancelá uno para sacar otro.`);
    }
    return json(200, { booking: bookingView(created), user: publicUser(fresh, settings) });
  },

  'POST /bookings/cancel': async (req) => {
    const { u } = await requireUser(req);
    const b = await body(req);
    const settings = await getSettings();
    const mine = (u.bookings || []).find((x) => x.id === b.id);
    if (!mine) throw new HttpError(404, 'No encontramos ese turno.');
    if (mine.status !== 'booked') throw new HttpError(400, 'Ese turno ya no se puede cancelar.');
    const left = epochOf(mine.date, mine.start) - Date.now();
    if (left < settings.cancelLimitHours * 3600e3) {
      throw new HttpError(400, `Faltan menos de ${settings.cancelLimitHours} h. Avisale al barbero por WhatsApp.`);
    }
    await setBookingStatus(mine.date, mine.id, { status: 'cancelled', cancelledBy: 'client' });
    const fresh = await getJSON('users', u.phone);
    return json(200, { user: publicUser(fresh, settings) });
  },

  // Validación del corte. El cliente abre /sello?c=CODIGO (tarjeta) o /sello?k=CLAVE (link directo)
  // y la página llama acá. Para que copiar el link no alcance, se confirma según Ajustes:
  //  - 'pin': el barbero pone su PIN de validación en el celu del cliente.
  //  - 'approval': queda pendiente hasta que el barbero lo aprueba en el panel.
  'POST /validate': async (req) => {
    const { u } = await requireUser(req);
    const b = await body(req);
    const card = await checkCredential(b);
    const settings = await getSettings();
    const next = cooldownUntil(u, settings);
    if (next) throw new HttpError(429, 'Ya validaste un corte hace poco.', { nextAt: next });
    const useReward = b.useReward === true;
    if (useReward && !(normalizeStamps({ ...u }, settings.loyalty.goal).rewards > 0)) {
      throw new HttpError(400, 'No tenés premios disponibles para canjear.');
    }
    if (settings.validation.mode === 'approval') {
      const id = await createPending(u, card, useReward);
      return json(202, { pending: { id } });
    }
    const barber = await checkStaffPin(u, b.staffPin, settings);
    const { result, fresh } = await performCut(u.phone, settings, { useReward, card, barber });
    return json(200, { result, user: publicUser(fresh, settings) });
  },

  // El cliente consulta si el barbero ya aprobó su pedido (modo 'approval').
  'GET /validate/status': async (req) => {
    const { u } = await requireUser(req);
    const id = new URL(req.url).searchParams.get('id');
    const p = ((await getJSON('meta', 'pending')) || []).find((x) => x.id === id && x.phone === u.phone);
    if (!p) throw new HttpError(404, 'No encontramos el pedido. Volvé a apoyar el celu.');
    const status = p.status === 'pending' && Date.now() - p.createdAt > PENDING_TTL ? 'expired' : p.status === 'approving' ? 'pending' : p.status;
    const out = { status };
    if (status === 'approved') {
      const settings = await getSettings();
      out.result = p.result;
      out.user = publicUser(await getJSON('users', u.phone), settings);
    }
    if (status === 'rejected' || status === 'failed') out.error = p.error || 'El barbero no aprobó el corte.';
    return json(200, out);
  },

  // ---- panel del barbero ----
  'POST /admin/login': async (req) => {
    if (!process.env.ADMIN_PIN) throw new HttpError(503, 'Falta configurar ADMIN_PIN en Netlify (Site configuration → Environment variables).');
    const b = await body(req);
    // Bloqueo por IP: un desconocido no puede dejar afuera al barbero. Hay además un tope global alto.
    const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'local')
      .split(',')[0].trim().replace(/[^a-zA-Z0-9.:-]/g, '_').slice(0, 64);
    const lockKey = `adminlock-${ip}`;
    const [lock, global] = await Promise.all([getJSON('meta', lockKey), getJSON('meta', 'adminlock-all')]);
    const until = Math.max(lock?.until || 0, global?.until || 0);
    if (until && Date.now() < until) {
      throw new HttpError(429, `Demasiados intentos. Esperá ${Math.ceil((until - Date.now()) / 60e3)} min.`);
    }
    if (!safeEqual(String(b.pin || ''), process.env.ADMIN_PIN)) {
      await update('meta', lockKey, (l) => {
        const fails = (l?.fails || 0) + 1;
        const ms = lockMsFor(fails);
        return { fails, until: ms ? Date.now() + ms : 0 };
      });
      await update('meta', 'adminlock-all', (g) => {
        const now = Date.now();
        const cur = g && now - g.start < 15 * 60e3 ? g : { start: now, fails: 0 };
        cur.fails += 1;
        if (cur.fails >= 60) cur.until = now + 15 * 60e3;
        return cur;
      });
      throw new HttpError(401, 'PIN incorrecto.');
    }
    if (lock?.fails) await store('meta').set(lockKey, { fails: 0, until: 0 });
    return json(200, { token: await signToken({ r: 'a', v: adminVersion(), iat: Date.now(), exp: Date.now() + ADMIN_TTL }) });
  },

  'GET /admin/day': async (req) => {
    await requireAdmin(req);
    const date = new URL(req.url).searchParams.get('date');
    if (!isDate(date)) throw new HttpError(400, 'Fecha inválida.');
    const doc = await getJSON('bookings', date);
    const items = (doc?.items || []).slice().sort((a, b) => a.start.localeCompare(b.start));
    return json(200, { date, items, today: nowLocal().date });
  },

  // Turno cargado por el barbero (cliente que llamó o vino sin turno) o bloqueo de horario.
  'POST /admin/booking': async (req) => {
    await requireAdmin(req);
    const b = await body(req);
    const settings = await getSettings();
    if (!isDate(b.date) || !isHHMM(b.time)) throw new HttpError(400, 'Elegí día y horario.');
    const block = b.kind === 'block';
    const svc = block ? null : findService(settings, b.serviceId);
    const duration = block ? Math.min(720, Math.max(5, Math.round(Number(b.duration) || 60))) : svc.duration;
    const barberId = b.barberId || null;
    if (!block && !barberId) throw new HttpError(400, 'Elegí el barbero.');
    const barber = settings.barbers.find((x) => x.id === barberId);
    if (barberId && !barber) throw new HttpError(400, 'Ese barbero no existe.');
    const phone = b.phone ? normalizePhone(b.phone) : '';
    const client = phone ? await getJSON('users', phone) : null;
    const start = toMin(b.time);
    const end = start + duration;
    if (end > 24 * 60) throw new HttpError(400, 'El turno pasa de la medianoche.');
    let created;
    await update('bookings', b.date, (doc) => {
      doc = doc || { items: [] };
      const clash = doc.items.filter(isActive).find((it) =>
        (!barberId || !it.barberId || it.barberId === barberId) && start < toMin(it.end) && toMin(it.start) < end);
      if (clash && !b.force) {
        throw new HttpError(409, `Se pisa con ${clash.kind === 'block' ? 'un bloqueo' : clash.name} (${clash.start}).`, { clash: true });
      }
      created = {
        id: randomKey(10), date: b.date, start: b.time, end: toHHMM(end),
        serviceId: svc?.id || null, serviceName: block ? (String(b.name || '').trim().slice(0, 60) || 'Bloqueado') : svc.name,
        price: svc?.price || 0, barberId, barberName: barber?.name || (block ? 'Todos' : ''),
        phone: client ? client.phone : null,
        name: block ? '' : (client?.name || String(b.name || '').trim().slice(0, 40) || 'Cliente'),
        status: 'booked', kind: block ? 'block' : 'manual', createdAt: Date.now(),
      };
      doc.items.push(created);
      return doc;
    });
    if (created.phone) await syncUserBooking(created.phone, created);
    return json(200, { booking: created });
  },

  'POST /admin/booking/status': async (req) => {
    await requireAdmin(req);
    const b = await body(req);
    if (!isDate(b.date) || !b.id) throw new HttpError(400, 'Pedido inválido.');
    if (b.status === 'delete') {
      let removed;
      await update('bookings', b.date, (doc) => {
        const it = doc?.items?.find((x) => x.id === b.id);
        if (!it) throw new HttpError(404, 'No encontramos ese turno.');
        removed = it;
        doc.items = doc.items.filter((x) => x.id !== b.id);
        return doc;
      });
      if (removed.phone) {
        await update('users', removed.phone, (u) => {
          if (!u) return undefined;
          u.bookings = (u.bookings || []).filter((x) => x.id !== b.id);
          return u;
        });
      }
      return json(200, { ok: true });
    }
    if (!['booked', 'done', 'noshow', 'cancelled'].includes(b.status)) throw new HttpError(400, 'Estado inválido.');
    const settings = await getSettings();
    const doc = await getJSON('bookings', b.date);
    const it = doc?.items?.find((x) => x.id === b.id);
    if (!it) throw new HttpError(404, 'No encontramos ese turno.');
    let result = null;
    let already = false;
    const patch = { status: b.status };
    // Reactivar un turno cancelado o ausente: que no se pise con otro que se reservó en ese horario.
    if (b.status === 'booked' && ['cancelled', 'noshow'].includes(it.status) && !b.force) {
      const clash = doc.items.filter((x) => x.id !== it.id && isActive(x) && x.status !== 'noshow').find((x) =>
        (!it.barberId || !x.barberId || x.barberId === it.barberId) && toMin(it.start) < toMin(x.end) && toMin(x.start) < toMin(it.end));
      if (clash) {
        throw new HttpError(409, `Se pisa con ${clash.kind === 'block' ? 'un bloqueo' : clash.name} (${clash.start}).`, { clash: true });
      }
    }
    // "Completar y sumar corte": registra el corte en la tarjeta del cliente (una sola vez por turno).
    // Si el cliente ya validó su corte con la tarjeta hace un rato, no se suma otro.
    if (b.status === 'done' && b.validate && it.phone && !it.validated) {
      await update('users', it.phone, (u) => {
        if (!u) return undefined; // el cliente se eliminó: se marca el turno igual, sin sumar corte
        const cd = settings.validation.cooldownHours * 3600e3;
        if (cd && u.lastCutAt && Date.now() - u.lastCutAt < cd) { already = true; return undefined; }
        result = applyCut(u, settings, { useReward: !!b.useReward, via: 'admin' });
        return u;
      });
      if (result) await addLog({ phone: it.phone, name: it.name, type: result.type, earned: result.earned, via: 'admin' });
      if (result || already) patch.validated = true;
    }
    const item = await setBookingStatus(b.date, b.id, patch);
    return json(200, { booking: item, result, already });
  },

  'GET /admin/clients': async (req) => {
    await requireAdmin(req);
    const q = (new URL(req.url).searchParams.get('q') || '').trim().toLowerCase();
    const settings = await getSettings();
    const keys = await store('users').keys();
    const qDigits = q.replace(/\D/g, '');
    const all = [];
    for (let i = 0; i < keys.length; i += 25) {
      const chunk = await Promise.all(keys.slice(i, i + 25).map((k) => getJSON('users', k)));
      for (const u of chunk) if (u) all.push(u);
    }
    const now = Date.now();
    const list = all
      .filter((u) => !q || u.name.toLowerCase().includes(q) || (qDigits && u.phone.includes(qDigits)) || u.memberNo === q.padStart(4, '0'))
      .sort((a, b) => (b.lastCutAt || b.createdAt) - (a.lastCutAt || a.createdAt))
      .slice(0, 300)
      .map((u) => ({
        phone: u.phone, name: u.name, memberNo: u.memberNo, stamps: u.stamps || 0, rewards: u.rewards || 0,
        visits: u.visits || 0, lastCutAt: u.lastCutAt || null, createdAt: u.createdAt,
        member: membershipActive(u, now) ? u.membership.name : null,
      }));
    return json(200, { total: all.length, clients: list, goal: settings.loyalty.goal });
  },

  'GET /admin/client': async (req) => {
    await requireAdmin(req);
    const phone = normalizePhone(new URL(req.url).searchParams.get('phone'));
    const u = phone && await getJSON('users', phone);
    if (!u) throw new HttpError(404, 'No encontramos ese cliente.');
    const settings = await getSettings();
    return json(200, { user: { ...publicUser(u, settings), history: (u.history || []).slice(0, 80), locked: !!(u.lockUntil && Date.now() < u.lockUntil) } });
  },

  'POST /admin/client': async (req) => {
    await requireAdmin(req);
    const b = await body(req);
    const phone = normalizePhone(b.phone);
    const settings = await getSettings();
    if (b.action === 'delete') {
      const u = await getJSON('users', phone);
      if (!u) throw new HttpError(404, 'No encontramos ese cliente.');
      await store('users').del(phone);
      return json(200, { ok: true });
    }
    let result = null;
    let newPin = null;
    if (b.action === 'pin-reset') {
      newPin = /^\d{4}$/.test(String(b.pin || '')) ? String(b.pin) : String(Math.floor(1000 + Math.random() * 9000));
    }
    const pinData = newPin ? await hashPin(newPin) : null;
    const u = await update('users', phone, (x) => {
      if (!x) throw new HttpError(404, 'No encontramos ese cliente.');
      const goal = settings.loyalty.goal;
      switch (b.action) {
        case 'cut':
          result = applyCut(x, settings, { useReward: !!b.useReward, via: 'admin' });
          break;
        case 'stamp-add':
          x.stamps = (x.stamps || 0) + 1;
          if (x.stamps >= goal) { x.stamps -= goal; x.rewards = (x.rewards || 0) + 1; }
          pushHistory(x, { type: 'stamp-add', via: 'admin' });
          break;
        case 'stamp-remove':
          if ((x.stamps || 0) > 0) x.stamps -= 1;
          else if ((x.rewards || 0) > 0) { x.rewards -= 1; x.stamps = goal - 1; }
          pushHistory(x, { type: 'stamp-remove', via: 'admin' });
          break;
        case 'reward-use':
          if (!(x.rewards > 0)) throw new HttpError(400, 'No tiene premios para canjear.');
          x.rewards -= 1;
          x.rewardsUsed = (x.rewardsUsed || 0) + 1;
          pushHistory(x, { type: 'reward', via: 'admin' });
          break;
        case 'membership': {
          const plan = settings.plans.find((p) => p.id === b.planId);
          if (!plan) throw new HttpError(400, 'Elegí una membresía.');
          const start = Date.now();
          x.membership = { planId: plan.id, name: plan.name, cuts: plan.cuts, used: 0, startsAt: start, expiresAt: start + plan.days * DAY };
          pushHistory(x, { type: 'membership-on', note: plan.name, via: 'admin' });
          break;
        }
        case 'membership-cancel':
          if (x.membership) pushHistory(x, { type: 'membership-off', note: x.membership.name, via: 'admin' });
          x.membership = null;
          break;
        case 'pin-reset':
          x.pinSalt = pinData.salt;
          x.pinHash = pinData.hash;
          x.tv = (x.tv || 0) + 1;
          delete x.fails;
          delete x.lockUntil;
          pushHistory(x, { type: 'pin-reset', via: 'admin' });
          break;
        case 'rename': {
          const name = String(b.name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
          if (name.length < 2) throw new HttpError(400, 'Nombre inválido.');
          x.name = name;
          break;
        }
        default:
          throw new HttpError(400, 'Acción inválida.');
      }
      return x;
    });
    if (result) await addLog({ phone: u.phone, name: u.name, type: result.type, earned: result.earned, via: 'admin' });
    return json(200, { user: publicUser(u, settings), result, pin: newPin });
  },

  'GET /admin/nfc': async (req) => {
    await requireAdmin(req);
    const nfc = await getNfc();
    return json(200, { ...nfc, url: tagUrl(req, nfc.key) });
  },

  'POST /admin/nfc/rotate': async (req) => {
    await requireAdmin(req);
    const nfc = { key: randomKey(12), rotatedAt: Date.now() };
    await store('meta').set('nfc', nfc);
    return json(200, { ...nfc, url: tagUrl(req, nfc.key) });
  },

  'GET /admin/cards': async (req) => {
    await requireAdmin(req);
    return json(200, { cards: (await getCards()).map((c) => cardView(req, c)) });
  },

  'POST /admin/cards': async (req) => {
    await requireAdmin(req);
    const b = await body(req);
    await getCards(); // crea las dos tarjetas iniciales si no existen
    const cards = await update('meta', 'cards', (cs) => {
      cs = cs || [];
      if (b.action === 'create') {
        if (cs.length >= 50) throw new HttpError(400, 'Llegaste al máximo de tarjetas.');
        const taken = new Set(cs.map((x) => x.code));
        let code = String(b.code || '').trim().toLowerCase();
        if (code) {
          if (!/^[a-z0-9-]{3,20}$/.test(code)) throw new HttpError(400, 'El código tiene que tener de 3 a 20 letras, números o guiones.');
          if (taken.has(code)) throw new HttpError(409, 'Ese código ya existe.');
        } else {
          code = newCode(taken);
        }
        cs.push({
          code, name: String(b.name || '').trim().slice(0, 40) || `Tarjeta ${cs.length + 1}`,
          variant: b.variant === 'oscura' ? 'oscura' : 'clara', target: 'validate', url: '',
          active: true, createdAt: Date.now(), uses: 0, lastUsedAt: null,
        });
        return cs;
      }
      const c = cs.find((x) => x.code === b.code);
      if (!c) throw new HttpError(404, 'No encontramos esa tarjeta.');
      if (b.action === 'delete') return cs.filter((x) => x !== c);
      if (b.action !== 'update') throw new HttpError(400, 'Acción inválida.');
      if (b.name !== undefined) c.name = String(b.name).trim().slice(0, 40) || c.name;
      if (b.variant !== undefined) c.variant = b.variant === 'oscura' ? 'oscura' : 'clara';
      if (b.active !== undefined) c.active = !!b.active;
      if (b.extUrl !== undefined) c.extUrl = parseExtUrl(b.extUrl);
      if (b.target === 'url') {
        const url = String(b.url || '').trim();
        if (!/^https:\/\/\S+$/i.test(url) || url.length > 500) throw new HttpError(400, 'Poné un link que empiece con https://');
        c.target = 'url';
        c.url = url;
      } else if (b.target === 'validate') {
        c.target = 'validate';
      }
      return cs;
    });
    return json(200, { cards: cards.map((c) => cardView(req, c)) });
  },

  'GET /admin/pending': async (req) => {
    await requireAdmin(req);
    const now = Date.now();
    const list = ((await getJSON('meta', 'pending')) || [])
      .filter((p) => (p.status === 'pending' || p.status === 'approving') && now - p.createdAt < PENDING_TTL)
      .map(({ id, name, phone, useReward, card, createdAt }) => ({ id, name, phone, useReward, card, createdAt }));
    return json(200, { pending: list });
  },

  'POST /admin/pending': async (req) => {
    await requireAdmin(req);
    const b = await body(req);
    if (!['approve', 'reject'].includes(b.action)) throw new HttpError(400, 'Acción inválida.');
    let item;
    // Se marca primero, así dos aprobaciones al mismo tiempo no suman dos cortes.
    await update('meta', 'pending', (list) => {
      const p = (list || []).find((x) => x.id === b.id);
      if (!p || p.status !== 'pending' || Date.now() - p.createdAt > PENDING_TTL) {
        throw new HttpError(409, 'Ese pedido ya no está pendiente.');
      }
      p.status = b.action === 'approve' ? 'approving' : 'rejected';
      p.decidedAt = Date.now();
      item = { ...p };
      return list;
    });
    if (b.action === 'reject') return json(200, { status: 'rejected' });
    const settings = await getSettings();
    let outcome;
    try {
      const { result } = await performCut(item.phone, settings, { useReward: item.useReward, card: item.card });
      outcome = { status: 'approved', result };
    } catch (e) {
      if (!(e instanceof HttpError)) throw e;
      outcome = { status: 'failed', error: e.message };
    }
    await update('meta', 'pending', (list) => {
      const p = (list || []).find((x) => x.id === item.id);
      if (!p) return undefined;
      Object.assign(p, outcome);
      return list;
    });
    return json(200, { ...outcome, name: item.name });
  },

  'GET /admin/staff': async (req) => {
    await requireAdmin(req);
    return json(200, await staffView());
  },

  'POST /admin/staff': async (req) => {
    await requireAdmin(req);
    const b = await body(req);
    const settings = await getSettings();
    const barber = settings.barbers.find((x) => x.id === b.barberId);
    if (!barber) throw new HttpError(400, 'Guardá primero el barbero en Ajustes.');
    const pin = b.pin == null ? '' : String(b.pin).trim();
    if (pin && !/^\d{4,6}$/.test(pin)) throw new HttpError(400, 'El PIN tiene que tener de 4 a 6 números.');
    const pins = (await getJSON('meta', 'staffpins')) || {};
    if (pin) {
      for (const [id, v] of Object.entries(pins)) {
        if (id !== barber.id && await checkPin(pin, v.salt, v.hash)) throw new HttpError(409, 'Ese PIN ya lo usa otro barbero. Elegí uno distinto.');
      }
    }
    const hashed = pin ? await hashPin(pin) : null;
    await update('meta', 'staffpins', (cur) => {
      const next = { ...(cur || {}) };
      if (hashed) next[barber.id] = { ...hashed, updatedAt: Date.now() };
      else delete next[barber.id];
      return next;
    });
    return json(200, await staffView());
  },

  'GET /admin/log': async (req) => {
    await requireAdmin(req);
    return json(200, { log: ((await getJSON('meta', 'log')) || []).slice(0, 150) });
  },

  'GET /admin/settings': async (req) => {
    await requireAdmin(req);
    return json(200, { settings: await getSettings() });
  },

  'POST /admin/settings': async (req) => {
    await requireAdmin(req);
    const b = await body(req);
    const clean = sanitizeSettings(b.settings);
    await store('meta').set('settings', clean);
    return json(200, { settings: await getSettings() });
  },
};

export default async (req) => {
  const { pathname } = new URL(req.url);
  const path = pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/';
  const handler = routes[`${req.method} ${path}`];
  try {
    if (pathname.startsWith('/t/')) {
      let code = pathname.slice(3);
      try { code = decodeURIComponent(code); } catch { /* código mal escrito */ }
      code = code.replace(/\/+$/, '').trim().toLowerCase();
      return await shortLink(req, code);
    }
    if (!handler) throw new HttpError(404, 'Ruta inexistente.');
    return await handler(req);
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message, ...(e.extra || {}) });
    // Código corto para encontrar el error en los registros de la función (Netlify → Logs → Functions)
    const ref = randomBytes(4).toString('hex');
    console.error(`[api ${ref}] ${req.method} ${pathname}`, e);
    return json(500, { error: 'Algo falló de nuestro lado. Probá de nuevo en un momento.', ref });
  }
};

export const config = { path: ['/api/*', '/t/*'] };
