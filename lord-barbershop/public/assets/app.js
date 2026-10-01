// Utilidades compartidas: API, formato, toasts.
import { DEFAULTS, DAY_NAMES, DAY_SHORT, MONTHS } from './config.mjs';

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* modo privado */ } },
};
export { store };

export class ApiError extends Error {
  constructor(status, data) { super(data?.error || 'Error de conexión.'); this.status = status; this.data = data; }
}

export async function api(method, path, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  let r;
  try {
    r = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
  } catch {
    throw new ApiError(0, { error: 'Sin conexión. Revisá tu internet y probá de nuevo.' });
  }
  let data = null;
  try { data = await r.json(); } catch { /* respuesta vacía */ }
  if (!r.ok) throw new ApiError(r.status, data || { error: `Error ${r.status}` });
  return data;
}

// Ajustes públicos del local (si la API no responde, usa los valores por defecto).
let cfgPromise;
export function loadConfig() {
  cfgPromise ||= api('GET', '/config')
    .catch(() => new Promise((r) => setTimeout(r, 1200)).then(() => api('GET', '/config')))
    .then((d) => d.settings)
    .catch(() => {
      cfgPromise = null; // la próxima vez vuelve a intentar en vez de quedarse con los valores de ejemplo
      return { ...structuredClone(DEFAULTS), offline: true };
    });
  return cfgPromise;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const money = (n) => '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR');
export const dur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ''}` : `${m} min`);

export function todayAR() {
  return new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
}
export function addDays(date, n) {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const dowOf = (date) => new Date(date + 'T12:00:00Z').getUTCDay();
export function fmtDay(date, { short = false, withDow = true } = {}) {
  const d = new Date(date + 'T12:00:00Z');
  const dow = short ? DAY_SHORT[d.getUTCDay()] : DAY_NAMES[d.getUTCDay()];
  const txt = `${d.getUTCDate()} de ${MONTHS[d.getUTCMonth()]}`;
  return withDow ? `${dow} ${txt}` : txt;
}
export function relDay(date) {
  const t = todayAR();
  if (date === t) return 'Hoy';
  if (date === addDays(t, 1)) return 'Mañana';
  return fmtDay(date);
}
export function fmtTs(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function fmtTsDate(ts) {
  return new Date(ts).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'long', year: 'numeric' });
}

export function waLink(number, text) {
  const n = String(number || '').replace(/\D/g, '');
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}` : null;
}
export function igLink(user) {
  return user ? `https://instagram.com/${String(user).replace(/^@/, '')}` : null;
}
// Canal de contacto: WhatsApp si está configurado; si no, Instagram.
export function contactLink(settings, text) {
  return waLink(settings.business.whatsapp, text) || igLink(settings.business.instagram) || '#';
}

export function hoursSummary(settings) {
  // Agrupa días consecutivos con el mismo horario: "Lun a Vie · 10:00–13:00 / 16:00–21:00"
  const order = [1, 2, 3, 4, 5, 6, 0];
  const txt = (d) => (settings.hours[d] || []).map(([a, b]) => `${a}–${b === '24:00' ? '00:00' : b}`).join(' / ') || 'Cerrado';
  const groups = [];
  for (const d of order) {
    const t = txt(d);
    const last = groups[groups.length - 1];
    if (last && last.t === t) last.days.push(d); else groups.push({ t, days: [d] });
  }
  return groups.map((g) => ({
    days: g.days.length > 2 ? `${DAY_SHORT[g.days[0]]} a ${DAY_SHORT[g.days[g.days.length - 1]]}` : g.days.map((d) => DAY_SHORT[d]).join(' y '),
    hours: g.t,
    closed: g.t === 'Cerrado',
  }));
}

let toastBox;
export function toast(msg, type = '') {
  if (!toastBox) {
    toastBox = document.createElement('div');
    toastBox.className = 'toasts';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.append(toastBox);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  toastBox.append(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, 3800);
}

// PIN de 4 casillas con autoavance y pegado.
export function pinInput(container) {
  const inputs = [...container.querySelectorAll('input')];
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
      if (inputs.every((x) => x.value)) container.dispatchEvent(new CustomEvent('complete'));
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && inputs[i - 1]) { inputs[i - 1].focus(); inputs[i - 1].value = ''; }
    });
    inp.addEventListener('paste', (e) => {
      const d = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, inputs.length);
      if (!d) return;
      e.preventDefault();
      d.split('').forEach((c, j) => { if (inputs[j]) inputs[j].value = c; });
      (inputs[d.length] || inputs[inputs.length - 1]).focus();
      if (inputs.every((x) => x.value)) container.dispatchEvent(new CustomEvent('complete'));
    });
  });
  return {
    get value() { return inputs.map((x) => x.value).join(''); },
    clear() { inputs.forEach((x) => { x.value = ''; }); },
    focus() { inputs[0].focus(); },
  };
}

// Sello con corona (SVG) para la tarjeta.
export const CROWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 7.5l4.2 3.6L12 4l4.8 7.1L21 7.5l-1.8 10H4.8L3 7.5zm2 11.5h14v2H5z"/></svg>';
