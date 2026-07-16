/* ======================================================================
   SOPHION · Generador de Carruseles  —  app.js
   Vanilla JS, sin dependencias de build.
   Exporta cada slide a PNG 1080x1350 con html2canvas; todo en .zip con JSZip.
   ====================================================================== */

(() => {
  'use strict';

  const W = 1080, H = 1350;
  const STORAGE_KEY = 'sophion_carousel_v1';

  /* ----------------------------- Estado ----------------------------- */
  const DEFAULT_BRAND = {
    name: 'SOPHION',
    handle: '@sophion',
    logo: null,
    bgDeep: '#05060f',
    bgMid: '#160b33',
    accent: '#7c5cff',
    accent2: '#3de0ff',
    text: '#ffffff',
    muted: '#b9b6d8',
    fontDisplay: 'Space Grotesk',
    fontBody: 'Inter',
    starfield: true,
  };

  const state = {
    brand: { ...DEFAULT_BRAND },
    slides: [],
    current: 0,
  };

  /* ----------------------------- Plantillas de slide ----------------------------- */
  function newSlide(type) {
    const base = {
      id: 's' + Math.random().toString(36).slice(2, 9),
      type,
      kicker: '',
      heading: '',
      body: '',
      image: null,
      bannerHeight: 48,
      bannerPos: 50,
      cta: 'Sigue · Comenta · Guarda · Comparte',
      showIndex: true,
    };
    if (type === 'cover') {
      base.kicker = 'NEUROCIENCIA';
      base.heading = 'TU FRASE CON GANCHO AQUÍ';
      base.body = 'Subtítulo breve que refuerza el hook';
    } else if (type === 'content') {
      base.heading = 'Idea principal del slide';
      base.body = 'Desarrolla la idea con un texto claro y respirable.';
    } else if (type === 'closing') {
      base.heading = 'Guarda esto para releerlo';
      base.body = 'Y compártelo con quien lo necesite.';
    }
    return base;
  }

  /* ----------------------------- Utilidades de color ----------------------------- */
  function hexToRgb(hex) {
    let h = (hex || '#000000').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgba(hex, a) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  /* ----------------------------- Aplicar variables de marca ----------------------------- */
  function applyBrandVars(el, brand, slide) {
    const v = {
      '--bg-deep': brand.bgDeep,
      '--bg-mid': brand.bgMid,
      '--accent': brand.accent,
      '--accent2': brand.accent2,
      '--text': brand.text,
      '--muted': brand.muted,
      '--font-display': `'${brand.fontDisplay}'`,
      '--font-body': `'${brand.fontBody}'`,
      // derivados en rgba (evita color-mix por compatibilidad con html2canvas)
      '--glow-accent': rgba(brand.accent, 0.28),
      '--glow-accent2': rgba(brand.accent2, 0.20),
      '--fade-deep': rgba(brand.bgDeep, 0.92),
      '--kicker-border': rgba(brand.accent2, 0.45),
      '--kicker-bg': rgba(brand.accent2, 0.10),
      '--chip-border': rgba(brand.accent, 0.55),
      '--chip-bg': rgba(brand.accent, 0.16),
    };
    for (const k in v) el.style.setProperty(k, v[k]);
    if (slide) {
      el.style.setProperty('--banner-h', slide.bannerHeight + '%');
      el.style.setProperty('--banner-pos', slide.bannerPos + '%');
    }
    el.classList.toggle('has-stars', !!brand.starfield);
  }

  /* ----------------------------- Markup de slide ----------------------------- */
  function brandIdMarkup(brand) {
    return brand.logo
      ? `<img src="${brand.logo}" alt="logo" />`
      : `<span class="name">${escapeHtml(brand.name)}</span>`;
  }

  function bannerMarkup(slide) {
    if (!slide.image) return `<div class="banner is-empty"></div>`;
    return `<div class="banner" style="background-image:url('${slide.image}')"></div>`;
  }

  function slideMarkup(slide, brand, info) {
    const kicker = slide.kicker ? `<span class="kicker"><span class="kdot"></span><span class="klabel">${escapeHtml(slide.kicker)}</span></span>` : '';
    const heading = slide.heading ? `<h1 class="heading">${escapeHtml(slide.heading)}</h1>` : '';
    const body = slide.body ? `<p class="body">${escapeHtml(slide.body)}</p>` : '';

    if (slide.type === 'cover') {
      return `
        ${bannerMarkup(slide)}
        <div class="inner">
          ${kicker}
          ${heading}
          ${body}
        </div>
        <div class="footer">
          <div class="brand-id">${brandIdMarkup(brand)}</div>
          <span class="swipe"><span class="swipe-label">Desliza</span><span class="arrow">→</span></span>
        </div>`;
    }

    if (slide.type === 'closing') {
      const chips = (slide.cta || '')
        .split('·')
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => `<span class="chip">${escapeHtml(c)}</span>`)
        .join('');
      return `
        ${bannerMarkup(slide)}
        <div class="inner">
          ${kicker}
          ${heading}
          ${body}
          ${chips ? `<div class="chips">${chips}</div>` : ''}
        </div>
        <div class="footer">
          <div class="brand-id">${brandIdMarkup(brand)}</div>
          <span class="handle">${escapeHtml(brand.handle)}</span>
        </div>`;
    }

    // content
    const idx = slide.showIndex
      ? `<span class="index-badge">${String(info.index).padStart(2, '0')}/${String(info.total).padStart(2, '0')}</span>`
      : `<span class="index-badge"></span>`;
    return `
      <div class="top-row">
        ${idx}
        <div class="brand-id">${brandIdMarkup(brand)}</div>
      </div>
      <div class="inner">
        ${kicker}
        ${heading}
        ${body}
      </div>
      <div class="footer">
        <span class="handle">${escapeHtml(brand.handle)}</span>
      </div>`;
  }

  function renderInto(el, slide, brand, info) {
    el.dataset.type = slide.type;
    applyBrandVars(el, brand, slide);
    el.innerHTML = slideMarkup(slide, brand, info);
  }

  /* ----------------------------- Render principal ----------------------------- */
  const stage = document.getElementById('stage');
  const stageScaler = document.getElementById('stage-scaler');
  const filmList = document.getElementById('filmstrip-list');

  function render() {
    const total = state.slides.length;
    document.getElementById('slide-count').textContent = total;

    if (total === 0) {
      stage.innerHTML = '';
      stage.dataset.type = 'cover';
      filmList.innerHTML = '';
      document.getElementById('nav-indicator').textContent = '0 / 0';
      document.getElementById('slide-empty').hidden = false;
      document.getElementById('slide-editor').hidden = true;
      return;
    }
    state.current = Math.max(0, Math.min(state.current, total - 1));
    document.getElementById('slide-empty').hidden = true;
    document.getElementById('slide-editor').hidden = false;

    const slide = state.slides[state.current];
    renderInto(stage, slide, state.brand, { index: state.current + 1, total });

    document.getElementById('nav-indicator').textContent = `${state.current + 1} / ${total}`;

    renderThumbs();
    syncEditor();
    fitPreview();
  }

  function renderThumbs() {
    const total = state.slides.length;
    filmList.innerHTML = '';
    state.slides.forEach((slide, i) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb' + (i === state.current ? ' is-active' : '');
      thumb.innerHTML = `
        <span class="thumb-index">${i + 1}</span>
        <span class="thumb-type">${slide.type === 'cover' ? 'Portada' : slide.type === 'closing' ? 'Cierre' : 'Cont.'}</span>
        <div class="thumb-scaler"><div class="slide"></div></div>`;
      filmList.appendChild(thumb);

      const mini = thumb.querySelector('.slide');
      mini.style.width = W + 'px';
      mini.style.height = H + 'px';
      renderInto(mini, slide, state.brand, { index: i + 1, total });

      // escalar al ancho real del thumb
      const scale = thumb.clientWidth / W;
      const scaler = thumb.querySelector('.thumb-scaler');
      scaler.style.transform = `scale(${scale})`;
      scaler.style.width = W + 'px';
      scaler.style.height = H + 'px';

      thumb.addEventListener('click', () => {
        state.current = i;
        render();
      });
    });
  }

  /* ----------------------------- Escalado del preview ----------------------------- */
  function fitPreview() {
    const wrap = stage.closest('.stage-wrap');
    if (!wrap) return;
    const availW = wrap.clientWidth - 48;
    const availH = wrap.clientHeight - 48;
    const scale = Math.max(0.1, Math.min(availW / W, availH / H));
    document.documentElement.style.setProperty('--preview-scale', scale.toFixed(4));
  }
  window.addEventListener('resize', () => { fitPreview(); renderThumbs(); });

  /* ----------------------------- Editor (panel Slide) ----------------------------- */
  const F = {
    type: document.getElementById('f-type'),
    image: document.getElementById('f-image'),
    bannerHeight: document.getElementById('f-banner-height'),
    bannerPos: document.getElementById('f-banner-pos'),
    kicker: document.getElementById('f-kicker'),
    heading: document.getElementById('f-heading'),
    body: document.getElementById('f-body'),
    cta: document.getElementById('f-cta'),
    showIndex: document.getElementById('f-show-index'),
  };

  function updateFieldVisibility(type) {
    document.querySelectorAll('[data-show]').forEach((el) => {
      const types = el.getAttribute('data-show').split(' ');
      // .field y sus variantes son flex; usar 'flex' (no '') para no recaer en la regla CSS que las oculta
      el.style.display = types.includes(type) ? 'flex' : 'none';
    });
  }

  function syncEditor() {
    const s = state.slides[state.current];
    if (!s) return;
    F.type.value = s.type;
    F.kicker.value = s.kicker || '';
    F.heading.value = s.heading || '';
    F.body.value = s.body || '';
    F.cta.value = s.cta || '';
    F.bannerHeight.value = s.bannerHeight;
    F.bannerPos.value = s.bannerPos;
    F.showIndex.checked = !!s.showIndex;

    const clearBtn = document.getElementById('btn-clear-image');
    clearBtn.hidden = !s.image;

    // etiquetas contextuales
    document.getElementById('heading-label').textContent = s.type === 'cover' ? 'Titular (hook)' : 'Titular';
    updateFieldVisibility(s.type);
  }

  function patch(prop, val) {
    const s = state.slides[state.current];
    if (!s) return;
    s[prop] = val;
    render();
    persist();
  }

  F.type.addEventListener('change', () => patch('type', F.type.value));
  F.kicker.addEventListener('input', () => patch('kicker', F.kicker.value));
  F.heading.addEventListener('input', () => patch('heading', F.heading.value));
  F.body.addEventListener('input', () => patch('body', F.body.value));
  F.cta.addEventListener('input', () => patch('cta', F.cta.value));
  F.bannerHeight.addEventListener('input', () => patch('bannerHeight', +F.bannerHeight.value));
  F.bannerPos.addEventListener('input', () => patch('bannerPos', +F.bannerPos.value));
  F.showIndex.addEventListener('change', () => patch('showIndex', F.showIndex.checked));

  document.getElementById('btn-pick-image').addEventListener('click', () => F.image.click());
  F.image.addEventListener('change', () => {
    const file = F.image.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => patch('image', reader.result);
    reader.readAsDataURL(file);
    F.image.value = '';
  });
  document.getElementById('btn-clear-image').addEventListener('click', () => patch('image', null));

  /* ----------------------------- Acciones de slide ----------------------------- */
  document.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = newSlide(btn.getAttribute('data-add'));
      const at = state.slides.length ? state.current + 1 : 0;
      state.slides.splice(at, 0, s);
      state.current = at;
      render();
      persist();
    });
  });

  document.getElementById('btn-delete').addEventListener('click', () => {
    if (!state.slides.length) return;
    state.slides.splice(state.current, 1);
    state.current = Math.max(0, state.current - 1);
    render();
    persist();
  });

  document.getElementById('btn-duplicate').addEventListener('click', () => {
    const s = state.slides[state.current];
    if (!s) return;
    const copy = { ...s, id: 's' + Math.random().toString(36).slice(2, 9) };
    state.slides.splice(state.current + 1, 0, copy);
    state.current += 1;
    render();
    persist();
  });

  function move(delta) {
    const i = state.current, j = i + delta;
    if (j < 0 || j >= state.slides.length) return;
    [state.slides[i], state.slides[j]] = [state.slides[j], state.slides[i]];
    state.current = j;
    render();
    persist();
  }
  document.getElementById('btn-move-up').addEventListener('click', () => move(-1));
  document.getElementById('btn-move-down').addEventListener('click', () => move(1));

  document.getElementById('nav-prev').addEventListener('click', () => { state.current--; render(); });
  document.getElementById('nav-next').addEventListener('click', () => { state.current++; render(); });

  /* ----------------------------- Panel de marca ----------------------------- */
  const B = {
    name: document.getElementById('b-name'),
    handle: document.getElementById('b-handle'),
    logo: document.getElementById('b-logo'),
    bgDeep: document.getElementById('b-bg-deep'),
    bgMid: document.getElementById('b-bg-mid'),
    accent: document.getElementById('b-accent'),
    accent2: document.getElementById('b-accent2'),
    text: document.getElementById('b-text'),
    muted: document.getElementById('b-muted'),
    fontDisplay: document.getElementById('b-font-display'),
    fontBody: document.getElementById('b-font-body'),
    starfield: document.getElementById('b-starfield'),
  };

  function syncBrandPanel() {
    B.name.value = state.brand.name;
    B.handle.value = state.brand.handle;
    B.bgDeep.value = state.brand.bgDeep;
    B.bgMid.value = state.brand.bgMid;
    B.accent.value = state.brand.accent;
    B.accent2.value = state.brand.accent2;
    B.text.value = state.brand.text;
    B.muted.value = state.brand.muted;
    B.fontDisplay.value = state.brand.fontDisplay;
    B.fontBody.value = state.brand.fontBody;
    B.starfield.checked = state.brand.starfield;
    document.getElementById('btn-clear-logo').hidden = !state.brand.logo;
  }

  function bindBrand(key, input, ev = 'input') {
    input.addEventListener(ev, () => {
      state.brand[key] = input.type === 'checkbox' ? input.checked : input.value;
      render();
      persist();
    });
  }
  bindBrand('name', B.name);
  bindBrand('handle', B.handle);
  bindBrand('bgDeep', B.bgDeep);
  bindBrand('bgMid', B.bgMid);
  bindBrand('accent', B.accent);
  bindBrand('accent2', B.accent2);
  bindBrand('text', B.text);
  bindBrand('muted', B.muted);
  bindBrand('fontDisplay', B.fontDisplay, 'change');
  bindBrand('fontBody', B.fontBody, 'change');
  bindBrand('starfield', B.starfield, 'change');

  document.getElementById('btn-pick-logo').addEventListener('click', () => B.logo.click());
  B.logo.addEventListener('change', () => {
    const file = B.logo.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { state.brand.logo = reader.result; render(); persist(); syncBrandPanel(); };
    reader.readAsDataURL(file);
    B.logo.value = '';
  });
  document.getElementById('btn-clear-logo').addEventListener('click', () => {
    state.brand.logo = null; render(); persist(); syncBrandPanel();
  });

  document.getElementById('btn-save-brand').addEventListener('click', () => {
    persist();
    flash('Marca guardada ✓');
  });
  document.getElementById('btn-load-demo').addEventListener('click', () => {
    if (state.slides.length && !confirm('Esto reemplazará el carrusel actual por el demo. ¿Continuar?')) return;
    state.slides = demoCarousel();
    state.current = 0;
    render();
    persist();
  });

  /* ----------------------------- Tabs ----------------------------- */
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((t) => t.classList.remove('is-active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('is-active'));
      tab.classList.add('is-active');
      document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add('is-active');
    });
  });

  /* ----------------------------- Exportar PNG ----------------------------- */
  const sandbox = document.getElementById('export-sandbox');

  async function renderSlideToCanvas(slide, info) {
    const el = document.createElement('div');
    el.className = 'slide';
    el.style.width = W + 'px';
    el.style.height = H + 'px';
    renderInto(el, slide, state.brand, info);
    sandbox.appendChild(el);

    // esperar a que las imágenes de fondo carguen
    await waitForImages(el);

    const canvas = await html2canvas(el, {
      width: W, height: H, scale: 1,
      backgroundColor: null, useCORS: true, logging: false,
      imageTimeout: 4000, // evita que un recurso lento (p. ej. una fuente) cuelgue la exportación
    });
    sandbox.removeChild(el);
    return canvas;
  }

  function waitForImages(el) {
    const urls = [];
    el.querySelectorAll('img').forEach((img) => urls.push(img.src));
    el.querySelectorAll('.banner').forEach((b) => {
      const m = /url\(["']?(.*?)["']?\)/.exec(b.style.backgroundImage);
      if (m) urls.push(m[1]);
    });
    return Promise.all(urls.map((src) => new Promise((res) => {
      if (!src) return res();
      const im = new Image();
      im.onload = im.onerror = () => res();
      im.src = src;
    })));
  }

  function dataURLtoBlob(dataURL) {
    const [head, b64] = dataURL.split(',');
    const mime = /:(.*?);/.exec(head)[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.getElementById('btn-export-current').addEventListener('click', async () => {
    if (!state.slides.length) return;
    flash('Generando PNG…');
    const total = state.slides.length;
    const canvas = await renderSlideToCanvas(state.slides[state.current], { index: state.current + 1, total });
    canvas.toBlob((blob) => {
      downloadBlob(blob, `sophion-slide-${String(state.current + 1).padStart(2, '0')}.png`);
      flash('PNG listo ✓');
    }, 'image/png');
  });

  document.getElementById('btn-export-all').addEventListener('click', async () => {
    if (!state.slides.length) return;
    const btn = document.getElementById('btn-export-all');
    btn.disabled = true;
    const total = state.slides.length;
    const zip = new JSZip();
    for (let i = 0; i < total; i++) {
      flash(`Generando ${i + 1}/${total}…`);
      const canvas = await renderSlideToCanvas(state.slides[i], { index: i + 1, total });
      const dataURL = canvas.toDataURL('image/png');
      zip.file(`sophion-slide-${String(i + 1).padStart(2, '0')}.png`, dataURLtoBlob(dataURL));
    }
    flash('Comprimiendo .zip…');
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'sophion-carrusel.zip');
    btn.disabled = false;
    flash('Carrusel descargado ✓');
  });

  /* ----------------------------- Toast ----------------------------- */
  let toastEl;
  function flash(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1a1a2c;border:1px solid #7c5cff;color:#fff;padding:10px 18px;border-radius:10px;font-size:14px;z-index:99;box-shadow:0 8px 30px rgba(0,0,0,.5);transition:opacity .3s;';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => { toastEl.style.opacity = '0'; }, 1800);
  }

  /* ----------------------------- Persistencia ----------------------------- */
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ brand: state.brand, slides: state.slides }));
    } catch (e) { /* almacenamiento lleno o no disponible */ }
  }
  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      state.brand = { ...DEFAULT_BRAND, ...data.brand };
      state.slides = Array.isArray(data.slides) ? data.slides : [];
      return true;
    } catch (e) { return false; }
  }

  /* ----------------------------- Carrusel demo ----------------------------- */
  function demoCarousel() {
    return [
      Object.assign(newSlide('cover'), {
        kicker: 'NEUROCIENCIA',
        heading: 'TU CEREBRO NO ESTÁ ROTO, ESTÁ DESREGULADO',
        body: '5 formas de devolverle la calma a tu sistema nervioso',
      }),
      Object.assign(newSlide('content'), {
        kicker: 'EL PROBLEMA',
        heading: 'Vives en modo supervivencia',
        body: 'Cuando el nervio vago se comprime, tu cuerpo interpreta la calma como una amenaza. No es falta de voluntad: es fisiología.',
      }),
      Object.assign(newSlide('content'), {
        kicker: 'CLAVE 01',
        heading: 'Respira por el diafragma',
        body: 'Inhala 4s, exhala 6s. La exhalación larga activa el sistema parasimpático y le avisa al cerebro que estás a salvo.',
      }),
      Object.assign(newSlide('content'), {
        heading: 'La conciencia es el primer paso de cualquier cambio',
        body: 'Ningún patrón puede transformarse mientras permanece invisible.',
      }),
      Object.assign(newSlide('closing'), {
        kicker: 'TU TURNO',
        heading: 'Guarda esto para tu próxima crisis',
        body: 'Y compártelo con quien necesite leerlo hoy.',
        cta: 'Sigue · Comenta · Guarda · Comparte',
      }),
    ];
  }

  /* ----------------------------- Init ----------------------------- */
  function init() {
    const hadSaved = restore();
    if (!hadSaved || state.slides.length === 0) {
      state.slides = demoCarousel();
    }
    syncBrandPanel();
    render();
  }

  init();
})();
