/* ======================================================================
   SOPHION · Generador de Carruseles  —  app.js
   Estilo "image-forward" (tipo neuroglobe): imagen a sangre completa,
   texto abajo, titular en mayúsculas con palabras resaltadas en un color,
   logo (barrita–logo–barrita) centrado en la portada.
   Exporta cada slide a PNG 1080x1350 con html2canvas; todo en .zip con JSZip.
   ====================================================================== */

(() => {
  'use strict';

  const W = 1080, H = 1350;
  const STORAGE_KEY = 'sophion_carousel_v3';
  const SWIPE_TEXT = 'DESLIZA';

  /* ----------------------------- Estado ----------------------------- */
  const DEFAULT_BRAND = {
    name: 'SOPHION',
    handle: '@sophion.club',
    logo: 'assets/logo-sophion.png', // escudo Sophion Club precargado (reemplazable)
    accent: '#efe4ae',   // amarillo suave tirando a blanco
    bg: '#05070f',       // azul noche
    fontDisplay: 'Archivo',
    fontBody: 'Inter',
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
      image: null,
      heading: '',
      body: '',
      swipe: true,
    };
    if (type === 'cover') {
      base.heading = 'Tu *titular* con gancho aquí';
    } else if (type === 'content') {
      base.heading = 'Idea *principal* del slide';
      base.body = 'Desarrolla la idea con un texto claro y directo.';
    } else if (type === 'closing') {
      base.heading = '*Síguenos* para más';
      base.swipe = false;
    }
    return base;
  }

  /* ----------------------------- Utilidades ----------------------------- */
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
  // escapa y convierte *palabra* en resaltado de color; los saltos de línea
  // se conservan tal cual (el CSS usa white-space: pre-wrap)
  function fmt(text) {
    return escapeHtml(text).replace(/\*([^*\n]+)\*/g, '<span class="k">$1</span>');
  }

  /* ----------------------------- Variables de marca ----------------------------- */
  function applyBrandVars(el, brand) {
    el.style.setProperty('--accent', brand.accent);
    el.style.setProperty('--bg', brand.bg);
    el.style.setProperty('--font-display', `'${brand.fontDisplay}'`);
    el.style.setProperty('--font-body', `'${brand.fontBody}'`);
    el.style.setProperty('--glow', rgba(brand.accent, 0.55));
  }

  /* ----------------------------- Markup de slide ----------------------------- */
  function bgMarkup(slide) {
    return slide.image
      ? `<div class="bg" style="background-image:url('${slide.image}')"></div>`
      : `<div class="bg is-empty"></div>`;
  }
  function dividerMarkup(brand) {
    const mark = brand.logo
      ? `<img src="${brand.logo}" alt="logo" />`
      : `<span class="mark">&#9670;</span>`;
    return `<div class="divider"><span class="ln"></span>${mark}<span class="ln"></span></div>`;
  }

  function slideMarkup(slide, brand) {
    const bg = bgMarkup(slide);
    const scrim = `<div class="scrim"></div>`;
    const heading = slide.heading ? `<h1 class="hl">${fmt(slide.heading)}</h1>` : '';
    const body = slide.body ? `<p class="body">${fmt(slide.body)}</p>` : '';
    const swipe = slide.swipe ? `<span class="swipe">${escapeHtml(SWIPE_TEXT)}</span>` : '';

    if (slide.type === 'cover') {
      return `${bg}${scrim}<div class="block">${dividerMarkup(brand)}${heading}</div>${swipe}`;
    }
    if (slide.type === 'closing') {
      return `${bg}${scrim}<div class="block">${dividerMarkup(brand)}${heading}${body}</div>`;
    }
    // content
    return `${bg}${scrim}<div class="block">${heading}${body}</div>${swipe}`;
  }

  function renderInto(el, slide, brand) {
    el.dataset.type = slide.type;
    applyBrandVars(el, brand);
    el.innerHTML = slideMarkup(slide, brand);
  }

  /* ----------------------------- Render principal ----------------------------- */
  const stage = document.getElementById('stage');
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

    renderInto(stage, state.slides[state.current], state.brand);
    document.getElementById('nav-indicator').textContent = `${state.current + 1} / ${total}`;

    renderThumbs();
    syncEditor();
    fitPreview();
  }

  function renderThumbs() {
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
      renderInto(mini, slide, state.brand);

      const scale = thumb.clientWidth / W;
      const scaler = thumb.querySelector('.thumb-scaler');
      scaler.style.transform = `scale(${scale})`;
      scaler.style.width = W + 'px';
      scaler.style.height = H + 'px';

      thumb.addEventListener('click', () => { state.current = i; render(); });
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
    heading: document.getElementById('f-heading'),
    body: document.getElementById('f-body'),
    swipe: document.getElementById('f-swipe'),
  };

  function updateFieldVisibility(type) {
    document.querySelectorAll('[data-show]').forEach((el) => {
      const types = el.getAttribute('data-show').split(' ');
      el.style.display = types.includes(type) ? 'flex' : 'none';
    });
  }

  function syncEditor() {
    const s = state.slides[state.current];
    if (!s) return;
    F.type.value = s.type;
    F.heading.value = s.heading || '';
    F.body.value = s.body || '';
    F.swipe.checked = !!s.swipe;
    document.getElementById('btn-clear-image').hidden = !s.image;
    document.getElementById('heading-label').textContent =
      s.type === 'cover' ? 'Título de portada' : s.type === 'closing' ? 'Llamada a la acción' : 'Titular';
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
  F.heading.addEventListener('input', () => patch('heading', F.heading.value));
  F.body.addEventListener('input', () => patch('body', F.body.value));
  F.swipe.addEventListener('change', () => patch('swipe', F.swipe.checked));

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
    accent: document.getElementById('b-accent'),
    bg: document.getElementById('b-bg'),
    fontDisplay: document.getElementById('b-font-display'),
    fontBody: document.getElementById('b-font-body'),
  };

  function syncBrandPanel() {
    B.name.value = state.brand.name;
    B.handle.value = state.brand.handle;
    B.accent.value = state.brand.accent;
    B.bg.value = state.brand.bg;
    B.fontDisplay.value = state.brand.fontDisplay;
    B.fontBody.value = state.brand.fontBody;
    document.getElementById('btn-clear-logo').hidden = !state.brand.logo;
  }

  function bindBrand(key, input, ev = 'input') {
    input.addEventListener(ev, () => {
      state.brand[key] = input.value;
      render();
      persist();
    });
  }
  bindBrand('name', B.name);
  bindBrand('handle', B.handle);
  bindBrand('accent', B.accent);
  bindBrand('bg', B.bg);
  bindBrand('fontDisplay', B.fontDisplay, 'change');
  bindBrand('fontBody', B.fontBody, 'change');

  // presets de color de acento
  document.querySelectorAll('.preset[data-accent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.brand.accent = btn.getAttribute('data-accent');
      B.accent.value = state.brand.accent;
      render();
      persist();
    });
  });

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

  document.getElementById('btn-save-brand').addEventListener('click', () => { persist(); flash('Marca guardada ✓'); });
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

  async function renderSlideToCanvas(slide) {
    const el = document.createElement('div');
    el.className = 'slide';
    el.style.width = W + 'px';
    el.style.height = H + 'px';
    renderInto(el, slide, state.brand);
    sandbox.appendChild(el);

    await waitForImages(el);

    const canvas = await html2canvas(el, {
      width: W, height: H, scale: 1,
      backgroundColor: null, useCORS: true, logging: false,
      imageTimeout: 4000,
    });
    sandbox.removeChild(el);
    return canvas;
  }

  function waitForImages(el) {
    const urls = [];
    el.querySelectorAll('img').forEach((img) => urls.push(img.src));
    el.querySelectorAll('.bg').forEach((b) => {
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
    const canvas = await renderSlideToCanvas(state.slides[state.current]);
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
      const canvas = await renderSlideToCanvas(state.slides[i]);
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
      toastEl.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#14100a;border:1px solid #e7c46a;color:#fff;padding:10px 18px;border-radius:10px;font-size:14px;z-index:99;box-shadow:0 8px 30px rgba(0,0,0,.5);transition:opacity .3s;';
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
        heading: 'La *psicología* de la calma:\ncómo regular tu *sistema nervioso*',
      }),
      Object.assign(newSlide('content'), {
        heading: 'Vives en modo\n*supervivencia*',
        body: 'Cuando el sistema nervioso se desregula, tu cuerpo interpreta la calma como una amenaza. No es falta de voluntad: es fisiología.',
      }),
      Object.assign(newSlide('content'), {
        heading: 'Respira *lento*\npara volver a tu eje',
        body: 'Inhala 4s, exhala 6s. La exhalación larga activa el sistema parasimpático y le avisa al cerebro que estás a salvo.',
      }),
      Object.assign(newSlide('closing'), {
        heading: '*Síguenos* para entrenar\ntu *calma*',
        body: 'Y guarda esto para tu próxima tormenta.',
        swipe: false,
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
