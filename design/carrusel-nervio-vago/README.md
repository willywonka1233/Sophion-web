# Carrusel — Nervio vago

Carrusel de Instagram de 7 diapositivas en 1080 × 1350 (4:5), construido en el
lenguaje visual de @sophionclub.

## Archivos

| Archivo | Diapositiva |
| --- | --- |
| `Main.dc.html` | 01 · Portada |
| `Cableado.dc.html` | 02 · El cableado |
| `Senal.dc.html` | 03 · La señal (HRV) |
| `Ruido.dc.html` | 04 · Lo que lo apaga |
| `Palancas.dc.html` | 05 · Tres palancas |
| `Protocolo.dc.html` | 06 · Protocolo de 7 días |
| `Cierre.dc.html` | 07 · Cierre y CTA |
| `figura.jpg` `busto.jpg` `frio.jpg` | Imágenes de fondo (provisionales) |
| `PROMPTS.md` | Prompts para regenerar las imágenes |
| `canvas.json` | Posición de cada tabla en el lienzo |
| `nervio-vago-carrusel.html` | Lienzo generado (no editar a mano) |

Cada `.dc.html` es una diapositiva independiente y autocontenida.

## Sistema visual

Fondo
: `radial-gradient(112% 78% at 60% 18%, #101b2f, #080d18 46%, #04060c)`, con
  bokeh dorado en SVG, grano `feTurbulence` al 5,5 % y viñeta radial.

Oro
: `#f2a93c` (línea), `#ffca6d` (trazo luminoso), `#f8c168` (texto de acento),
  `#ffe6ae` / `#fff6de` (nodos y núcleos).

Texto
: `#f7efe0` en títulos, `rgba(244,236,221,.82)` en cuerpo,
  `rgba(244,236,221,.42)` en el pie.

Tipografía
: Cormorant Garamond 600 para titulares (fallback Georgia); Archivo para
  antetítulos, cuerpo y pie (fallback Helvetica / Arial). Antetítulos en
  versales con `letter-spacing: .28em`.

Retícula
: márgenes de 96 px; antetítulo en y 96; titular en y 172 a 96 px con
  `line-height: .98`; pie a 76 px del borde inferior.

Imagen
: las diapositivas 01, 02, 05 y 07 se montan sobre fotografía a sangre
  (`object-fit: cover`) con un degradado de oscurecimiento encima y la
  tipografía en la mitad inferior. Las imágenes actuales son las portadas de
  las publicaciones existentes a 640 × 640: sirven de referencia de encuadre,
  no de material final. Ver `PROMPTS.md`.

Ilustración
: gráficos HUD en SVG y figura neural en SVG (`viewBox 0 0 600 820`) — contorno del busto al 26 % de
  opacidad, troncos dorados de 2,1 px, dendritas de 1,2 px, nodos luminosos y
  un plexo radial en el pecho, todo con un filtro de resplandor
  (`feGaussianBlur` + doble `feMerge`).

## Regenerar el lienzo

```bash
node "<skill>/seed-canvas.mjs" \
  --template "<skill>/payload.template.html" \
  --out nervio-vago-carrusel.html \
  --title "Nervio Vago · Carrusel" \
  --artboard Main.dc.html --artboard Cableado.dc.html --artboard Senal.dc.html \
  --artboard Ruido.dc.html --artboard Palancas.dc.html \
  --artboard Protocolo.dc.html --artboard Cierre.dc.html \
  --canvas canvas.json
```
