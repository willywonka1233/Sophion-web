# Sophion — Videos de venta (Remotion)

6 anuncios verticales (1080×1920) para vender 3 ebooks, con 2 ángulos de
comunicación cada uno, subtítulos estilo Helvetica Neue 75 y narración
opcional de ElevenLabs con eco.

## Los 6 videos

| ID | Ebook | Ángulo | CTA |
|----|-------|--------|-----|
| `sistema-nervioso-a` | Sistema Nervioso | "No es ansiedad" (call-out) | Comentá **SISTEMA** |
| `sistema-nervioso-b` | Sistema Nervioso | Mecanismo / curiosidad | Comentá **SISTEMA** |
| `reset-dopamina-a` | Reset de Dopamina | "Nada te emociona" (call-out) | Comentá **RESET** |
| `reset-dopamina-b` | Reset de Dopamina | Protocolo 7 días (promesa) | Comentá **RESET** |
| `enfoque-profundo-a` | Enfoque Profundo | "No es disciplina" (call-out) | Comentá **ENFOQUE** |
| `enfoque-profundo-b` | Enfoque Profundo | Top performers / deep work | Comentá **ENFOQUE** |

Cada video dura ~20-25s, con cortes rápidos que intercambian los clips para
mantener el ritmo y la retención.

## Requisitos

- Node 22+
- Chromium (en este entorno ya está; ver `remotion.config.ts`)

## Comandos

```bash
npm install

# Estudio interactivo (previsualizar / editar en vivo)
npm run dev

# Renderizar un video
npx remotion render src/index.ts sistema-nervioso-a out/sistema-nervioso-a.mp4

# Renderizar los 6
npm run render:all
```

## Voz de ElevenLabs (con eco)

La voz no está incluida porque necesita tu API key. Para agregarla:

```bash
# 1) Genera la narración por segmento, le aplica eco y sincroniza el timing
ELEVENLABS_API_KEY=tu_key node --import tsx scripts/generate-voice.mjs
#   Opcional: ELEVEN_VOICE_ID=... (default: voz masculina grave multilingüe)

# 2) Renderiza con la voz activada
REMOTION_HAS_VOICE=1 npm run render:all
```

El script crea `public/voice/<id>.mp3` y ajusta `public/voice/timing.json`
para que los cortes y subtítulos queden alineados con lo que se dice.

## Personalización

- **Guiones / hooks:** `src/data/scripts.ts` (texto, qué clip usa cada parte,
  duración). Las palabras entre `*asteriscos*` se resaltan con el color de acento.
- **Música:** por defecto usa el audio del clip del cerebro como fondo. Para
  poner tu pista, dejá `public/music.mp3` y cambiá `BED_SRC` en
  `src/VideoTemplate.tsx`.
- **Subtítulos (fuente):** `src/components/Subtitle.tsx`. Usa el stack
  `Helvetica Neue`. Para la fuente exacta licenciada, dejá el `.woff2` en
  `public/fonts/` y la cargamos con `@font-face`.
- **Clips:** `public/clips/`.
