import {
  api, loadConfig, store, esc, money, dur, todayAR, addDays, dowOf, relDay, fmtTs, fmtTsDate,
  waLink, toast, pinInput, CROWN,
} from './app.js';
import { DAY_SHORT, MONTHS } from './config.mjs';

const $ = (id) => document.getElementById(id);
const settings = await loadConfig();

// ---------------- estado ----------------
let token = store.get('lord.token');
let user = (() => { try { return JSON.parse(store.get('lord.user') || 'null'); } catch { return null; } })();
const params = new URLSearchParams(location.search);
const sealKey = params.get('k');
let sealPending = !!sealKey;
const TABS = ['tarjeta', 'reservar', 'turnos'];
let tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'tarjeta';
const bk = { serviceId: null, barberId: 'any', date: null, time: null, slots: null, req: 0 };
if (params.get('servicio')) bk.serviceId = params.get('servicio');

function saveSession(t, u) {
  if (t) { token = t; store.set('lord.token', t); }
  if (u) { user = u; store.set('lord.user', JSON.stringify(u)); }
}
function clearSession() {
  token = null; user = null;
  store.set('lord.token', null); store.set('lord.user', null);
}

const epoch = (date, hhmm) => Date.parse(`${date}T${hhmm}:00-03:00`);
const upcoming = () => (user?.bookings || [])
  .filter((b) => b.status === 'booked' && epoch(b.date, b.end) > Date.now())
  .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
const past = () => (user?.bookings || [])
  .filter((b) => !(b.status === 'booked' && epoch(b.date, b.end) > Date.now()))
  .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));

// ---------------- vistas ----------------
function show(view) {
  for (const v of ['vLoading', 'vAuth', 'vApp']) $(v).hidden = v !== view;
  $('tabbar').hidden = view !== 'vApp';
  $('avatarBtn').hidden = view !== 'vApp';
}

function setTab(t, { scroll = true } = {}) {
  tab = TABS.includes(t) ? t : 'tarjeta';
  for (const name of TABS) {
    $(`tab-${name}`).hidden = name !== tab;
    $(`tb-${name}`).setAttribute('aria-selected', String(name === tab));
  }
  if (location.hash !== `#${tab}`) history.replaceState(null, '', `${location.pathname}${location.search}#${tab}`);
  render(tab);
  if (scroll) scrollTo({ top: 0, behavior: 'instant' });
}
$('tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) setTab(b.dataset.tab);
});
addEventListener('hashchange', () => {
  const t = location.hash.slice(1);
  if (TABS.includes(t) && t !== tab && !$('vApp').hidden) setTab(t);
});

function render(which = tab) {
  if (!user) return;
  $('avatarBtn').textContent = initials(user.name);
  if (which === 'tarjeta') renderCard();
  if (which === 'reservar') renderBooking();
  if (which === 'turnos') renderTurnos();
}

const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const monthYear = (ts) => { const d = new Date(ts); return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
const stampCols = (goal) => (goal <= 5 ? goal : goal % 5 === 0 ? 5 : goal % 4 === 0 ? 4 : 5);
const GIFT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1.5S10 7 12 7zm0 0c1.5-3 5-3.5 5-1.5S14 7 12 7z"/></svg>';
const NFC = '<svg class="lcard-nfc" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M8.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 1 0 12.8M15.5 8.5a5 5 0 0 1 0 7M18.4 5.6a9 9 0 0 1 0 12.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>';

function stampsHtml(n, goal, fresh = -1) {
  let h = '';
  for (let i = 0; i < goal; i++) {
    const on = i < n;
    const last = i === goal - 1;
    h += `<span class="stamp ${on ? 'on' : last ? 'gift' : ''} ${i === fresh ? 'new' : ''}">${on || !last ? CROWN : GIFT}</span>`;
  }
  return `<div class="stamps" style="grid-template-columns:repeat(${stampCols(goal)},1fr)" role="img" aria-label="${n} de ${goal} cortes">${h}</div>`;
}

const HIST = {
  welcome: () => 'Te sumaste al Club Lord',
  stamp: (h) => (h.earned ? 'Corte sumado · ¡ganaste un premio!' : 'Corte sumado a la tarjeta'),
  reward: () => 'Canjeaste tu corte gratis',
  membership: () => 'Corte de membresía',
  'stamp-add': () => 'El barbero sumó un sello',
  'stamp-remove': () => 'El barbero corrigió un sello',
  'membership-on': (h) => `Membresía activada · ${h.note || ''}`,
  'membership-off': (h) => `Membresía finalizada · ${h.note || ''}`,
  'pin-reset': () => 'PIN reseteado por el barbero',
};

function bookingHtml(b, { actions = false } = {}) {
  const d = new Date(b.date + 'T12:00:00Z');
  const future = b.status === 'booked' && epoch(b.date, b.end) > Date.now();
  const pill = {
    booked: future ? '<span class="pill ok">Confirmado</span>' : '<span class="pill dim">Pasado</span>',
    done: '<span class="pill">Realizado</span>',
    cancelled: '<span class="pill dim">Cancelado</span>',
    noshow: '<span class="pill bad">Ausente</span>',
  }[b.status] || '';
  const canCancel = future && epoch(b.date, b.start) - Date.now() >= settings.cancelLimitHours * 3600e3;
  const right = actions && future
    ? (canCancel ? `<button class="btn btn-ghost" data-cancel="${esc(b.id)}">Cancelar</button>` : pill)
    : pill;
  return `<div class="booking ${future ? '' : 'bk-past'}">
    <div class="bk-date"><b>${d.getUTCDate()}</b><small>${MONTHS[d.getUTCMonth()].slice(0, 3)}</small></div>
    <div class="bk-info"><b>${esc(b.start)} · ${esc(b.serviceName)}</b><span>${esc(relDay(b.date))}${b.barberName ? ` · con ${esc(b.barberName)}` : ''}</span></div>
    <div>${right}</div>
  </div>`;
}

// ---------------- tarjeta ----------------
function renderCard() {
  const u = user;
  const left = u.goal - u.stamps;
  const m = u.membership;
  const next = upcoming()[0];
  let memberHtml = '';
  if (m && !m.expired) {
    memberHtml = `<div class="member">
      <div class="member-top"><b>${esc(m.name)}</b>${m.active ? '<span class="pill ok">Activa</span>' : '<span class="pill warn">Sin cortes</span>'}</div>
      <div class="bar"><i style="width:${(m.left / m.cuts) * 100}%"></i></div>
      <small>Te quedan <b>${m.left}</b> de ${m.cuts} cortes · vence el ${esc(fmtTsDate(m.expiresAt))}</small>
    </div>`;
  } else if (m && m.expired) {
    memberHtml = `<div class="member"><div class="member-top"><b>${esc(m.name)}</b><span class="pill dim">Vencida</span></div>
      <small>Renovala en el local y seguí sumando.</small></div>`;
  }
  $('tab-tarjeta').innerHTML = `
    <div class="hello"><div><small>Hola,</small><h1>${esc(u.name.split(' ')[0])}</h1></div><small>Socio Nº ${esc(u.memberNo)}</small></div>
    <div class="lcard">
      <div class="lcard-top"><img src="/assets/img/emblem.png" alt="" width="28" height="36"><div><b>LORD</b><small>Club Lord</small></div>${NFC}</div>
      <div class="lcard-name">${esc(u.name)}<small>Socio Nº ${esc(u.memberNo)} · desde ${monthYear(u.createdAt)}</small></div>
      ${stampsHtml(u.stamps, u.goal)}
      <div class="lcard-foot"><span><b>${u.stamps}</b> / ${u.goal} cortes</span><span>${left === 1 ? 'Te falta 1' : `Te faltan ${left}`} para tu premio</span></div>
    </div>
    ${u.rewards > 0 ? `<div class="reward"><span class="big">${u.rewards}×</span><div><b>${esc(u.reward)} disponible${u.rewards > 1 ? 's' : ''}</b><span>La próxima vez que apoyes el celu en el NFC, elegí “Usar mi premio”.</span></div></div>` : ''}
    ${memberHtml}

    <div class="sec-title"><h2>Próximo turno</h2>${next ? '<a href="#turnos">Ver todos</a>' : ''}</div>
    ${next ? bookingHtml(next) : `<div class="empty">No tenés turnos reservados.<a class="btn btn-gold btn-sm" href="#reservar">Reservar turno</a></div>`}

    <div class="sec-title"><h2>Cómo sumar tu corte</h2></div>
    <div class="panel howto">
      <span class="howto-ic">${NFC.replace('lcard-nfc', '')}</span>
      <div><b>Apoyá el celu en el NFC del barbero</b>
      <p>Al terminar, acercá la parte de arriba del iPhone (o el centro de la espalda en Android) al tag Lord. Se abre esta página y el corte se suma solo.</p>
      <p style="margin-top:6px">¿Tu celu no tiene NFC? Pedile al barbero que te muestre el QR.</p></div>
    </div>

    <div class="sec-title"><h2>Movimientos</h2></div>
    ${u.history.length ? `<ul class="hist">${u.history.slice(0, 12).map((h) => `<li><span>${esc((HIST[h.type] || (() => h.type))(h))}</span><span>${esc(fmtTs(h.at))}</span></li>`).join('')}</ul>` : '<div class="empty">Todavía no hay movimientos.</div>'}
  `;
}

// ---------------- mis turnos ----------------
function renderTurnos() {
  const up = upcoming();
  const old = past().slice(0, 15);
  const wa = waLink(settings.business.whatsapp, 'Hola! Necesito cambiar mi turno en Lord');
  $('tab-turnos').innerHTML = `
    <div class="hello"><h1>Mis turnos</h1></div>
    <div class="sec-title" style="margin-top:6px"><h2>Próximos</h2><a href="#reservar">+ Nuevo</a></div>
    ${up.length ? up.map((b) => bookingHtml(b, { actions: true })).join('') : `<div class="empty">No tenés turnos reservados.<a class="btn btn-gold btn-sm" href="#reservar">Reservar turno</a></div>`}
    ${up.length ? `<p class="hint" style="margin:10px 2px 0">Podés cancelar hasta ${settings.cancelLimitHours} h antes.${wa ? ` Si falta menos, <a href="${esc(wa)}" target="_blank" rel="noopener" style="color:var(--gold-hi)">avisanos por WhatsApp</a>.` : ''}</p>` : ''}
    <div class="sec-title"><h2>Anteriores</h2></div>
    ${old.length ? old.map((b) => bookingHtml(b)).join('') : '<div class="empty">Acá vas a ver tus turnos pasados.</div>'}
  `;
}
$('tab-turnos').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-cancel]');
  if (!btn) return;
  const b = user.bookings.find((x) => x.id === btn.dataset.cancel);
  if (!b || !confirm(`¿Cancelar tu turno del ${relDay(b.date).toLowerCase()} a las ${b.start}?`)) return;
  btn.disabled = true;
  try {
    const r = await api('POST', '/bookings/cancel', { id: b.id }, token);
    saveSession(null, r.user);
    toast('Turno cancelado.', 'ok');
    render();
  } catch (err) {
    toast(err.message, 'bad');
    btn.disabled = false;
    if (err.status === 401) logout();
  }
});

// ---------------- reservar ----------------
function openDays() {
  const out = [];
  const t = todayAR();
  for (let i = 0; i <= settings.bookingDaysAhead; i++) {
    const date = addDays(t, i);
    const open = !settings.closedDates.includes(date) && (settings.hours[dowOf(date)] || []).length > 0;
    out.push({ date, open });
  }
  return out;
}

function renderBooking() {
  const svcs = settings.services;
  if (!svcs.find((s) => s.id === bk.serviceId)) bk.serviceId = svcs[0]?.id;
  const days = openDays();
  if (!bk.date || !days.find((d) => d.date === bk.date && d.open)) bk.date = days.find((d) => d.open)?.date || null;
  const full = upcoming().length >= settings.maxActiveBookings;
  const multi = settings.barbers.length > 1;
  let n = 0;
  $('tab-reservar').innerHTML = `
    <div class="hello"><h1>Reservar turno</h1></div>
    ${full ? `<div class="notice">Ya tenés ${upcoming().length} turno(s) reservado(s). Cancelá uno en “Mis turnos” para sacar otro.</div>` : ''}
    <div class="step">
      <div class="step-h"><i>${++n}</i>Servicio</div>
      <div class="opts" data-group="service">
        ${svcs.map((s) => `<button type="button" class="opt" data-val="${esc(s.id)}" aria-pressed="${s.id === bk.serviceId}">
          <span class="opt-radio"></span>
          <span class="opt-main"><b>${esc(s.name)}</b><span>${dur(s.duration)}${s.desc ? ` · ${esc(s.desc)}` : ''}</span></span>
          <span class="opt-price">${s.price ? money(s.price) : ''}</span>
        </button>`).join('')}
      </div>
    </div>
    ${multi ? `<div class="step">
      <div class="step-h"><i>${++n}</i>Barbero</div>
      <div class="chips" data-group="barber">
        <button type="button" class="chip" data-val="any" aria-pressed="${bk.barberId === 'any'}">Cualquiera</button>
        ${settings.barbers.map((b) => `<button type="button" class="chip" data-val="${esc(b.id)}" aria-pressed="${b.id === bk.barberId}">${esc(b.name)}</button>`).join('')}
      </div>
    </div>` : ''}
    <div class="step">
      <div class="step-h"><i>${++n}</i>Día</div>
      <div class="days" data-group="day">
        ${days.map((d) => { const dt = new Date(d.date + 'T12:00:00Z'); return `<button type="button" class="day" data-val="${d.date}" ${d.open ? '' : 'disabled'} aria-pressed="${d.date === bk.date}" aria-label="${esc(relDay(d.date))}${d.open ? '' : ' (cerrado)'}">
          <small>${d.date === todayAR() ? 'Hoy' : DAY_SHORT[dt.getUTCDay()]}</small><b>${dt.getUTCDate()}</b></button>`; }).join('')}
      </div>
    </div>
    <div class="step">
      <div class="step-h"><i>${++n}</i>Horario</div>
      <div id="slotBox"></div>
    </div>
    <div class="confirm-bar" id="confirmBar" hidden></div>
  `;
  const sel = $('tab-reservar').querySelector('.day[aria-pressed="true"]');
  if (sel) sel.scrollIntoView({ inline: 'center', block: 'nearest' });
  loadSlots();
}

$('tab-reservar').addEventListener('click', (e) => {
  const b = e.target.closest('[data-val]');
  const group = b?.closest('[data-group]')?.dataset.group;
  if (b && group) {
    if (group === 'service') bk.serviceId = b.dataset.val;
    if (group === 'barber') bk.barberId = b.dataset.val;
    if (group === 'day') bk.date = b.dataset.val;
    b.closest('[data-group]').querySelectorAll('[data-val]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    bk.time = null;
    loadSlots();
    return;
  }
  const slot = e.target.closest('[data-time]');
  if (slot) {
    bk.time = slot.dataset.time;
    $('slotBox').querySelectorAll('[data-time]').forEach((x) => x.setAttribute('aria-pressed', String(x === slot)));
    renderConfirm();
    return;
  }
  if (e.target.closest('#confirmBtn')) confirmBooking();
});

async function loadSlots() {
  const box = $('slotBox');
  $('confirmBar').hidden = true;
  if (!bk.date) { box.innerHTML = '<div class="empty">No hay días disponibles por ahora.</div>'; return; }
  box.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  const id = ++bk.req;
  try {
    const q = new URLSearchParams({ date: bk.date, service: bk.serviceId, barber: bk.barberId });
    const r = await api('GET', `/slots?${q}`);
    if (id !== bk.req) return;
    bk.slots = r.slots;
  } catch (err) {
    if (id !== bk.req) return;
    box.innerHTML = `<div class="empty">${esc(err.message)}<button class="btn btn-line btn-sm" id="retrySlots">Reintentar</button></div>`;
    $('retrySlots').onclick = loadSlots;
    return;
  }
  if (!bk.slots.length) {
    box.innerHTML = `<div class="empty">No quedan horarios libres ${relDay(bk.date) === 'Hoy' ? 'hoy' : 'este día'}. Probá otro día${settings.barbers.length > 1 && bk.barberId !== 'any' ? ' u otro barbero' : ''}.</div>`;
    return;
  }
  const groups = [['Mañana', (t) => t < '13:00'], ['Tarde', (t) => t >= '13:00' && t < '19:00'], ['Noche', (t) => t >= '19:00']];
  box.innerHTML = groups.map(([name, fn]) => {
    const list = bk.slots.filter((s) => fn(s.time));
    return list.length ? `<div class="slot-group"><h4>${name}</h4><div class="slots">${list.map((s) => `<button type="button" class="slot" data-time="${s.time}" aria-pressed="${s.time === bk.time}">${s.time}</button>`).join('')}</div></div>` : '';
  }).join('');
  if (bk.time && bk.slots.some((s) => s.time === bk.time)) renderConfirm();
}

function renderConfirm() {
  const bar = $('confirmBar');
  const s = settings.services.find((x) => x.id === bk.serviceId);
  const barber = settings.barbers.find((x) => x.id === bk.barberId);
  const full = upcoming().length >= settings.maxActiveBookings;
  bar.innerHTML = `<p><b>${esc(s.name)}</b> · ${esc(relDay(bk.date))} a las <b>${bk.time}</b>${barber ? ` con ${esc(barber.name)}` : ''}${s.price ? ` · ${money(s.price)}` : ''}</p>
    <button class="btn btn-gold btn-block" id="confirmBtn" ${full ? 'disabled' : ''}>Confirmar turno</button>`;
  bar.hidden = false;
  bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function confirmBooking() {
  const btn = $('confirmBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const r = await api('POST', '/bookings', { date: bk.date, time: bk.time, serviceId: bk.serviceId, barberId: bk.barberId }, token);
    saveSession(null, r.user);
    bk.time = null;
    showDone(r.booking);
    renderBooking();
  } catch (err) {
    toast(err.message, 'bad');
    if (err.status === 401) return logout();
    bk.time = null;
    loadSlots();
  }
}

function calendarLink(b) {
  const s = new Date(`${b.date}T${b.start}:00-03:00`);
  const e = new Date(`${b.date}T${b.end}:00-03:00`);
  const loc = [settings.business.address, settings.business.city].filter(Boolean).join(', ');
  const title = `Turno en Lord · ${b.serviceName}`;
  if (/iPhone|iPad|Macintosh/.test(navigator.userAgent)) {
    const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lord//Turnos//ES', 'BEGIN:VEVENT', `UID:${b.id}@lord`,
      `DTSTAMP:${f(new Date())}`, `DTSTART:${f(s)}`, `DTEND:${f(e)}`, `SUMMARY:${title}`,
      loc ? `LOCATION:${loc}` : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    return { href: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`, download: 'turno-lord.ics' };
  }
  const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return { href: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(s)}/${f(e)}${loc ? `&location=${encodeURIComponent(loc)}` : ''}` };
}

function showDone(b) {
  const cal = calendarLink(b);
  const wa = waLink(settings.business.whatsapp, `Hola! Soy ${user.name}. Reservé un turno de ${b.serviceName} para el ${relDay(b.date).toLowerCase()} a las ${b.start}.`);
  $('doneBox').innerHTML = `
    <div class="seal-mark" style="margin:0 auto"><span class="core">${CROWN}</span></div>
    <h2 class="display" id="doneTitle" style="font-size:28px">¡Turno reservado!</h2>
    <p class="muted"><b style="color:var(--text)">${esc(b.serviceName)}</b><br>${esc(relDay(b.date))} a las <b style="color:var(--gold-hi)">${b.start}</b>${b.barberName ? ` con ${esc(b.barberName)}` : ''}</p>
    <a class="btn btn-line btn-block" href="${esc(cal.href)}" ${cal.download ? `download="${cal.download}"` : 'target="_blank" rel="noopener"'}>Agregar al calendario</a>
    ${wa ? `<a class="btn btn-line btn-block" href="${esc(wa)}" target="_blank" rel="noopener">Avisar por WhatsApp</a>` : ''}
    <button class="btn btn-gold btn-block" data-close>Listo</button>`;
  openModal('doneModal');
}

// ---------------- validación NFC ----------------
function sealShow(html) {
  $('sealBox').innerHTML = html;
  $('seal').hidden = false;
  document.body.style.overflow = 'hidden';
  $('sealBox').querySelector('button,a')?.focus({ preventScroll: true });
}
function sealClose() {
  $('seal').hidden = true;
  document.body.style.overflow = '';
  history.replaceState(null, '', '/cuenta#tarjeta');
  setTab('tarjeta');
}
$('seal').addEventListener('click', (e) => {
  const a = e.target.closest('[data-seal]');
  if (!a) return;
  if (a.dataset.seal === 'close') sealClose();
  if (a.dataset.seal === 'reward') validate(true);
  if (a.dataset.seal === 'stamp') validate(false);
  if (a.dataset.seal === 'retry') validate(false);
});

const WAIT = `<div class="seal-mark wait"><span class="core">${CROWN}</span></div>`;
const burst = () => Array.from({ length: 16 }, (_, i) => `<i class="burst" style="--a:${i * 22.5}deg;animation-delay:${0.25 + (i % 3) * 0.05}s"></i>`).join('');

function startSeal() {
  sealPending = false;
  if (user.rewards > 0) {
    sealShow(`${WAIT.replace(' wait', '')}
      <h1 id="sealTitle">¡Tenés un premio!</h1>
      <p>Tenés <b>${user.rewards} × ${esc(user.reward.toLowerCase())}</b>. ¿Querés usarlo en este corte?</p>
      <div class="seal-actions">
        <button class="btn btn-gold btn-block" data-seal="reward">Usar mi premio</button>
        <button class="btn btn-line btn-block" data-seal="stamp">No, sumar el corte a la tarjeta</button>
      </div>`);
    return;
  }
  validate(false);
}

async function validate(useReward) {
  sealShow(`${WAIT}<h1 id="sealTitle">Validando tu corte…</h1><p>Un segundo.</p>`);
  try {
    const r = await api('POST', '/validate', { k: sealKey, useReward }, token);
    history.replaceState(null, '', '/cuenta#tarjeta'); // así recargar no intenta validar de nuevo
    saveSession(null, r.user);
    navigator.vibrate?.([30, 60, 30]);
    const u = r.user;
    let title;
    let text;
    let extra = '';
    if (r.result.type === 'reward') {
      title = '¡Disfrutá tu premio!';
      text = `Canjeaste tu <b>${esc(u.reward.toLowerCase())}</b>. Gracias por elegir Lord.`;
    } else if (r.result.type === 'membership') {
      const m = u.membership;
      title = '¡Corte de membresía!';
      text = `Te ${m.left === 1 ? 'queda' : 'quedan'} <b>${m.left} de ${m.cuts}</b> cortes de tu ${esc(m.name)}. Vence el ${esc(fmtTsDate(m.expiresAt))}.`;
    } else if (r.result.earned) {
      title = '¡Completaste tu tarjeta!';
      text = `Ganaste <b>${esc(u.reward.toLowerCase())}</b>. Usalo la próxima vez que apoyes el celu.`;
      extra = stampsHtml(u.goal, u.goal, u.goal - 1);
    } else {
      const left = u.goal - u.stamps;
      title = '¡Corte sumado!';
      text = `Llevás <b>${u.stamps} de ${u.goal}</b>. ${left === 1 ? 'Te falta 1' : `Te faltan ${left}`} para tu ${esc(u.reward.toLowerCase())}.`;
      extra = stampsHtml(u.stamps, u.goal, u.stamps - 1);
    }
    sealShow(`<div class="seal-mark"><span class="ring"></span><span class="ring"></span><span class="core">${CROWN}</span>${burst()}</div>
      <h1 id="sealTitle">${title}</h1><p>${text}</p>${extra}
      <div class="seal-actions"><button class="btn btn-gold btn-block" data-seal="close">Ver mi tarjeta</button></div>`);
  } catch (err) {
    if (err.status === 401) {
      clearSession();
      sealPending = true;
      $('seal').hidden = true;
      document.body.style.overflow = '';
      showAuth();
      toast(err.message, 'bad');
      return;
    }
    let title = 'No pudimos validar';
    let text = esc(err.message);
    let btn = '<button class="btn btn-gold btn-block" data-seal="retry">Reintentar</button>';
    if (err.status === 429) {
      title = 'Este corte ya está sumado';
      text = err.data?.nextAt
        ? `Ya registraste un corte hace poco. Vas a poder validar otro desde el ${esc(fmtTs(err.data.nextAt))}.`
        : 'Ya registraste un corte hace poco.';
      btn = '';
      history.replaceState(null, '', '/cuenta#tarjeta');
    } else if (err.status === 403) {
      title = 'Código vencido';
      btn = '';
    }
    sealShow(`<div class="seal-mark bad"><span class="core">${CROWN}</span></div>
      <h1 id="sealTitle">${title}</h1><p>${text}</p>
      <div class="seal-actions">${btn}<button class="btn btn-line btn-block" data-seal="close">Ver mi tarjeta</button></div>`);
  }
}

// ---------------- ingresar / registrarse ----------------
const pin = pinInput($('pinBox'));
let mode = store.get('lord.known') ? 'login' : 'register';

function setMode(m) {
  mode = m;
  document.querySelectorAll('.seg [data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
  $('fName').hidden = m !== 'register';
  $('authSubmit').textContent = m === 'register' ? 'Crear mi cuenta' : 'Ingresar';
  $('pinLabel').textContent = m === 'register' ? 'Elegí un PIN de 4 números' : 'Tu PIN de 4 números';
  $('pinHint').textContent = m === 'register'
    ? 'Lo vas a usar si cambiás de celular. Elegí uno fácil de recordar.'
    : '¿Te olvidaste el PIN? Pedile al barbero que te lo resetee.';
  $('authErr').textContent = '';
}
document.querySelector('.seg').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mode]');
  if (b) setMode(b.dataset.mode);
});

function showAuth() {
  show('vAuth');
  setMode(mode);
  const n = $('authNotice');
  if (sealPending) {
    $('authNoticeTxt').textContent = 'Ingresá o creá tu cuenta para sumar este corte.';
    n.hidden = false;
  } else if (tab === 'reservar') {
    $('authNoticeTxt').textContent = 'Creá tu cuenta (o ingresá) para reservar tu turno. Es un minuto.';
    n.hidden = false;
  } else n.hidden = true;
}

$('pinBox').addEventListener('complete', () => {
  if (mode === 'login' && $('inPhone').value.replace(/\D/g, '').length >= 8) $('authForm').requestSubmit();
});

$('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('authErr');
  err.textContent = '';
  const phone = $('inPhone').value;
  const name = $('inName').value.trim();
  if (mode === 'register' && name.length < 2) { err.textContent = 'Escribí tu nombre.'; $('inName').focus(); return; }
  if (phone.replace(/\D/g, '').length < 8) { err.textContent = 'Escribí tu celular con código de área.'; $('inPhone').focus(); return; }
  if (pin.value.length !== 4) { err.textContent = 'El PIN tiene 4 números.'; pin.focus(); return; }
  const btn = $('authSubmit');
  const label = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';
  try {
    const r = await api('POST', mode === 'register' ? '/register' : '/login', { name, phone, pin: pin.value }, token);
    saveSession(r.token, r.user);
    store.set('lord.known', '1');
    pin.clear();
    enterApp();
    if (mode === 'register') toast(`¡Bienvenido al Club Lord, ${r.user.name.split(' ')[0]}!`, 'ok');
  } catch (ex) {
    err.textContent = ex.message;
    if (ex.status === 409 && mode === 'register') setTimeout(() => { setMode('login'); err.textContent = ex.message; }, 50);
    pin.clear();
    pin.focus();
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
});

// ---------------- cuenta ----------------
function openModal(id) {
  const m = $(id);
  m.classList.add('open');
  m.querySelector('button,a')?.focus({ preventScroll: true });
}
function closeModals() { document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open')); }
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]') || e.target.classList.contains('modal')) closeModals();
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

$('avatarBtn').addEventListener('click', () => {
  const u = user;
  const rows = [
    ['Nombre', u.name], ['Celular', u.phone], ['Socio Nº', u.memberNo],
    ['Cortes en Lord', u.visits], ['Premios canjeados', u.rewardsUsed],
  ];
  $('acctRows').innerHTML = rows.map(([k, v]) => `<div class="acct-row"><span>${k}</span><span>${esc(v)}</span></div>`).join('');
  openModal('acctModal');
});
function logout() {
  clearSession();
  closeModals();
  mode = 'login';
  showAuth();
}
$('logoutBtn').addEventListener('click', logout);

// ---------------- arranque ----------------
async function refresh() {
  try {
    const r = await api('GET', '/me', null, token);
    saveSession(r.token, r.user);
    return true;
  } catch (err) {
    if (err.status === 401) { clearSession(); toast(err.message, 'bad'); return false; }
    return !!user; // sin conexión: seguimos con lo guardado
  }
}

function enterApp() {
  show('vApp');
  setTab(tab);
  if (sealPending) startSeal();
}

if (token) {
  if (user && !sealPending) {
    enterApp();
    refresh().then((ok) => { if (!ok) showAuth(); else if (tab !== 'reservar') render(); });
  } else {
    show('vLoading');
    if (await refresh()) enterApp(); else showAuth();
  }
} else {
  showAuth();
}
