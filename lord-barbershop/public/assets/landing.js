import { loadConfig, esc, money, dur, hoursSummary, contactLink, igLink, waLink, store, CROWN } from './app.js';

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- nav ----------
const nav = document.getElementById('nav');
const bookBar = document.getElementById('bookBar');
const onScroll = () => {
  nav.classList.toggle('solid', scrollY > 30);
  bookBar.classList.toggle('show', scrollY > innerHeight * 0.7);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = document.getElementById('burger');
const mmenu = document.getElementById('mmenu');
const setMenu = (open) => {
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  mmenu.hidden = !open;
  if (open) nav.classList.add('solid'); else onScroll();
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
mmenu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Si ya tiene cuenta guardada, el botón lo dice.
if (store.get('lord.token')) {
  let user = null;
  try { user = JSON.parse(store.get('lord.user') || 'null'); } catch { /* dato viejo */ }
  const label = user?.name ? `Hola, ${user.name.split(' ')[0]}` : 'Mi tarjeta';
  document.getElementById('navAccount').textContent = label;
  document.getElementById('mAccount').textContent = label;
}

// ---------- aparición al hacer scroll ----------
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
const observe = (root = document) => root.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
observe();

// ---------- contenido desde la configuración del local ----------
const svcGrid = document.getElementById('svcGrid');
svcGrid.innerHTML = '<div class="svc skeleton"></div>'.repeat(3);

const s = await loadConfig();

svcGrid.innerHTML = s.services.map((x, i) => `
  <article class="svc reveal" style="--d:${(i % 4) * 0.06}s">
    <div class="svc-top"><h3>${esc(x.name)}</h3><span class="svc-dur">${dur(x.duration)}</span></div>
    <p>${esc(x.desc || '')}</p>
    <div class="svc-bottom">
      <span class="svc-price">${x.price ? money(x.price) : 'Consultar'}</span>
      <a class="btn btn-line" href="/cuenta?servicio=${encodeURIComponent(x.id)}#reservar" aria-label="Reservar ${esc(x.name)}">Reservar</a>
    </div>
  </article>`).join('');

document.getElementById('goalTxt').textContent = s.loyalty.goal;
document.getElementById('rewardTxt').textContent = /gratis/i.test(s.loyalty.reward) ? 'gratis' : `premio: ${s.loyalty.reward.toLowerCase()}`;

const planGrid = document.getElementById('planGrid');
if (s.plans.length) {
  planGrid.innerHTML = s.plans.map((p, i) => `
    <article class="plan reveal" style="--d:${i * 0.08}s">
      <h3>${esc(p.name)}</h3>
      <div class="plan-price"><b>${p.price ? money(p.price) : 'Consultar'}</b><small>/ ${p.days} días</small></div>
      <ul>${(p.perks.length ? p.perks : [`${p.cuts} cortes`]).map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
      <a class="btn btn-gold btn-block" href="${esc(contactLink(s, `Hola! Quiero la membresía ${p.name} de Lord`))}" target="_blank" rel="noopener">Quiero esta membresía</a>
    </article>`).join('');
} else {
  document.getElementById('membresias').hidden = true;
  document.querySelectorAll('a[href="#membresias"]').forEach((a) => a.remove());
}

// Horarios y ubicación
document.getElementById('hoursList').innerHTML = hoursSummary(s)
  .map((g) => `<div><dt>${esc(g.days)}</dt><dd class="${g.closed ? 'closed' : ''}">${esc(g.hours)}</dd></div>`).join('');

const b = s.business;
const addr = document.getElementById('visitAddr');
addr.innerHTML = b.address
  ? `<b>${esc(b.address)}</b>${esc(b.city || '')}`
  : `<b>${esc(b.city || 'Consultá la dirección')}</b>Escribinos y te pasamos cómo llegar.`;

const links = [];
const maps = b.mapsUrl || (b.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.address} ${b.city || ''}`)}` : null);
if (maps) links.push(`<a class="btn btn-line" href="${esc(maps)}" target="_blank" rel="noopener">Cómo llegar</a>`);
const wa = waLink(b.whatsapp, 'Hola! Tengo una consulta para Lord');
if (wa) links.push(`<a class="btn btn-line" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>`);
const ig = igLink(b.instagram);
if (ig) links.push(`<a class="btn btn-line" href="${esc(ig)}" target="_blank" rel="noopener">@${esc(b.instagram)}</a>`);
document.getElementById('visitLinks').innerHTML = links.join('');
const footIg = document.getElementById('footIg');
if (ig) footIg.href = ig; else footIg.remove();

observe();

// ---------- demo de la tarjeta (sellos que se llenan) ----------
(() => {
  const goal = Math.min(s.loyalty.goal, 10);
  const box = document.getElementById('demoStamps');
  const count = document.getElementById('demoCount');
  const ok = document.getElementById('demoOk');
  document.getElementById('demoGoal').textContent = goal;
  box.style.gridTemplateColumns = `repeat(${Math.min(5, goal)},1fr)`;
  box.innerHTML = `<span>${CROWN}</span>`.repeat(goal);
  const dots = [...box.children];
  let n = 3;
  const paint = () => { dots.forEach((d, i) => d.classList.toggle('on', i < n)); count.textContent = n; };
  paint();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  setInterval(() => {
    n = n >= goal ? 1 : n + 1;
    setTimeout(() => { paint(); ok.classList.add('show'); }, 2100);
    setTimeout(() => ok.classList.remove('show'), 4200);
  }, 6000);
})();

// ---------- galería: muestra /fotos/1.jpg, 2.jpg, … hasta la primera que falte ----------
(() => {
  const grid = document.getElementById('galGrid');
  const sec = document.getElementById('galeria');
  const next = (i) => {
    if (i > 24) return;
    const img = new Image();
    img.decoding = 'async';
    img.alt = `Trabajo de Lord Barber Shop ${i}`;
    img.onload = () => {
      const fig = document.createElement('figure');
      fig.append(img);
      grid.append(fig);
      if (i === 1) { sec.hidden = false; observe(sec); }
      next(i + 1);
    };
    img.src = `/fotos/${i}.jpg`;
  };
  next(1);
  const more = document.getElementById('igMore');
  if (ig) more.href = ig; else more.remove();
})();
