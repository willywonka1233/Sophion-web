// Genera la voz en off (ElevenLabs) por segmento, le aplica eco y arma
// public/voice/<id>.mp3 + public/voice/timing.json para que el video quede
// sincronizado con la narración.
//
// Uso:
//   ELEVENLABS_API_KEY=xxxx node scripts/generate-voice.mjs
// Opcionales:
//   ELEVEN_VOICE_ID=...   (default: voz masculina grave multilingüe)
//   ELEVEN_MODEL=...      (default: eleven_multilingual_v2)
//
// Después renderizá con voz:  npm run render:all  (con REMOTION_HAS_VOICE=1)

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const FFMPEG =
  require("@ffmpeg-installer/ffmpeg")?.path ||
  process.env.FFMPEG_PATH ||
  "ffmpeg";
const FFPROBE = require("ffprobe-static").path;

const FPS = 30;
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVEN_VOICE_ID || "pNInz6obpgDQGcFmaJgB"; // grave masculina
const MODEL = process.env.ELEVEN_MODEL || "eleven_multilingual_v2";

if (!API_KEY) {
  console.error("Falta ELEVENLABS_API_KEY. Ejemplo:\n  ELEVENLABS_API_KEY=xxx node scripts/generate-voice.mjs");
  process.exit(1);
}

// Importa los guiones (TS) vía tsx si está, si no parsea el texto manualmente.
const { SCRIPTS } = await import("../src/data/scripts.ts").catch(async () => {
  // Fallback: compilar al vuelo no disponible -> pedir tsx
  console.error("No se pudo importar scripts.ts directamente. Instalá tsx: npm i -D tsx, y corré con: node --import tsx scripts/generate-voice.mjs");
  process.exit(1);
});

const clean = (t) => t.replace(/\*/g, "").trim();

const VOICE_DIR = path.resolve("public/voice");
const TMP = path.resolve(".voice-tmp");
mkdirSync(VOICE_DIR, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

async function tts(text, outFile) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outFile, buf);
}

const probeDur = (f) =>
  parseFloat(
    execFileSync(FFPROBE, [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", f,
    ]).toString().trim()
  );

const timing = {};

for (const script of SCRIPTS) {
  console.log(`\n🎙  ${script.id}`);
  const segFiles = [];
  const segFrames = [];

  for (let i = 0; i < script.segments.length; i++) {
    const seg = script.segments[i];
    const raw = path.join(TMP, `${script.id}_${i}_raw.mp3`);
    const echoed = path.join(TMP, `${script.id}_${i}.mp3`);
    await tts(clean(seg.text), raw);
    // Eco sutil + leve normalización.
    execFileSync(FFMPEG, [
      "-y", "-i", raw,
      "-af", "aecho=0.85:0.9:90:0.22,loudnorm=I=-16:TP=-1.5:LRA=11",
      echoed,
    ], { stdio: "ignore" });

    const d = probeDur(echoed);
    // Duración del segmento = voz + 0.45s de aire, mínimo el original.
    const frames = Math.max(Math.ceil((d + 0.45) * FPS), Math.round(seg.sec * FPS));
    segFrames.push(frames);

    // Pad de silencio al final para alinear con el slot del segmento.
    const padded = path.join(TMP, `${script.id}_${i}_pad.mp3`);
    const padSec = (frames / FPS - d).toFixed(3);
    execFileSync(FFMPEG, [
      "-y", "-i", echoed,
      "-af", `apad=pad_dur=${padSec}`,
      "-t", (frames / FPS).toFixed(3),
      padded,
    ], { stdio: "ignore" });
    segFiles.push(padded);
    console.log(`   seg ${i}: voz ${d.toFixed(2)}s -> ${frames} frames`);
  }

  // Concatena todos los segmentos -> voice/<id>.mp3
  const listFile = path.join(TMP, `${script.id}_list.txt`);
  writeFileSync(listFile, segFiles.map((f) => `file '${f}'`).join("\n"));
  const out = path.join(VOICE_DIR, `${script.id}.mp3`);
  execFileSync(FFMPEG, [
    "-y", "-f", "concat", "-safe", "0", "-i", listFile,
    "-c:a", "libmp3lame", "-q:a", "2", out,
  ], { stdio: "ignore" });

  timing[script.id] = segFrames;
  console.log(`   ✅ ${out} (total ${segFrames.reduce((a, b) => a + b, 0)} frames)`);
}

writeFileSync(path.join(VOICE_DIR, "timing.json"), JSON.stringify(timing, null, 2));
console.log("\n✅ Voz generada. Ahora: REMOTION_HAS_VOICE=1 npm run render:all");
