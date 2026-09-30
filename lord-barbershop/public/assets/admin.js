import { api, store, esc, money, dur, todayAR, addDays, relDay, fmtDay, fmtTs, fmtTsDate, waLink, toast, CROWN } from './app.js';
import { DAY_NAMES } from './config.mjs';

const $ = (id) => document.getElementById(id);
let token = store.get('lord.admin');
let settings = null;
const TABS = ['agenda', 'clientes', 'nfc', 'ajustes'];
let tab = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'agenda';

async function call(method, path, body) {
  try {
    return await api(method, path, body, token);
  } catch (e) {
    if (e.status === 401 || e.status === 503) logout(e.message);
    throw e;
  }
}

// ================= sesión =================
function showLogin(msg) {
  $('vLogin').hidden = false;
  $('vPanel').hidden = true;
  $('admTabs').hidden = true;
  $('admLogout').hidden = true;
  $('loginErr').textContent = msg || '';
  setTimeout(() => $('admPin').focus(), 50);
}
function logout(msg) {
  token = null;
  store.set('lord.admin', null);
  closeModal();
  showLogin(msg);
}
$('admLogout').addEventListener('click', () => logout());

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('loginErr').textContent = '';
  try {
    const r = await api('POST', '/admin/login', { pin: $('admPin').value });
    token = r.token;
    store.set('lord.admin', token);
    $('admPin').value = '';
    await boot();
  } catch (err) {
    $('loginErr').textContent = err.message;
  }
});

async function boot() {
  try {
    settings = (await call('GET', '/admin/settings')).settings;
  } catch (e) {
    if (token) toast(e.message, 'bad');
    return;
  }
  $('vLogin').hidden = true;
  $('vPanel').hidden = false;
  $('admTabs').hidden = false;
  $('admLogout').hidden = false;
  setTab(tab);
}

// ================= pestañas =================
function setTab(t) {
  tab = t;
  for (const name of TABS) $(`tab-${name}`).hidden = name !== t;
  $('admTabs').querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)));
  history.replaceState(null, '', `#${t}`);
  ({ agenda: renderAgenda, clientes: renderClients, nfc: renderNfc, ajustes: renderSettings })[t]();
}
$('admTabs').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tab]');
  if (b) setTab(b.dataset.tab);
});

// ================= modal =================
function openModal(html) {
  $('modalBox').onclick = null;
  $('modalBox').innerHTML = html;
  $('modal').classList.add('open');
}
function closeModal() { $('modal').classList.remove('open'); }
$('modal').addEventListener('click', (e) => {
  if (e.target === $('modal') || e.target.closest('[data-close]')) closeModal();
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  closeModal();
  $('qrFull').hidden = true;
});

const initials = (n) => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
const cutMsg = (r, name) => {
  if (!r) return 'Listo.';
  if (r.type === 'reward') return `${name} canjeó su premio.`;
  if (r.type === 'membership') return `Corte descontado de la membresía de ${name}.`;
  return r.earned ? `¡${name} completó la tarjeta y ganó un premio!` : `Corte sumado a la tarjeta de ${name}.`;
};

// ================= AGENDA =================
const ag = { date: todayAR(), items: [], loading: false };

function renderAgenda() {
  $('tab-agenda').innerHTML = `
    <div class="adm-head">
      <div class="datebar">
        <button class="icon-btn" data-ag="prev" aria-label="Día anterior">‹</button>
        <label class="date-label"><span id="agDate"></span><input type="date" id="agPick" aria-label="Elegir fecha"></label>
        <button class="icon-btn" data-ag="next" aria-label="Día siguiente">›</button>
      </div>
      <div class="row">
        <button class="btn btn-line btn-sm" data-ag="today">Hoy</button>
        <button class="btn btn-gold btn-sm" data-ag="add">+ Agregar</button>
      </div>
    </div>
    <div class="stats" id="agStats"></div>
    <div id="agList"><div class="empty"><div class="spinner"></div></div></div>`;
  loadDay();
}

async function loadDay(spinner = true) {
  $('agDate').textContent = `${relDay(ag.date) === 'Hoy' || relDay(ag.date) === 'Mañana' ? `${relDay(ag.date)} · ` : ''}${fmtDay(ag.date)}`;
  $('agPick').value = ag.date;
  if (spinner) $('agList').innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  try {
    const r = await call('GET', `/admin/day?date=${ag.date}`);
    if (r.date !== ag.date) return;
    ag.items = r.items;
    paintDay();
  } catch (e) {
    $('agList').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}

function paintDay() {
  const active = ag.items.filter((i) => i.kind !== 'block' && i.status !== 'cancelled');
  const done = active.filter((i) => i.status === 'done');
  const total = active.filter((i) => i.status !== 'noshow').reduce((s, i) => s + (i.price || 0), 0);
  $('agStats').innerHTML = `
    <div class="stat"><b>${active.length}</b>turnos</div>
    <div class="stat"><b>${done.length}</b>realizados</div>
    <div class="stat"><b>${money(total)}</b>estimado</div>`;
  const barbers = settings.barbers;
  const col = (list) => (list.length ? list.map(apptHtml).join('') : '<div class="empty">Sin turnos.</div>');
  if (barbers.length <= 1) {
    $('agList').innerHTML = col(ag.items);
  } else {
    $('agList').innerHTML = `<div class="cols">${barbers.map((b) => `
      <div class="col"><h3>${esc(b.name)}</h3>${col(ag.items.filter((i) => !i.barberId || i.barberId === b.id))}</div>`).join('')}
      ${ag.items.some((i) => i.barberId && !barbers.find((b) => b.id === i.barberId)) ? `<div class="col"><h3>Otros</h3>${col(ag.items.filter((i) => i.barberId && !barbers.find((b) => b.id === i.barberId)))}</div>` : ''}
    </div>`;
  }
}

function apptHtml(i) {
  const cls = `appt ${i.status} ${i.kind === 'block' ? 'block' : ''}`;
  const wa = i.phone ? waLink(`549${i.phone}`) : null;
  let actions = '';
  if (i.kind === 'block') {
    actions = `<button class="btn btn-line" data-act="delete" data-id="${i.id}">Quitar bloqueo</button>`;
  } else if (i.status === 'booked') {
    actions = `<button class="btn btn-gold" data-act="done" data-id="${i.id}">✓ ${i.phone ? 'Listo + sumar corte' : 'Listo'}</button>
      <button class="btn btn-line" data-act="noshow" data-id="${i.id}">No vino</button>
      <button class="btn btn-ghost" data-act="cancelled" data-id="${i.id}">Cancelar</button>`;
  } else if (i.status === 'done') {
    actions = `<span class="pill ok">Realizado</span>${i.validated ? '<span class="pill">Corte sumado</span>' : ''}
      <button class="btn btn-ghost" data-act="booked" data-id="${i.id}">Deshacer</button>`;
  } else {
    actions = `<span class="pill ${i.status === 'noshow' ? 'bad' : 'dim'}">${i.status === 'noshow' ? 'No vino' : 'Cancelado'}</span>
      <button class="btn btn-ghost" data-act="booked" data-id="${i.id}">Reactivar</button>
      <button class="btn btn-ghost" data-act="delete" data-id="${i.id}">Borrar</button>`;
  }
  const who = i.kind === 'block' ? `⛔ ${esc(i.serviceName)}` : esc(i.name);
  const sub = i.kind === 'block'
    ? `Bloqueado · ${esc(i.barberName || 'Todos')}`
    : `${esc(i.serviceName)}${i.price ? ` · ${money(i.price)}` : ''}${i.phone ? ` · <a href="${esc(wa)}" target="_blank" rel="noopener">${esc(i.phone)}</a>` : ''}${i.kind === 'manual' ? ' · cargado a mano' : ''}`;
  return `<div class="${cls}">
    <div class="appt-time">${esc(i.start)}<small>${esc(i.end)}</small></div>
    <div class="appt-main"><b>${who}</b><div class="sub">${sub}</div><div class="appt-actions">${actions}</div></div>
  </div>`;
}

$('tab-agenda').addEventListener('click', async (e) => {
  const nav = e.target.closest('[data-ag]');
  if (nav) {
    const a = nav.dataset.ag;
    if (a === 'prev') ag.date = addDays(ag.date, -1);
    if (a === 'next') ag.date = addDays(ag.date, 1);
    if (a === 'today') ag.date = todayAR();
    if (a === 'add') return addApptModal();
    return loadDay();
  }
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const item = ag.items.find((x) => x.id === btn.dataset.id);
  const act = btn.dataset.act;
  if (act === 'cancelled' && !confirm(`¿Cancelar el turno de ${item.name} (${item.start})?`)) return;
  if (act === 'delete' && !confirm('¿Borrar definitivamente de la agenda?')) return;
  btn.disabled = true;
  try {
    const r = await call('POST', '/admin/booking/status', { date: ag.date, id: btn.dataset.id, status: act, validate: act === 'done' });
    if (act === 'done') toast(item.phone ? cutMsg(r.result, item.name) : 'Turno marcado como realizado.', 'ok');
    await loadDay(false);
  } catch (err) {
    toast(err.message, 'bad');
    btn.disabled = false;
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'agPick' && e.target.value) { ag.date = e.target.value; loadDay(); }
});

function addApptModal() {
  const now = new Date(Date.now() - 3 * 3600e3);
  const m = Math.ceil((now.getUTCHours() * 60 + now.getUTCMinutes()) / 15) * 15;
  const def = ag.date === todayAR() && m < 24 * 60 ? `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` : '10:00';
  openModal(`
    <div class="stack">
      <div class="cd-head"><h2>Agregar · ${esc(fmtDay(ag.date))}</h2><button class="icon-btn" data-close aria-label="Cerrar">×</button></div>
      <div class="seg" role="group"><button type="button" data-kind="manual" aria-pressed="true">Turno</button><button type="button" data-kind="block" aria-pressed="false">Bloquear horario</button></div>
      <form id="apptForm" class="stack">
        <div class="grid2">
          <div class="field"><label for="apBarber">Barbero</label><select class="select" id="apBarber">
            <option value="" data-only="block">Todos</option>
            ${settings.barbers.map((b, i) => `<option value="${esc(b.id)}" ${i === 0 ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
          </select></div>
          <div class="field"><label for="apTime">Hora</label><input class="input" type="time" id="apTime" value="${def}" step="300" required></div>
        </div>
        <div data-for="manual" class="stack">
          <div class="field"><label for="apSvc">Servicio</label><select class="select" id="apSvc">${settings.services.map((s) => `<option value="${esc(s.id)}">${esc(s.name)} · ${dur(s.duration)}</option>`).join('')}</select></div>
          <div class="grid2">
            <div class="field"><label for="apPhone">Celular (opcional)</label><input class="input" id="apPhone" type="tel" placeholder="3564 123456"></div>
            <div class="field"><label for="apName">Nombre</label><input class="input" id="apName" placeholder="Cliente"></div>
          </div>
          <p class="hint">Si el celular es de un cliente Lord, el turno aparece en su cuenta y al completarlo se suma el corte.</p>
        </div>
        <div data-for="block" class="grid2" hidden>
          <div class="field"><label for="apWhy">Motivo</label><input class="input" id="apWhy" placeholder="Almuerzo, trámite…"></div>
          <div class="field"><label for="apDur">Duración</label><select class="select" id="apDur">
            ${[15, 30, 45, 60, 90, 120, 180, 240, 480].map((d) => `<option value="${d}" ${d === 60 ? 'selected' : ''}>${dur(d)}</option>`).join('')}
          </select></div>
        </div>
        <p class="error-msg" id="apErr"></p>
        <button class="btn btn-gold btn-block" type="submit">Guardar</button>
      </form>
    </div>`);
  let kind = 'manual';
  const sync = () => {
    $('modalBox').querySelectorAll('[data-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.kind === kind)));
    $('modalBox').querySelectorAll('[data-for]').forEach((el) => { el.hidden = el.dataset.for !== kind; });
    const all = $('apBarber').querySelector('[data-only]');
    all.hidden = kind !== 'block';
    if (kind !== 'block' && !$('apBarber').value) $('apBarber').selectedIndex = 1;
  };
  $('modalBox').querySelector('.seg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-kind]');
    if (b) { kind = b.dataset.kind; sync(); }
  });
  sync();
  const send = async (force) => {
    const body = {
      date: ag.date, time: $('apTime').value, kind, barberId: $('apBarber').value || null, force,
      ...(kind === 'block'
        ? { name: $('apWhy').value, duration: Number($('apDur').value) }
        : { serviceId: $('apSvc').value, phone: $('apPhone').value, name: $('apName').value }),
    };
    try {
      await call('POST', '/admin/booking', body);
      closeModal();
      toast(kind === 'block' ? 'Horario bloqueado.' : 'Turno agregado.', 'ok');
      loadDay(false);
    } catch (err) {
      if (err.data?.clash && !force && confirm(`${err.message}\n¿Agregar igual?`)) return send(true);
      $('apErr').textContent = err.message;
    }
  };
  $('apptForm').addEventListener('submit', (e) => { e.preventDefault(); send(false); });
}

// refresco automático de la agenda (cada 30 s) para ver las validaciones NFC al instante
setInterval(() => {
  if (token && tab === 'agenda' && !document.hidden && !$('modal').classList.contains('open') && !$('vPanel').hidden) loadDay(false);
}, 30000);

// ================= CLIENTES =================
const cl = { q: '', timer: null, list: [], total: 0 };

function renderClients() {
  $('tab-clientes').innerHTML = `
    <div class="adm-head"><h1>Clientes <span class="muted" id="clTotal" style="font-size:16px"></span></h1></div>
    <div class="search">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      <input class="input" id="clSearch" type="search" placeholder="Buscar por nombre, celular o Nº de socio" value="${esc(cl.q)}" autocomplete="off">
    </div>
    <div class="clients" id="clList"><div class="empty"><div class="spinner"></div></div></div>`;
  $('clSearch').addEventListener('input', (e) => {
    cl.q = e.target.value;
    clearTimeout(cl.timer);
    cl.timer = setTimeout(loadClients, 280);
  });
  loadClients();
}

async function loadClients() {
  try {
    const r = await call('GET', `/admin/clients?q=${encodeURIComponent(cl.q)}`);
    cl.list = r.clients;
    cl.total = r.total;
    $('clTotal').textContent = `· ${r.total}`;
    $('clList').innerHTML = r.clients.length
      ? r.clients.map((c) => `<button class="client" data-phone="${esc(c.phone)}">
          <span class="avatar">${esc(initials(c.name))}</span>
          <span><b>${esc(c.name)}</b><small>Nº ${esc(c.memberNo)} · ${esc(c.phone)} · ${c.lastCutAt ? `último corte ${esc(fmtTs(c.lastCutAt))}` : 'sin cortes'}</small></span>
          <span class="client-right"><b>${c.stamps}/${r.goal}</b>${c.rewards ? `<span class="pill">${c.rewards} premio${c.rewards > 1 ? 's' : ''}</span>` : ''}${c.member ? `<span class="pill ok">${esc(c.member)}</span>` : ''}</span>
        </button>`).join('')
      : `<div class="empty">${cl.q ? 'No hay clientes que coincidan.' : 'Todavía no hay clientes. Se suman solos cuando crean su cuenta en la web.'}</div>`;
  } catch (e) {
    $('clList').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}
$('tab-clientes').addEventListener('click', (e) => {
  const c = e.target.closest('[data-phone]');
  if (c) openClient(c.dataset.phone);
});

const HIST = {
  welcome: 'Se sumó al Club', stamp: 'Corte sumado', reward: 'Canjeó premio', membership: 'Corte de membresía',
  'stamp-add': '+1 sello (panel)', 'stamp-remove': '−1 sello (panel)', 'membership-on': 'Membresía activada',
  'membership-off': 'Membresía finalizada', 'pin-reset': 'PIN reseteado',
};

async function openClient(phone, notice = '') {
  let u;
  try {
    u = (await call('GET', `/admin/client?phone=${encodeURIComponent(phone)}`)).user;
  } catch (e) { toast(e.message, 'bad'); return; }
  const m = u.membership;
  let stamps = '';
  for (let i = 0; i < u.goal; i++) stamps += `<span class="stamp ${i < u.stamps ? 'on' : ''}">${CROWN}</span>`;
  const cols = u.goal <= 5 ? u.goal : u.goal % 5 === 0 ? 5 : u.goal % 4 === 0 ? 4 : 5;
  const up = u.bookings.filter((b) => b.status === 'booked').slice(0, 5);
  const wa = waLink(`549${u.phone}`);
  openModal(`
    <div class="stack">
      <div class="cd-head">
        <div><h2>${esc(u.name)}</h2><small class="muted">Socio Nº ${esc(u.memberNo)} · <a href="${esc(wa)}" target="_blank" rel="noopener" style="color:var(--gold-hi)">${esc(u.phone)}</a> · desde ${esc(fmtTsDate(u.createdAt))}</small></div>
        <button class="icon-btn" data-close aria-label="Cerrar">×</button>
      </div>
      ${notice ? `<div class="notice">${notice}</div>` : ''}
      <div class="stamps" style="grid-template-columns:repeat(${cols},1fr)">${stamps}</div>
      <p class="muted" style="font-size:14px"><b style="color:var(--text)">${u.stamps} de ${u.goal}</b> cortes · ${u.rewards} premio(s) disponible(s) · ${u.visits} cortes en total${u.locked ? ' · <span style="color:var(--danger)">bloqueado por PIN incorrecto</span>' : ''}</p>
      <div class="cd-grid">
        <button class="btn btn-gold" data-cact="cut">Registrar corte</button>
        ${u.rewards ? '<button class="btn btn-line" data-cact="cut-reward">Corte con premio</button>' : ''}
        <button class="btn btn-line" data-cact="stamp-add">+1 sello</button>
        <button class="btn btn-line" data-cact="stamp-remove">−1 sello</button>
        ${u.rewards ? '<button class="btn btn-line" data-cact="reward-use">Canjear premio</button>' : ''}
      </div>

      <div class="cd-sec">
        <h3>Membresía</h3>
        ${m ? `<p style="margin-bottom:10px"><b>${esc(m.name)}</b> · ${m.left} de ${m.cuts} cortes · ${m.expired ? 'venció' : 'vence'} el ${esc(fmtTsDate(m.expiresAt))} ${m.active ? '<span class="pill ok">Activa</span>' : '<span class="pill dim">Inactiva</span>'}</p>` : '<p class="muted" style="margin-bottom:10px">Sin membresía.</p>'}
        ${settings.plans.length ? `<div class="inline"><select class="select" id="cdPlan">${settings.plans.map((p) => `<option value="${esc(p.id)}">${esc(p.name)} · ${p.cuts} cortes / ${p.days} días</option>`).join('')}</select>
          <button class="btn btn-line btn-sm" data-cact="membership" style="--h:52px">${m && !m.expired ? 'Renovar' : 'Activar'}</button></div>` : '<p class="hint">Creá membresías en Ajustes.</p>'}
        ${m && !m.expired ? '<button class="btn btn-ghost" data-cact="membership-cancel" style="margin-top:6px">Finalizar membresía</button>' : ''}
      </div>

      <div class="cd-sec"><h3>Próximos turnos</h3>
        ${up.length ? `<ul class="hist">${up.map((b) => `<li><span>${esc(relDay(b.date))} ${esc(b.start)} · ${esc(b.serviceName)}</span><span>${esc(b.barberName || '')}</span></li>`).join('')}</ul>` : '<p class="muted">Ninguno.</p>'}
      </div>

      <div class="cd-sec"><h3>Historial</h3>
        <ul class="hist">${u.history.slice(0, 25).map((h) => `<li><span>${esc(HIST[h.type] || h.type)}${h.earned ? ' · ganó premio' : ''}${h.note ? ` · ${esc(h.note)}` : ''}${h.via === 'nfc' ? ' · NFC' : ''}</span><span>${esc(fmtTs(h.at))}</span></li>`).join('')}</ul>
      </div>

      <div class="cd-sec cd-grid">
        <button class="btn btn-line" data-cact="pin-reset">Resetear PIN</button>
        <button class="btn btn-danger" data-cact="delete">Eliminar cliente</button>
      </div>
    </div>`);
  $('modalBox').onclick = async (e) => {
    const b = e.target.closest('[data-cact]');
    if (!b) return;
    const a = b.dataset.cact;
    const body = { phone: u.phone, action: a };
    if (a === 'cut-reward') { body.action = 'cut'; body.useReward = true; }
    if (a === 'membership') body.planId = $('cdPlan').value;
    if (a === 'delete' && !confirm(`¿Eliminar a ${u.name}? Se borra su tarjeta y no se puede deshacer.`)) return;
    if (a === 'pin-reset' && !confirm(`¿Resetear el PIN de ${u.name}? Se cierra su sesión en el celular.`)) return;
    if (a === 'membership-cancel' && !confirm('¿Finalizar la membresía?')) return;
    b.disabled = true;
    try {
      const r = await call('POST', '/admin/client', body);
      if (a === 'delete') { closeModal(); toast('Cliente eliminado.', 'ok'); loadClients(); return; }
      let note = '';
      if (r.pin) note = `Nuevo PIN: <b style="font-size:20px;letter-spacing:.2em">${esc(r.pin)}</b> — decíselo a ${esc(u.name.split(' ')[0])}.`;
      else if (r.result) note = esc(cutMsg(r.result, u.name.split(' ')[0]));
      else note = 'Listo.';
      openClient(u.phone, note);
      if (tab === 'clientes') loadClients();
    } catch (err) {
      toast(err.message, 'bad');
      b.disabled = false;
    }
  };
}

// ================= NFC =================
let nfc = null;
let qrLib;
function loadQrLib() {
  qrLib ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
    s.onload = () => res(window.qrcode);
    s.onerror = () => { qrLib = null; rej(new Error('No se pudo cargar el generador de QR.')); };
    document.head.append(s);
  });
  return qrLib;
}
async function qrSvg(text) {
  const q = (await loadQrLib())(0, 'M');
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
}

const LOG_TYPE = { stamp: 'sumó un corte', reward: 'canjeó su premio', membership: 'usó su membresía' };
let cards = [];
const VARIANT = { clara: 'Clara', oscura: 'Oscura' };

function cardHtml(c, canWrite) {
  const other = c.variant === 'clara' ? 'oscura' : 'clara';
  return `<article class="panel stack card-row ${c.active ? '' : 'off'}">
    <div class="cr-head">
      <div><b>${esc(c.name)}</b>
        <small>Código <code>${esc(c.code)}</code> · diseño ${VARIANT[c.variant]} · ${c.uses || 0} validaciones${c.lastUsedAt ? ` · última ${esc(fmtTs(c.lastUsedAt))}` : ''}</small></div>
      ${c.active ? '<span class="pill ok">Activa</span>' : '<span class="pill dim">Desactivada</span>'}
    </div>
    <div class="url-box"><span>${esc(c.link)}</span><button class="btn btn-line btn-sm" data-copy="${esc(c.code)}">Copiar</button></div>
    <div class="field">
      <label for="tg-${esc(c.code)}">A dónde lleva el QR y el NFC</label>
      <select class="select" id="tg-${esc(c.code)}" data-target="${esc(c.code)}">
        <option value="validate" ${c.target === 'validate' ? 'selected' : ''}>Validar el corte (Club Lord)</option>
        <option value="url" ${c.target === 'url' ? 'selected' : ''}>Otro link (reseñas, Instagram…)</option>
      </select>
      <div class="inline" data-urlrow="${esc(c.code)}" ${c.target === 'url' ? '' : 'hidden'}>
        <input class="input" data-url="${esc(c.code)}" type="url" placeholder="https://…" value="${esc(c.url || '')}">
        <button class="btn btn-line btn-sm" data-saveurl="${esc(c.code)}" style="--h:52px">Guardar</button>
      </div>
    </div>
    <div class="cd-grid">
      <a class="btn btn-gold" href="/tarjeta?code=${encodeURIComponent(c.code)}" target="_blank" rel="noopener">Imprimir / PNG</a>
      <button class="btn btn-line" data-qr="${esc(c.code)}">QR en pantalla</button>
      ${canWrite ? `<button class="btn btn-line" data-write="${esc(c.code)}">Grabar NFC</button>` : ''}
      <button class="btn btn-line" data-toggle="${esc(c.code)}">${c.active ? 'Desactivar' : 'Activar'}</button>
      <button class="btn btn-ghost" data-rename="${esc(c.code)}">Renombrar</button>
      <button class="btn btn-ghost" data-variant="${esc(c.code)}" data-to="${other}">Pasar a diseño ${VARIANT[other].toLowerCase()}</button>
      <button class="btn btn-ghost" data-delcard="${esc(c.code)}">Borrar</button>
    </div>
    <p class="nfc-status" data-status="${esc(c.code)}" role="status"></p>
  </article>`;
}

async function renderNfc() {
  $('tab-nfc').innerHTML = '<div class="empty"><div class="spinner"></div></div>';
  let log;
  try {
    [nfc, { log }, { cards }] = await Promise.all([call('GET', '/admin/nfc'), call('GET', '/admin/log'), call('GET', '/admin/cards')]);
  } catch (e) {
    $('tab-nfc').innerHTML = `<div class="empty">${esc(e.message)}</div>`;
    return;
  }
  const canWrite = 'NDEFReader' in window;
  $('tab-nfc').innerHTML = `
    <div class="adm-head"><h1>Tarjetas y NFC</h1><button class="btn btn-gold btn-sm" id="newCard">+ Nueva tarjeta</button></div>
    <p class="muted" style="margin:-6px 0 16px;max-width:760px">Cada tarjeta tiene su <b>código propio</b> (va impreso en la tarjeta). Su QR y su NFC llevan a <b>tuweb/t/CÓDIGO</b>, y desde acá elegís a dónde lleva sin tener que reimprimirla.</p>
    <div class="cards-grid">${cards.map((c) => cardHtml(c, canWrite)).join('') || '<div class="empty">No hay tarjetas.</div>'}</div>

    <div class="nfc-grid" style="margin-top:18px">
      <div class="stack">
        <div class="panel stack">
          <h3 class="display" style="font-size:20px">Grabar el NFC de una tarjeta</h3>
          ${canWrite ? '<p class="muted">Tocá <b>Grabar NFC</b> en la tarjeta y acercá el chip a la parte de atrás del celu.</p>' : '<p class="muted">Desde Android con Chrome aparece el botón <b>Grabar NFC</b> en cada tarjeta. Desde iPhone:</p>'}
          <ol class="tips">
            <li>Bajá la app gratis <b>NFC Tools</b>.</li>
            <li>Tocá <b>Escribir → Agregar un registro → URL/URI</b>.</li>
            <li>Pegá el link de la tarjeta (botón <b>Copiar</b>), tocá <b>Escribir</b> y acercá el chip.</li>
          </ol>
        </div>
        <div class="panel stack">
          <h3 class="display" style="font-size:20px">Seguridad</h3>
          <ul class="tips">
            <li>Cada cliente puede validar un corte cada <b>${settings.validation.cooldownHours} h</b> (se cambia en Ajustes).</li>
            <li>Si una tarjeta se pierde o sospechás que alguien usa su link sin venir, <b>desactivala</b> y creá una nueva.</li>
            <li>Cambiar a dónde lleva una tarjeta es inmediato: no hace falta reimprimir ni regrabar el NFC.</li>
          </ul>
        </div>
      </div>
      <div class="panel">
        <h3 class="display" style="font-size:20px;margin-bottom:8px">Últimas validaciones</h3>
        ${log.length ? `<ul class="hist log-list">${log.slice(0, 40).map((l) => `<li><span><b>${esc(l.name)}</b> ${esc(LOG_TYPE[l.type] || l.type)}${l.earned ? ' · ¡ganó premio!' : ''}${l.via === 'admin' ? ' · desde el panel' : l.card ? ` · ${esc(l.card)}` : ''}</span><span>${esc(fmtTs(l.at))}</span></li>`).join('')}</ul>` : '<p class="muted">Todavía no hay validaciones.</p>'}
      </div>
    </div>

    <details class="panel adv">
      <summary>Avanzado: link directo del tag (sin código de tarjeta)</summary>
      <div class="stack" style="margin-top:14px">
        <p class="muted">Link fijo con clave, por si ya grabaste un tag antes de usar tarjetas. Si cambiás la clave, ese tag deja de funcionar.</p>
        <div class="url-box"><span>${esc(nfc.url)}</span><button class="btn btn-line btn-sm" id="copyUrl">Copiar</button></div>
        <button class="btn btn-danger" id="rotateKey">Cambiar clave del link directo</button>
        <p class="hint">Última clave generada: ${esc(fmtTs(nfc.rotatedAt))}</p>
      </div>
    </details>`;
}

async function cardAction(body, okMsg) {
  try {
    ({ cards } = await call('POST', '/admin/cards', body));
    if (okMsg) toast(okMsg, 'ok');
    renderNfc();
  } catch (err) {
    toast(err.message, 'bad');
  }
}

function newCardModal() {
  openModal(`
    <div class="stack">
      <div class="cd-head"><h2>Nueva tarjeta</h2><button class="icon-btn" data-close aria-label="Cerrar">×</button></div>
      <form id="cardForm" class="stack">
        <div class="field"><label for="ncName">Nombre</label><input class="input" id="ncName" placeholder="Tarjeta de Tomás, mostrador…" maxlength="40"></div>
        <div class="grid2">
          <div class="field"><label for="ncVar">Diseño</label><select class="select" id="ncVar"><option value="clara">Clara</option><option value="oscura">Oscura</option></select></div>
          <div class="field"><label for="ncCode">Código (opcional)</label><input class="input" id="ncCode" placeholder="Se genera solo" maxlength="20" autocapitalize="none"></div>
        </div>
        <p class="hint">El código va impreso en la tarjeta y forma su link (tuweb/t/código). Si lo dejás vacío se crea uno al azar.</p>
        <p class="error-msg" id="ncErr"></p>
        <button class="btn btn-gold btn-block" type="submit">Crear tarjeta</button>
      </form>
    </div>`);
  $('cardForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      ({ cards } = await call('POST', '/admin/cards', { action: 'create', name: $('ncName').value, variant: $('ncVar').value, code: $('ncCode').value }));
      closeModal();
      toast('Tarjeta creada.', 'ok');
      renderNfc();
    } catch (err) {
      $('ncErr').textContent = err.message;
    }
  });
}

$('tab-nfc').addEventListener('change', (e) => {
  const code = e.target.dataset.target;
  if (!code) return;
  const row = $('tab-nfc').querySelector(`[data-urlrow="${CSS.escape(code)}"]`);
  if (e.target.value === 'url') {
    row.hidden = false;
    row.querySelector('input').focus();
  } else {
    row.hidden = true;
    cardAction({ action: 'update', code, target: 'validate' }, 'Listo: la tarjeta vuelve a validar cortes.');
  }
});

$('tab-nfc').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const d = btn.dataset;
  const card = cards.find((c) => c.code === (d.copy || d.qr || d.write || d.toggle || d.rename || d.variant || d.delcard || d.saveurl));
  if (btn.id === 'newCard') return newCardModal();
  if (btn.id === 'copyUrl' || d.copy) {
    const text = btn.id === 'copyUrl' ? nfc.url : card.link;
    try { await navigator.clipboard.writeText(text); toast('Link copiado.', 'ok'); } catch { toast('No se pudo copiar. Seleccionalo a mano.', 'bad'); }
    return;
  }
  if (btn.id === 'rotateKey') {
    if (!confirm('¿Cambiar la clave del link directo? Los tags grabados con ese link dejan de funcionar. Las tarjetas con código no se ven afectadas.')) return;
    try { await call('POST', '/admin/nfc/rotate'); toast('Clave nueva.', 'ok'); renderNfc(); } catch (err) { toast(err.message, 'bad'); }
    return;
  }
  if (!card) return;
  if (d.qr) {
    try {
      $('qrFullCode').innerHTML = await qrSvg(card.link);
      $('qrFull').hidden = false;
    } catch (err) { toast(err.message, 'bad'); }
  } else if (d.write) {
    const st = $('tab-nfc').querySelector(`[data-status="${CSS.escape(card.code)}"]`);
    try {
      const ndef = new window.NDEFReader();
      st.textContent = 'Acercá el chip a la parte de atrás del celu…';
      await ndef.write({ records: [{ recordType: 'url', data: card.link }] });
      st.textContent = '✓ NFC grabado. Probalo apoyando cualquier celu.';
      toast('NFC grabado.', 'ok');
    } catch (err) {
      st.textContent = err.name === 'NotAllowedError' ? 'Tenés que permitir el acceso a NFC.' : `No se pudo grabar: ${err.message}`;
    }
  } else if (d.saveurl) {
    const url = $('tab-nfc').querySelector(`[data-url="${CSS.escape(card.code)}"]`).value.trim();
    cardAction({ action: 'update', code: card.code, target: 'url', url }, 'Listo: la tarjeta ahora lleva a ese link.');
  } else if (d.toggle) {
    if (card.active && !confirm(`¿Desactivar "${card.name}"? Su QR y su NFC dejan de funcionar hasta que la actives de nuevo.`)) return;
    cardAction({ action: 'update', code: card.code, active: !card.active }, card.active ? 'Tarjeta desactivada.' : 'Tarjeta activada.');
  } else if (d.rename) {
    const name = prompt('Nombre de la tarjeta', card.name);
    if (name && name.trim()) cardAction({ action: 'update', code: card.code, name }, 'Nombre cambiado.');
  } else if (d.variant) {
    cardAction({ action: 'update', code: card.code, variant: d.to }, `Diseño cambiado a ${VARIANT[d.to].toLowerCase()}.`);
  } else if (d.delcard) {
    if (!confirm(`¿Borrar "${card.name}" (código ${card.code})? Si está impresa, deja de funcionar para siempre.`)) return;
    cardAction({ action: 'delete', code: card.code }, 'Tarjeta borrada.');
  }
});
$('qrFullClose').addEventListener('click', () => { $('qrFull').hidden = true; });

// ================= AJUSTES =================
let draft = null;
let dirty = false;
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function renderSettings() {
  if (!draft || !dirty) draft = structuredClone(settings);
  for (const d of DAY_ORDER) {
    const r = draft.hours[d] || [];
    const arr = [r[0] || ['', ''], r[1] || ['', '']];
    arr.open = 'open' in r ? r.open : r.length > 0;
    draft.hours[d] = arr;
  }
  const b = draft.business;
  const inp = (path, val, attrs = '') => `<input class="input" data-path="${path}" value="${esc(val ?? '')}" ${attrs}>`;
  const lf = (label, html) => `<div class="field"><label>${label}</label>${html}</div>`;
  $('tab-ajustes').innerHTML = `
    <div class="adm-head"><h1>Ajustes</h1></div>

    <section class="card set-sec"><h2>El local</h2>
      <div class="grid2">
        ${lf('WhatsApp (con 549 y área)', inp('business.whatsapp', b.whatsapp, 'inputmode="tel" placeholder="5493564123456"'))}
        ${lf('Instagram', inp('business.instagram', b.instagram, 'placeholder="lordbarbershop.sf"'))}
        ${lf('Dirección', inp('business.address', b.address, 'placeholder="Bv. 25 de Mayo 1234"'))}
        ${lf('Ciudad', inp('business.city', b.city, 'placeholder="San Francisco, Córdoba"'))}
      </div>
      <div style="margin-top:14px">${lf('Link de Google Maps (opcional)', inp('business.mapsUrl', b.mapsUrl, 'placeholder="https://maps.app.goo.gl/…"'))}</div>
    </section>

    <section class="card set-sec"><h2>Servicios y precios</h2>
      <div class="rowset">${draft.services.map((s, i) => `
        <div class="rowitem">
          <button class="del" data-del="services" data-i="${i}" aria-label="Quitar servicio">×</button>
          <div class="grid-svc">
            <div><span class="mini-label">Nombre</span><input class="input" data-list="services" data-i="${i}" data-f="name" value="${esc(s.name)}"></div>
            <div><span class="mini-label">Precio $</span><input class="input" data-list="services" data-i="${i}" data-f="price" data-num inputmode="numeric" value="${esc(s.price)}"></div>
            <div><span class="mini-label">Minutos</span><input class="input" data-list="services" data-i="${i}" data-f="duration" data-num inputmode="numeric" value="${esc(s.duration)}"></div>
          </div>
          <div><span class="mini-label">Descripción</span><input class="input" data-list="services" data-i="${i}" data-f="desc" value="${esc(s.desc)}"></div>
        </div>`).join('')}
      </div>
      <button class="btn btn-line btn-sm" data-add="services" style="margin-top:12px">+ Agregar servicio</button>
    </section>

    <section class="card set-sec"><h2>Barberos</h2>
      <p class="hint">Cada barbero tiene su propia agenda. Con uno solo, el cliente no tiene que elegir.</p>
      <div class="rowset">${draft.barbers.map((x, i) => `
        <div class="rowitem"><button class="del" data-del="barbers" data-i="${i}" aria-label="Quitar barbero">×</button>
          <div><span class="mini-label">Nombre</span><input class="input" data-list="barbers" data-i="${i}" data-f="name" value="${esc(x.name)}"></div></div>`).join('')}
      </div>
      <button class="btn btn-line btn-sm" data-add="barbers" style="margin-top:12px">+ Agregar barbero</button>
    </section>

    <section class="card set-sec"><h2>Horarios</h2>
      <p class="hint">Hasta dos franjas por día (por ejemplo, mañana y tarde). Dejá la segunda vacía si es corrido.</p>
      ${DAY_ORDER.map((d) => {
        const h = draft.hours[d];
        return `<div class="hours-row">
          <label class="toggle"><input type="checkbox" data-open="${d}" ${h.open ? 'checked' : ''}>${DAY_NAMES[d].slice(0, 3)}</label>
          <div class="ranges">${h.open ? [0, 1].map((k) => `
            <input class="input" type="time" data-day="${d}" data-r="${k}" data-e="0" value="${esc(h[k][0])}" aria-label="${DAY_NAMES[d]} franja ${k + 1} desde">
            <span class="sep">a</span>
            <input class="input" type="time" data-day="${d}" data-r="${k}" data-e="1" value="${esc(h[k][1])}" aria-label="${DAY_NAMES[d]} franja ${k + 1} hasta">
            ${k === 0 ? '<span class="sep">·</span>' : ''}`).join('') : '<span class="muted">Cerrado</span>'}</div>
        </div>`;
      }).join('')}
    </section>

    <section class="card set-sec"><h2>Días cerrados</h2>
      <p class="hint">Feriados o vacaciones: ese día no se puede reservar.</p>
      <div class="chips-closed">${draft.closedDates.map((d, i) => `<span>${esc(fmtDay(d))}<button data-unclose="${i}" aria-label="Quitar">×</button></span>`).join('') || '<span class="muted" style="border:0;padding:0">Ninguno.</span>'}</div>
      <div class="inline"><input class="input" type="date" id="closeDate" min="${todayAR()}"><button class="btn btn-line btn-sm" data-close-add style="--h:52px">Agregar</button></div>
    </section>

    <section class="card set-sec"><h2>Tarjeta de fidelidad</h2>
      <div class="grid2">
        ${lf('Cortes para el premio', inp('loyalty.goal', draft.loyalty.goal, 'data-num inputmode="numeric"'))}
        ${lf('Premio', inp('loyalty.reward', draft.loyalty.reward))}
        ${lf('Horas mínimas entre validaciones', inp('validation.cooldownHours', draft.validation.cooldownHours, 'data-num inputmode="numeric"'))}
      </div>
    </section>

    <section class="card set-sec"><h2>Membresías</h2>
      <div class="rowset">${draft.plans.map((p, i) => `
        <div class="rowitem">
          <button class="del" data-del="plans" data-i="${i}" aria-label="Quitar membresía">×</button>
          <div class="grid-plan">
            <div><span class="mini-label">Nombre</span><input class="input" data-list="plans" data-i="${i}" data-f="name" value="${esc(p.name)}"></div>
            <div><span class="mini-label">Precio $</span><input class="input" data-list="plans" data-i="${i}" data-f="price" data-num inputmode="numeric" value="${esc(p.price)}"></div>
            <div><span class="mini-label">Cortes</span><input class="input" data-list="plans" data-i="${i}" data-f="cuts" data-num inputmode="numeric" value="${esc(p.cuts)}"></div>
            <div><span class="mini-label">Días</span><input class="input" data-list="plans" data-i="${i}" data-f="days" data-num inputmode="numeric" value="${esc(p.days)}"></div>
          </div>
          <div><span class="mini-label">Beneficios (uno por línea)</span><textarea class="textarea" data-list="plans" data-i="${i}" data-f="perks" data-lines rows="3">${esc((p.perks || []).join('\n'))}</textarea></div>
        </div>`).join('')}
      </div>
      <button class="btn btn-line btn-sm" data-add="plans" style="margin-top:12px">+ Agregar membresía</button>
    </section>

    <section class="card set-sec"><h2>Turnero</h2>
      <div class="grid2">
        <div class="field"><label>Turnos cada</label><select class="select" data-path="slotMinutes" data-num>${[10, 15, 20, 30, 60].map((m) => `<option value="${m}" ${m === draft.slotMinutes ? 'selected' : ''}>${m} min</option>`).join('')}</select></div>
        ${lf('Días para adelante', inp('bookingDaysAhead', draft.bookingDaysAhead, 'data-num inputmode="numeric"'))}
        ${lf('Anticipación mínima (min)', inp('minLeadMinutes', draft.minLeadMinutes, 'data-num inputmode="numeric"'))}
        ${lf('Cancelar hasta (horas antes)', inp('cancelLimitHours', draft.cancelLimitHours, 'data-num inputmode="numeric"'))}
        ${lf('Turnos a la vez por cliente', inp('maxActiveBookings', draft.maxActiveBookings, 'data-num inputmode="numeric"'))}
      </div>
    </section>

    <div class="save-bar"><span id="saveState">${dirty ? 'Cambios sin guardar' : 'Todo guardado'}</span><button class="btn btn-gold" id="saveSettings">Guardar cambios</button></div>`;
}

const markDirty = () => { dirty = true; const s = $('saveState'); if (s) s.textContent = 'Cambios sin guardar'; };

$('tab-ajustes').addEventListener('input', (e) => {
  const el = e.target;
  const val = el.hasAttribute('data-num') ? Number(el.value) : el.value;
  if (el.dataset.path) {
    const keys = el.dataset.path.split('.');
    let o = draft;
    while (keys.length > 1) o = o[keys.shift()];
    o[keys[0]] = val;
  } else if (el.dataset.list) {
    draft[el.dataset.list][Number(el.dataset.i)][el.dataset.f] = el.hasAttribute('data-lines') ? el.value.split('\n') : val;
  } else if (el.dataset.day) {
    draft.hours[el.dataset.day][Number(el.dataset.r)][Number(el.dataset.e)] = el.value;
  } else return;
  markDirty();
});
$('tab-ajustes').addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.open) {
    const h = draft.hours[el.dataset.open];
    h.open = el.checked;
    if (el.checked && !h[0][0]) h[0] = ['10:00', '20:00'];
    markDirty();
    renderSettings();
  } else if (el.tagName === 'SELECT' && el.dataset.path) {
    draft[el.dataset.path] = Number(el.value);
    markDirty();
  }
});
$('tab-ajustes').addEventListener('click', async (e) => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.dataset.del) {
    draft[t.dataset.del].splice(Number(t.dataset.i), 1);
    markDirty();
    return renderSettings();
  }
  if (t.dataset.add) {
    const blank = {
      services: { id: '', name: '', price: 0, duration: 30, desc: '' },
      barbers: { id: '', name: '' },
      plans: { id: '', name: '', price: 0, cuts: 4, days: 30, perks: [] },
    }[t.dataset.add];
    draft[t.dataset.add].push(blank);
    markDirty();
    renderSettings();
    const list = $('tab-ajustes').querySelectorAll(`[data-list="${t.dataset.add}"][data-f="name"]`);
    list[list.length - 1]?.focus();
    return;
  }
  if (t.dataset.unclose !== undefined) {
    draft.closedDates.splice(Number(t.dataset.unclose), 1);
    markDirty();
    return renderSettings();
  }
  if (t.hasAttribute('data-close-add')) {
    const v = $('closeDate').value;
    if (v && !draft.closedDates.includes(v)) { draft.closedDates.push(v); draft.closedDates.sort(); markDirty(); renderSettings(); }
    return;
  }
  if (t.id === 'saveSettings') {
    const out = structuredClone(draft);
    for (const d of DAY_ORDER) {
      const h = draft.hours[d];
      out.hours[d] = h.open ? [h[0], h[1]].filter((r) => r[0] && r[1]) : [];
    }
    t.disabled = true;
    try {
      const r = await call('POST', '/admin/settings', { settings: out });
      settings = r.settings;
      dirty = false;
      draft = null;
      renderSettings();
      toast('Ajustes guardados. La web ya muestra los cambios.', 'ok');
    } catch (err) {
      toast(err.message, 'bad');
      t.disabled = false;
    }
  }
});
addEventListener('beforeunload', (e) => { if (dirty) e.preventDefault(); });

// ================= arranque =================
if (token) boot(); else showLogin();
