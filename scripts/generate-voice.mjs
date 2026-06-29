// Genera la voz en off por segmento, le aplica eco y arma public/voice/<id>.mp3
// + public/voice/timing.json para sincronizar el video con la narración.
//
// Por defecto usa EDGE TTS (Microsoft) — GRATIS, sin API key.
// Si defines ELEVENLABS_API_KEY, usa ElevenLabs en su lugar.
//
// Uso:
//   node --import tsx scripts/generate-voice.mjs
// Opcionales:
//   VOICE=es-US-AlonsoNeural   (voz Edge TTS; default Alonso, masculino neutro)
//   RATE=-6%   PITCH=-2Hz      (ajuste de velocidad / tono para Edge)
//   ELEVENLABS_API_KEY=...     (fuerza ElevenLabs)
//   ELEVEN_VOICE_ID=...        (voz ElevenLabs)
//
// Después: REMOTION_HAS_VOICE=1 npm run render:all

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const FFMPEG = require("@ffmpeg-installer/ffmpeg").path;
const FFPROBE = require("ffprobe-static").path;

const FPS = 30;
const USE_ELEVEN = !!process.env.ELEVENLABS_API_KEY;

// Edge TTS
const EDGE_VOICE = process.env.VOICE || "es-US-AlonsoNeural";
const EDGE_RATE = process.env.RATE || "-6%";
const EDGE_PITCH = process.env.PITCH || "-2Hz";
const SSL_CERT_FILE =
  process.env.SSL_CERT_FILE ||
  "/root/.local/lib/python3.11/site-packages/certifi/cacert.pem";

// ElevenLabs
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE = process.env.ELEVEN_VOICE_ID || "pNInz6obpgDQGcFmaJgB";
const ELEVEN_MODEL = process.env.ELEVEN_MODEL || "eleven_multilingual_v2";

const { SCRIPTS } = await import("../src/data/scripts.ts");

const clean = (t) => t.replace(/\*/g, "").trim();

const VOICE_DIR = path.resolve("public/voice");
const TMP = path.resolve(".voice-tmp");
mkdirSync(VOICE_DIR, { recursive: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

async function ttsEdge(text, outFile) {
  execFileSync(
    "python3",
    ["-m", "edge_tts", "--voice", EDGE_VOICE, `--rate=${EDGE_RATE}`,
     `--pitch=${EDGE_PITCH}`, "--text", text, "--write-media", outFile],
    { stdio: "ignore", env: { ...process.env, SSL_CERT_FILE } }
  );
}

async function ttsEleven(text, outFile) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`,
    {
      method: "POST",
      headers: { "xi-api-key": ELEVEN_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text, model_id: ELEVEN_MODEL,
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
      }),
    }
  );
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
}

const tts = USE_ELEVEN ? ttsEleven : ttsEdge;

const probeDur = (f) =>
  parseFloat(
    execFileSync(FFPROBE, [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", f,
    ]).toString().trim()
  );

console.log(`Motor de voz: ${USE_ELEVEN ? "ElevenLabs" : `Edge TTS (${EDGE_VOICE})`}`);
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
    // Eco sutil + normalización de volumen.
    execFileSync(FFMPEG, [
      "-y", "-i", raw,
      "-af", "aecho=0.85:0.9:90:0.22,loudnorm=I=-16:TP=-1.5:LRA=11",
      echoed,
    ], { stdio: "ignore" });

    const d = probeDur(echoed);
    const frames = Math.max(Math.ceil((d + 0.4) * FPS), Math.round(seg.sec * FPS));
    segFrames.push(frames);

    const padded = path.join(TMP, `${script.id}_${i}_pad.mp3`);
    const totalSec = (frames / FPS).toFixed(3);
    execFileSync(FFMPEG, [
      "-y", "-i", echoed,
      "-af", "apad",
      "-t", totalSec, padded,
    ], { stdio: "ignore" });
    segFiles.push(padded);
    console.log(`   seg ${i}: ${d.toFixed(2)}s -> ${frames} frames`);
  }

  const listFile = path.join(TMP, `${script.id}_list.txt`);
  writeFileSync(listFile, segFiles.map((f) => `file '${f}'`).join("\n"));
  const out = path.join(VOICE_DIR, `${script.id}.mp3`);
  execFileSync(FFMPEG, [
    "-y", "-f", "concat", "-safe", "0", "-i", listFile,
    "-c:a", "libmp3lame", "-q:a", "2", out,
  ], { stdio: "ignore" });

  timing[script.id] = segFrames;
  console.log(`   ✅ ${out} (${segFrames.reduce((a, b) => a + b, 0)} frames)`);
}

writeFileSync(path.join(VOICE_DIR, "timing.json"), JSON.stringify(timing, null, 2));
console.log("\n✅ Voz lista. Ahora: REMOTION_HAS_VOICE=1 npm run render:all");
