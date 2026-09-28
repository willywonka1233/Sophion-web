import { DEFAULTS, UTC_OFFSET } from '../public/assets/config.mjs';
import { getJSON, update } from './db.mjs';
import { HttpError, randomKey } from './auth.mjs';

// ---------- tiempo (hora de Argentina) ----------
const OFFSET_MIN = (() => {
  const m = /^([+-])(\d\d):(\d\d)$/.exec(UTC_OFFSET);
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
})();

export function nowLocal(ts = Date.now()) {
  const d = new Date(ts + OFFSET_MIN * 60e3);
  return { date: d.toISOString().slice(0, 10), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T12:00:00Z'));
export const isHHMM = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const toHHMM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const dowOf = (date) => new Date(date + 'T12:00:00Z').getUTCDay();
export function addDays(date, n) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const epochOf = (date, hhmm) => Date.parse(`${date}T${hhmm}:00${UTC_OFFSET}`);

// ---------- ajustes ----------
export async function getSettings() {
  const saved = await getJSON('meta', 'settings');
  const s = structuredClone(DEFAULTS);
  if (saved) {
    for (const [k, v] of Object.entries(saved)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) {
        s[k] = { ...s[k], ...v };
      } else if (v !== undefined) {
        s[k] = v;
      }
    }
  }
  return s;
}

const str = (v, max = 120) => String(v ?? '').trim().slice(0, max);
const int = (v, min, max, def) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const slug = (s) => str(s, 40).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || randomKey(6).toLowerCase();
function uniqueIds(list) {
  const seen = new Set();
  for (const it of list) {
    let id = it.id;
    while (seen.has(id)) id = `${it.id}-${randomKey(3).toLowerCase()}`;
    it.id = id;
    seen.add(id);
  }
  return list;
}

// Limpia y valida lo que manda el panel antes de guardarlo.
export function sanitizeSettings(input) {
  const d = DEFAULTS;
  const i = input || {};
  const b = i.business || {};
  const out = {
    business: {
      name: str(b.name, 40) || d.business.name,
      tagline: str(b.tagline, 60),
      instagram: str(b.instagram, 60).replace(/^@/, ''),
      whatsapp: str(b.whatsapp, 20).replace(/\D/g, ''),
      address: str(b.address, 120),
      city: str(b.city, 80),
      mapsUrl: /^https:\/\//.test(str(b.mapsUrl, 400)) ? str(b.mapsUrl, 400) : '',
    },
    slotMinutes: [5, 10, 15, 20, 30, 60].includes(Number(i.slotMinutes)) ? Number(i.slotMinutes) : d.slotMinutes,
    bookingDaysAhead: int(i.bookingDaysAhead, 1, 90, d.bookingDaysAhead),
    minLeadMinutes: int(i.minLeadMinutes, 0, 24 * 60, d.minLeadMinutes),
    cancelLimitHours: int(i.cancelLimitHours, 0, 72, d.cancelLimitHours),
    maxActiveBookings: int(i.maxActiveBookings, 1, 10, d.maxActiveBookings),
    hours: {},
    closedDates: [...new Set((Array.isArray(i.closedDates) ? i.closedDates : []).filter(isDate))].sort().slice(-200),
    barbers: uniqueIds((Array.isArray(i.barbers) ? i.barbers : [])
      .map((x) => ({ id: slug(x.id || x.name), name: str(x.name, 40) }))
      .filter((x) => x.name).slice(0, 12)),
    services: uniqueIds((Array.isArray(i.services) ? i.services : [])
      .map((x) => ({
        id: slug(x.id || x.name),
        name: str(x.name, 50),
        price: int(x.price, 0, 10_000_000, 0),
        duration: int(x.duration, 5, 480, 30),
        desc: str(x.desc, 200),
      }))
      .filter((x) => x.name).slice(0, 30)),
    loyalty: {
      goal: int(i.loyalty?.goal, 2, 50, d.loyalty.goal),
      reward: str(i.loyalty?.reward, 60) || d.loyalty.reward,
    },
    plans: uniqueIds((Array.isArray(i.plans) ? i.plans : [])
      .map((x) => ({
        id: slug(x.id || x.name),
        name: str(x.name, 50),
        price: int(x.price, 0, 10_000_000, 0),
        cuts: int(x.cuts, 1, 60, 4),
        days: int(x.days, 1, 366, 30),
        perks: (Array.isArray(x.perks) ? x.perks : String(x.perks || '').split('\n')).map((p) => str(p, 80)).filter(Boolean).slice(0, 8),
      }))
      .filter((x) => x.name).slice(0, 10)),
    validation: { cooldownHours: int(i.validation?.cooldownHours, 0, 72, d.validation.cooldownHours) },
  };
  for (let day = 0; day < 7; day++) {
    const ranges = Array.isArray(i.hours?.[day]) ? i.hours[day] : [];
    out.hours[day] = ranges
      .filter((r) => Array.isArray(r) && isHHMM(r[0]) && isHHMM(r[1]) && toMin(r[0]) < toMin(r[1]))
      .slice(0, 3)
      .sort((a, b) => toMin(a[0]) - toMin(b[0]));
  }
  if (!out.barbers.length) throw new HttpError(400, 'Tiene que haber al menos un barbero.');
  if (!out.services.length) throw new HttpError(400, 'Tiene que haber al menos un servicio.');
  return out;
}

// ---------- turnero ----------
const overlaps = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;
export const isActive = (it) => it.status !== 'cancelled';

export function dayIsOpen(settings, date) {
  return !settings.closedDates.includes(date) && (settings.hours[dowOf(date)] || []).length > 0;
}

export function computeSlots(settings, date, items, duration, barberId = 'any', now = nowLocal()) {
  if (!isDate(date) || date < now.date || date > addDays(now.date, settings.bookingDaysAhead)) return [];
  if (!dayIsOpen(settings, date)) return [];
  const ids = settings.barbers.map((b) => b.id);
  const barbers = barberId === 'any' || !barberId ? ids : ids.filter((id) => id === barberId);
  const busy = items.filter(isActive);
  const step = settings.slotMinutes;
  const out = [];
  for (const [a, b] of settings.hours[dowOf(date)]) {
    for (let t = toMin(a); t + duration <= toMin(b); t += step) {
      if (date === now.date && t < now.min + settings.minLeadMinutes) continue;
      const free = barbers.filter((bid) => !busy.some((it) =>
        (!it.barberId || it.barberId === bid) && overlaps(t, t + duration, toMin(it.start), toMin(it.end))));
      if (free.length) out.push({ time: toHHMM(t), barbers: free });
    }
  }
  return out;
}

export function bookingView(it) {
  const { id, date, start, end, serviceId, serviceName, price, barberId, barberName, status, kind, validated } = it;
  return { id, date, start, end, serviceId, serviceName, price, barberId, barberName, status, kind, validated: !!validated };
}

// Copia liviana del turno dentro del documento del cliente.
export async function syncUserBooking(phone, it) {
  await update('users', phone, (u) => {
    if (!u) return undefined;
    const list = (u.bookings || []).filter((b) => b.id !== it.id);
    list.push(bookingView(it));
    list.sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
    u.bookings = list.slice(0, 30);
    return u;
  });
}

// ---------- fidelidad y membresía ----------
export function membershipActive(u, ts = Date.now()) {
  const m = u.membership;
  return !!(m && ts < m.expiresAt && m.used < m.cuts);
}

export function pushHistory(u, entry) {
  u.history = [{ at: Date.now(), ...entry }, ...(u.history || [])].slice(0, 80);
}

// Registra un corte: usa premio si se pidió, si no descuenta de la membresía activa,
// y si no suma un sello (cada `goal` sellos se gana un premio).
export function applyCut(u, settings, { useReward = false, via = 'nfc' } = {}) {
  const goal = settings.loyalty.goal;
  let type;
  let earned = false;
  if (useReward) {
    if (!(u.rewards > 0)) throw new HttpError(400, 'No tenés premios disponibles para canjear.');
    u.rewards -= 1;
    u.rewardsUsed = (u.rewardsUsed || 0) + 1;
    type = 'reward';
  } else if (membershipActive(u)) {
    u.membership.used += 1;
    type = 'membership';
  } else {
    u.stamps = (u.stamps || 0) + 1;
    type = 'stamp';
    if (u.stamps >= goal) {
      u.stamps -= goal;
      u.rewards = (u.rewards || 0) + 1;
      earned = true;
    }
  }
  u.visits = (u.visits || 0) + 1;
  u.lastCutAt = Date.now();
  pushHistory(u, { type, via, earned });
  return { type, earned };
}

export function publicUser(u, settings) {
  const now = Date.now();
  const m = u.membership;
  const cd = settings.validation.cooldownHours * 3600e3;
  return {
    phone: u.phone,
    name: u.name,
    memberNo: u.memberNo,
    createdAt: u.createdAt,
    stamps: u.stamps || 0,
    goal: settings.loyalty.goal,
    reward: settings.loyalty.reward,
    rewards: u.rewards || 0,
    rewardsUsed: u.rewardsUsed || 0,
    visits: u.visits || 0,
    lastCutAt: u.lastCutAt || null,
    nextValidationAt: u.lastCutAt && cd ? u.lastCutAt + cd : null,
    membership: m ? {
      planId: m.planId, name: m.name, cuts: m.cuts, used: m.used,
      left: Math.max(0, m.cuts - m.used), startsAt: m.startsAt, expiresAt: m.expiresAt,
      active: membershipActive(u, now), expired: now >= m.expiresAt,
    } : null,
    bookings: u.bookings || [],
    history: (u.history || []).slice(0, 30),
  };
}

export async function addLog(entry) {
  await update('meta', 'log', (log) => [{ at: Date.now(), ...entry }, ...(log || [])].slice(0, 300));
}

export function normalizePhone(raw) {
  let p = String(raw ?? '').replace(/\D/g, '');
  if (p.startsWith('549')) p = p.slice(3);
  else if (p.startsWith('54') && p.length > 11) p = p.slice(2);
  p = p.replace(/^0+/, '');
  return p;
}
