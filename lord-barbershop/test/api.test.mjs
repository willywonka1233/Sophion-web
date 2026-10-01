// Pruebas de la API con almacenamiento local temporal: `npm test`
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.LORD_LOCAL_DB = fs.mkdtempSync(path.join(os.tmpdir(), 'lord-test-'));
process.env.ADMIN_PIN = '9876';
delete process.env.LORD_SECRET;

const { default: api } = await import('../netlify/functions/api.mjs');
const { nowLocal, addDays, dowOf } = await import('../server/logic.mjs');

const STAFF_PIN = '4321';
async function call(method, p, { body, token } = {}) {
  // Los cortes se confirman con el PIN del barbero (modo por defecto): se lo agregamos si falta.
  if (p === '/validate' && body && !('staffPin' in body)) body = { ...body, staffPin: STAFF_PIN };
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const r = await api(new Request(`https://lord.test/api${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined }));
  return { status: r.status, data: await r.json() };
}

let admin;
const allOpen = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, [['08:00', '22:00']]]));

before(async () => {
  const bad = await call('POST', '/admin/login', { body: { pin: '0000' } });
  assert.equal(bad.status, 401);
  const r = await call('POST', '/admin/login', { body: { pin: '9876' } });
  assert.equal(r.status, 200);
  admin = r.data.token;
  const { data } = await call('GET', '/config');
  const s = data.settings;
  s.hours = allOpen;
  s.barbers = [{ name: 'Tomás' }, { name: 'Nico' }];
  s.validation.cooldownHours = 12;
  s.loyalty.goal = 3;
  const saved = await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  assert.equal(saved.status, 200, JSON.stringify(saved.data));
  assert.deepEqual(saved.data.settings.barbers.map((b) => b.id), ['tomas', 'nico']);
  const staff = await call('POST', '/admin/staff', { token: admin, body: { barberId: 'tomas', pin: STAFF_PIN } });
  assert.equal(staff.status, 200, JSON.stringify(staff.data));
  assert.equal(staff.data.barbers.find((b) => b.id === 'tomas').hasPin, true);
});

const day = addDays(nowLocal().date, 2);

test('config pública trae servicios y ajustes', async () => {
  const { status, data } = await call('GET', '/config');
  assert.equal(status, 200);
  assert.ok(data.settings.services.length > 0);
  assert.equal(data.settings.loyalty.goal, 3);
  assert.equal(data.settings.hours[dowOf(day)][0][0], '08:00');
});

test('registro, login y sesión', async () => {
  const r = await call('POST', '/register', { body: { name: 'Juan Pérez', phone: '+54 9 3564 111111', pin: '1234' } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.user.phone, '3564111111');
  assert.equal(r.data.user.memberNo, '0001');

  const dup = await call('POST', '/register', { body: { name: 'Otro', phone: '03564 111111', pin: '1111' } });
  assert.equal(dup.status, 409);

  const bad = await call('POST', '/login', { body: { phone: '3564111111', pin: '0000' } });
  assert.equal(bad.status, 401);
  const ok = await call('POST', '/login', { body: { phone: '3564-111111', pin: '1234' } });
  assert.equal(ok.status, 200);

  const me = await call('GET', '/me', { token: ok.data.token });
  assert.equal(me.data.user.name, 'Juan Pérez');
  assert.equal((await call('GET', '/me', { token: 'basura.token' })).status, 401);
  assert.equal((await call('GET', '/admin/day?date=' + day, { token: ok.data.token })).status, 401);
});

test('turnero: horarios, reserva, límite y cancelación', async () => {
  const a = (await call('POST', '/register', { body: { name: 'Ana', phone: '3564222222', pin: '2222' } })).data.token;
  const b = (await call('POST', '/register', { body: { name: 'Beto', phone: '3564333333', pin: '3333' } })).data.token;

  const slots = await call('GET', `/slots?date=${day}&service=corte`);
  assert.equal(slots.status, 200);
  assert.equal(slots.data.slots[0].time, '08:00');
  assert.deepEqual(slots.data.slots[0].barbers, ['tomas', 'nico']);

  const b1 = await call('POST', '/bookings', { token: a, body: { date: day, time: '08:00', serviceId: 'corte', barberId: 'any' } });
  assert.equal(b1.status, 200, JSON.stringify(b1.data));
  assert.equal(b1.data.booking.barberId, 'tomas');
  const b2 = await call('POST', '/bookings', { token: b, body: { date: day, time: '08:00', serviceId: 'corte', barberId: 'any' } });
  assert.equal(b2.data.booking.barberId, 'nico');

  const after = await call('GET', `/slots?date=${day}&service=corte`);
  assert.ok(!after.data.slots.some((s) => s.time === '08:00' || s.time === '08:15'));

  const clash = await call('POST', '/bookings', { token: a, body: { date: day, time: '08:15', serviceId: 'corte', barberId: 'nico' } });
  assert.equal(clash.status, 409);

  await call('POST', '/bookings', { token: a, body: { date: day, time: '10:00', serviceId: 'barba', barberId: 'tomas' } });
  const third = await call('POST', '/bookings', { token: a, body: { date: day, time: '12:00', serviceId: 'barba' } });
  assert.equal(third.status, 409);
  assert.match(third.data.error, /Cancelá uno/);

  const cancel = await call('POST', '/bookings/cancel', { token: a, body: { id: b1.data.booking.id } });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.data.user.bookings.find((x) => x.id === b1.data.booking.id).status, 'cancelled');
  const free = await call('GET', `/slots?date=${day}&service=corte&barber=tomas`);
  assert.equal(free.data.slots[0].time, '08:00');

  const dayView = await call('GET', `/admin/day?date=${day}`, { token: admin });
  assert.equal(dayView.data.items.length, 3);
});

test('validación NFC: sellos, cooldown, premio, membresía y rotación de clave', async () => {
  const reg = await call('POST', '/register', { body: { name: 'Carla', phone: '3564444444', pin: '4444' } });
  const t = reg.data.token;
  const { data: nfc } = await call('GET', '/admin/nfc', { token: admin });
  assert.match(nfc.url, /^https:\/\/lord\.test\/sello\?k=/);

  assert.equal((await call('POST', '/validate', { token: t, body: { k: 'otra-clave' } })).status, 403);

  // turno de hoy cargado por el barbero → la validación lo marca como hecho
  const today = nowLocal().date;
  // el turno de la hora actual (la validación marca el turno más cercano a ahora)
  const nowMin = Math.min(Math.floor(nowLocal().min / 5) * 5, 23 * 60);
  const hhmm = `${String(Math.floor(nowMin / 60)).padStart(2, '0')}:${String(nowMin % 60).padStart(2, '0')}`;
  const manual = await call('POST', '/admin/booking', { token: admin, body: { date: today, time: hhmm, serviceId: 'corte', barberId: 'tomas', phone: '3564444444', force: true } });
  assert.equal(manual.status, 200, JSON.stringify(manual.data));

  const v1 = await call('POST', '/validate', { token: t, body: { k: nfc.key } });
  assert.equal(v1.status, 200, JSON.stringify(v1.data));
  assert.equal(v1.data.result.type, 'stamp');
  assert.equal(v1.data.user.stamps, 1);
  const todayView = await call('GET', `/admin/day?date=${today}`, { token: admin });
  const it = todayView.data.items.find((x) => x.id === manual.data.booking.id);
  assert.equal(it.status, 'done');
  assert.equal(it.validated, true);

  const again = await call('POST', '/validate', { token: t, body: { k: nfc.key } });
  assert.equal(again.status, 429);
  assert.ok(again.data.nextAt > Date.now());

  // sin cooldown para completar la tarjeta
  const s = (await call('GET', '/admin/settings', { token: admin })).data.settings;
  s.validation.cooldownHours = 0;
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  await call('POST', '/validate', { token: t, body: { k: nfc.key } });
  const v3 = await call('POST', '/validate', { token: t, body: { k: nfc.key } });
  assert.equal(v3.data.result.earned, true);
  assert.equal(v3.data.user.rewards, 1);
  assert.equal(v3.data.user.stamps, 0);

  const redeem = await call('POST', '/validate', { token: t, body: { k: nfc.key, useReward: true } });
  assert.equal(redeem.data.result.type, 'reward');
  assert.equal(redeem.data.user.rewards, 0);
  assert.equal((await call('POST', '/validate', { token: t, body: { k: nfc.key, useReward: true } })).status, 400);

  // membresía: descuenta cortes del plan en vez de sumar sellos
  const plan = s.plans[0];
  const act = await call('POST', '/admin/client', { token: admin, body: { phone: '3564444444', action: 'membership', planId: plan.id } });
  assert.equal(act.data.user.membership.active, true);
  const vm = await call('POST', '/validate', { token: t, body: { k: nfc.key } });
  assert.equal(vm.data.result.type, 'membership');
  assert.equal(vm.data.user.membership.left, plan.cuts - 1);
  assert.equal(vm.data.user.stamps, 0);

  // rotar la clave invalida el tag viejo
  const rot = await call('POST', '/admin/nfc/rotate', { token: admin });
  assert.notEqual(rot.data.key, nfc.key);
  assert.equal((await call('POST', '/validate', { token: t, body: { k: nfc.key } })).status, 403);
  assert.equal((await call('POST', '/validate', { token: t, body: { k: rot.data.key } })).status, 200);

  const log = await call('GET', '/admin/log', { token: admin });
  assert.ok(log.data.log.length >= 6);
});

test('panel: completar turno suma corte una sola vez, clientes y reseteo de PIN', async () => {
  const reg = await call('POST', '/register', { body: { name: 'Diego', phone: '3564555555', pin: '5555' } });
  const bk = await call('POST', '/bookings', { token: reg.data.token, body: { date: day, time: '15:00', serviceId: 'corte', barberId: 'nico' } });
  const done = await call('POST', '/admin/booking/status', { token: admin, body: { date: day, id: bk.data.booking.id, status: 'done', validate: true } });
  assert.equal(done.data.result.type, 'stamp');
  const twice = await call('POST', '/admin/booking/status', { token: admin, body: { date: day, id: bk.data.booking.id, status: 'done', validate: true } });
  assert.equal(twice.data.result, null);

  const list = await call('GET', '/admin/clients?q=dieg', { token: admin });
  assert.equal(list.data.clients.length, 1);
  assert.equal(list.data.clients[0].stamps, 1);

  const reset = await call('POST', '/admin/client', { token: admin, body: { phone: '3564555555', action: 'pin-reset' } });
  assert.match(reset.data.pin, /^\d{4}$/);
  assert.equal((await call('GET', '/me', { token: reg.data.token })).status, 401);
  assert.equal((await call('POST', '/login', { body: { phone: '3564555555', pin: reset.data.pin } })).status, 200);

  const block = await call('POST', '/admin/booking', { token: admin, body: { date: day, time: '18:00', kind: 'block', duration: 60, name: 'Almuerzo' } });
  assert.equal(block.status, 200);
  const slots = await call('GET', `/slots?date=${day}&service=corte`);
  assert.ok(!slots.data.slots.some((x) => x.time === '18:00'));
});

test('tarjetas con código propio: link corto, validación y cambio de destino', async () => {
  const list = await call('GET', '/admin/cards', { token: admin });
  assert.equal(list.status, 200);
  assert.equal(list.data.cards.length, 2);
  const [clara, oscura] = list.data.cards;
  assert.notEqual(clara.code, oscura.code);
  assert.deepEqual([clara.variant, oscura.variant], ['clara', 'oscura']);
  assert.equal(clara.link, `https://lord.test/t/${clara.code}`);

  // /t/CODIGO redirige a la validación con el código de la tarjeta
  const r = await api(new Request(`https://lord.test/t/${clara.code.toUpperCase()}`));
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), `https://lord.test/sello?c=${clara.code}`);

  const s = (await call('GET', '/admin/settings', { token: admin })).data.settings;
  s.validation.cooldownHours = 0;
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  const t = (await call('POST', '/register', { body: { name: 'Facu', phone: '3564777777', pin: '7777' } })).data.token;
  const v = await call('POST', '/validate', { token: t, body: { c: clara.code } });
  assert.equal(v.status, 200, JSON.stringify(v.data));
  assert.equal(v.data.user.stamps, 1);
  const after = (await call('GET', '/admin/cards', { token: admin })).data.cards.find((c) => c.code === clara.code);
  assert.equal(after.uses, 1);
  assert.equal((await call('GET', '/admin/log', { token: admin })).data.log[0].card, 'Tarjeta clara');

  // código inexistente
  assert.equal((await call('POST', '/validate', { token: t, body: { c: 'noexiste' } })).status, 403);

  // cambiar el destino a otro link: /t redirige ahí y ya no valida
  const bad = await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: oscura.code, target: 'url', url: 'javascript:alert(1)' } });
  assert.equal(bad.status, 400);
  await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: oscura.code, target: 'url', url: 'https://g.page/r/lord/review' } });
  const r2 = await api(new Request(`https://lord.test/t/${oscura.code}`));
  assert.equal(r2.headers.get('location'), 'https://g.page/r/lord/review');
  assert.equal((await call('POST', '/validate', { token: t, body: { c: oscura.code } })).status, 403);
  await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: oscura.code, target: 'validate' } });
  assert.equal((await call('POST', '/validate', { token: t, body: { c: oscura.code } })).status, 200);

  // código de qrlocal: el QR impreso apunta ahí y se imprime ese código
  const ext = await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: clara.code, extUrl: 'LRD1' } });
  const ce = ext.data.cards.find((c) => c.code === clara.code);
  assert.equal(ce.qr, 'https://qrlocal.vercel.app/LRD1');
  assert.equal(ce.printCode, 'LRD1');
  assert.equal(ce.link, `https://lord.test/t/${clara.code}`);
  assert.equal((await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: clara.code, extUrl: 'ftp://x' } })).status, 400);
  const full = await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: clara.code, extUrl: 'https://qrlocal.vercel.app/lord-2' } });
  assert.equal(full.data.cards.find((c) => c.code === clara.code).printCode, 'lord-2');
  const cleared = await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: clara.code, extUrl: '' } });
  assert.equal(cleared.data.cards.find((c) => c.code === clara.code).qr, `https://lord.test/t/${clara.code}`);

  // desactivar, crear con código propio y borrar
  await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: clara.code, active: false } });
  assert.equal((await call('POST', '/validate', { token: t, body: { c: clara.code } })).status, 403);
  const created = await call('POST', '/admin/cards', { token: admin, body: { action: 'create', name: 'Llavero Tomás', variant: 'oscura', code: 'Tomas-1' } });
  assert.equal(created.data.cards.at(-1).code, 'tomas-1');
  assert.equal((await call('POST', '/admin/cards', { token: admin, body: { action: 'create', code: 'tomas-1' } })).status, 409);
  const del = await call('POST', '/admin/cards', { token: admin, body: { action: 'delete', code: 'tomas-1' } });
  assert.equal(del.data.cards.length, 2);
  assert.equal((await call('GET', '/admin/cards')).status, 401);
});

test('validación con PIN del barbero: sin PIN, incorrecto, bloqueo y quién validó', async () => {
  const s = (await call('GET', '/admin/settings', { token: admin })).data.settings;
  s.validation.cooldownHours = 0;
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  const k = (await call('GET', '/admin/nfc', { token: admin })).data.key;
  const t = (await call('POST', '/register', { body: { name: 'Gabi', phone: '3564888888', pin: '8888' } })).data.token;

  const noPin = await call('POST', '/validate', { token: t, body: { k, staffPin: '' } });
  assert.equal(noPin.status, 400);
  assert.equal(noPin.data.need, 'pin');
  const wrong = await call('POST', '/validate', { token: t, body: { k, staffPin: '0000' } });
  assert.equal(wrong.status, 403);
  assert.equal(wrong.data.attemptsLeft, 4);

  const ok = await call('POST', '/validate', { token: t, body: { k } });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  const log = (await call('GET', '/admin/log', { token: admin })).data.log;
  assert.equal(log[0].barber, 'Tomás');

  // PIN repetido entre barberos: no se permite
  assert.equal((await call('POST', '/admin/staff', { token: admin, body: { barberId: 'nico', pin: STAFF_PIN } })).status, 409);
  // 5 errores → bloqueado aunque después ponga el PIN correcto
  for (let i = 0; i < 5; i++) await call('POST', '/validate', { token: t, body: { k, staffPin: '1111' } });
  const locked = await call('POST', '/validate', { token: t, body: { k } });
  assert.equal(locked.status, 423);

  // sin ningún PIN cargado, avisa que falta configurarlo
  await call('POST', '/admin/staff', { token: admin, body: { barberId: 'tomas', pin: null } });
  const t2 = (await call('POST', '/register', { body: { name: 'Hugo', phone: '3564888889', pin: '8888' } })).data.token;
  const setup = await call('POST', '/validate', { token: t2, body: { k } });
  assert.equal(setup.status, 409);
  assert.equal(setup.data.need, 'setup');
  await call('POST', '/admin/staff', { token: admin, body: { barberId: 'tomas', pin: STAFF_PIN } });
});

test('validación con aprobación desde el panel', async () => {
  const s = (await call('GET', '/admin/settings', { token: admin })).data.settings;
  s.validation.mode = 'approval';
  s.validation.cooldownHours = 0;
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  assert.equal((await call('GET', '/config')).data.settings.validation.mode, 'approval');
  const k = (await call('GET', '/admin/nfc', { token: admin })).data.key;
  const t = (await call('POST', '/register', { body: { name: 'Iván', phone: '3564999990', pin: '9999' } })).data.token;

  const req = await call('POST', '/validate', { token: t, body: { k, staffPin: '' } });
  assert.equal(req.status, 202, JSON.stringify(req.data));
  const id = req.data.pending.id;
  // pedir dos veces no duplica el pedido
  assert.equal((await call('POST', '/validate', { token: t, body: { k } })).data.pending.id, id);
  assert.equal((await call('GET', `/validate/status?id=${id}`, { token: t })).data.status, 'pending');
  const pend = await call('GET', '/admin/pending', { token: admin });
  assert.equal(pend.data.pending.length, 1);
  assert.equal(pend.data.pending[0].name, 'Iván');

  const ap = await call('POST', '/admin/pending', { token: admin, body: { id, action: 'approve' } });
  assert.equal(ap.data.status, 'approved', JSON.stringify(ap.data));
  assert.equal((await call('POST', '/admin/pending', { token: admin, body: { id, action: 'approve' } })).status, 409);
  const st = await call('GET', `/validate/status?id=${id}`, { token: t });
  assert.equal(st.data.status, 'approved');
  assert.equal(st.data.user.stamps, 1);

  const req2 = await call('POST', '/validate', { token: t, body: { k } });
  await call('POST', '/admin/pending', { token: admin, body: { id: req2.data.pending.id, action: 'reject' } });
  assert.equal((await call('GET', `/validate/status?id=${req2.data.pending.id}`, { token: t })).data.status, 'rejected');
  assert.equal((await call('GET', '/me', { token: t })).data.user.stamps, 1);

  s.validation.mode = 'pin';
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
});

test('arreglos de la revisión: fechas, celular con 15, medianoche, qrlocal, reactivar y doble sello', async () => {
  // fecha inexistente
  assert.equal((await call('GET', '/slots?date=2027-02-30&service=corte')).status, 400);

  // celular con 15: misma cuenta escrita de las dos formas
  const r15 = await call('POST', '/register', { body: { name: 'Quince', phone: '3564 15 123456', pin: '1515' } });
  assert.equal(r15.data.user.phone, '3564123456');
  assert.equal((await call('POST', '/login', { body: { phone: '3564123456', pin: '1515' } })).status, 200);
  assert.equal((await call('POST', '/register', { body: { name: 'Otro', phone: '03564-123456', pin: '1111' } })).status, 409);

  // cierre a medianoche
  const s = (await call('GET', '/admin/settings', { token: admin })).data.settings;
  s.hours[5] = [['18:00', '00:00']];
  const saved = await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  assert.deepEqual(saved.data.settings.hours[5], [['18:00', '24:00']]);

  // link de qrlocal mal escrito: se rechaza y la lista de tarjetas sigue andando
  const card = (await call('GET', '/admin/cards', { token: admin })).data.cards[0];
  assert.equal((await call('POST', '/admin/cards', { token: admin, body: { action: 'update', code: card.code, extUrl: 'https://qrlocal.vercel.app:lrd1/x' } })).status, 400);
  assert.equal((await call('GET', '/admin/cards', { token: admin })).status, 200);

  // reactivar un turno cancelado que ya ocupó otro → 409 (salvo que se fuerce)
  const day = addDays(nowLocal().date, 3);
  const a = (await call('POST', '/register', { body: { name: 'Ana R', phone: '3564111222', pin: '1212' } })).data.token;
  const b = (await call('POST', '/register', { body: { name: 'Beto R', phone: '3564111333', pin: '1313' } })).data.token;
  const ba = await call('POST', '/bookings', { token: a, body: { date: day, time: '09:00', serviceId: 'corte', barberId: 'tomas' } });
  await call('POST', '/bookings/cancel', { token: a, body: { id: ba.data.booking.id } });
  assert.equal((await call('POST', '/bookings', { token: b, body: { date: day, time: '09:00', serviceId: 'corte', barberId: 'tomas' } })).status, 200);
  const re = await call('POST', '/admin/booking/status', { token: admin, body: { date: day, id: ba.data.booking.id, status: 'booked' } });
  assert.equal(re.status, 409);
  assert.equal(re.data.clash, true);

  // "Listo + sumar corte" después de que el cliente ya validó con la tarjeta: no suma otro sello
  s.validation.cooldownHours = 12;
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  const k = (await call('GET', '/admin/nfc', { token: admin })).data.key;
  const c = (await call('POST', '/register', { body: { name: 'Caro R', phone: '3564111444', pin: '1414' } })).data.token;
  const bc = await call('POST', '/bookings', { token: c, body: { date: day, time: '11:00', serviceId: 'corte', barberId: 'nico' } });
  assert.equal((await call('POST', '/validate', { token: c, body: { k } })).data.user.stamps, 1);
  const done = await call('POST', '/admin/booking/status', { token: admin, body: { date: day, id: bc.data.booking.id, status: 'done', validate: true } });
  assert.equal(done.data.already, true);
  assert.equal((await call('GET', '/me', { token: c })).data.user.stamps, 1);

  // bajar la cantidad de cortes del premio convierte los sellos sobrantes en premios
  await call('POST', '/admin/client', { token: admin, body: { phone: '3564111444', action: 'stamp-add' } }); // 2 de 3
  s.loyalty.goal = 2;
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
  const me = (await call('GET', '/me', { token: c })).data.user;
  assert.equal(me.stamps, 0);
  assert.equal(me.rewards, 1);
  s.loyalty.goal = 3;
  s.validation.cooldownHours = 0;
  await call('POST', '/admin/settings', { token: admin, body: { settings: s } });
});

test('el bloqueo del PIN del panel es por IP', async () => {
  const from = (ip, pin) => api(new Request('https://lord.test/api/admin/login', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-nf-client-connection-ip': ip }, body: JSON.stringify({ pin }),
  }));
  for (let i = 0; i < 5; i++) await from('203.0.113.9', '0000');
  assert.equal((await from('203.0.113.9', '9876')).status, 429);
  assert.equal((await from('198.51.100.7', '9876')).status, 200);
});

test('bloqueo tras PIN incorrecto repetido', async () => {
  await call('POST', '/register', { body: { name: 'Eva', phone: '3564666666', pin: '6666' } });
  for (let i = 0; i < 5; i++) await call('POST', '/login', { body: { phone: '3564666666', pin: '0000' } });
  const locked = await call('POST', '/login', { body: { phone: '3564666666', pin: '6666' } });
  assert.equal(locked.status, 429);
});

test('ajustes inválidos se rechazan', async () => {
  const s = (await call('GET', '/admin/settings', { token: admin })).data.settings;
  const r = await call('POST', '/admin/settings', { token: admin, body: { settings: { ...s, barbers: [] } } });
  assert.equal(r.status, 400);
});
