// Masteriza los renders de out/ -> out/final/ :
//  - Voz al frente + música baja, normalizado a -14 LUFS (nivel de redes)
//  - Suaviza el grano, agrega sharpening y un poco de contraste/saturación
//  - yuv420p + faststart, listo para celular
//
// Uso: node scripts/finalize.mjs

import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const FFMPEG = require("@ffmpeg-installer/ffmpeg").path;

const IDS = [
  "sistema-nervioso-a", "sistema-nervioso-b",
  "reset-dopamina-a", "reset-dopamina-b",
  "enfoque-profundo-a", "enfoque-profundo-b",
];

mkdirSync("out/final", { recursive: true });

for (const id of IDS) {
  if (!existsSync(`out/${id}.mp4`)) { console.log(`skip ${id} (no render)`); continue; }
  const voice = `public/voice/${id}.mp3`;
  const hasVoice = existsSync(voice);
  console.log(`🎬 ${id}${hasVoice ? " (con voz)" : ""}`);

  const args = ["-y", "-i", `out/${id}.mp4`];
  let filter, amap;
  if (hasVoice) {
    args.push("-i", voice, "-i", "public/bed.mp3");
    filter =
      "[0:v]hqdn3d=3:2:4:4,unsharp=5:5:0.9:5:5:0.3,eq=contrast=1.05:saturation=1.08[v];" +
      "[1:a]volume=2.2[vo];[2:a]volume=0.10[bd];[vo][bd]amix=inputs=2:duration=first[mx];" +
      "[mx]loudnorm=I=-14:TP=-1.5:LRA=11[a]";
    amap = "[a]";
  } else {
    filter =
      "[0:v]hqdn3d=3:2:4:4,unsharp=5:5:0.9:5:5:0.3,eq=contrast=1.05:saturation=1.08[v];" +
      "[0:a]loudnorm=I=-14:TP=-1.5:LRA=11[a]";
    amap = "[a]";
  }
  args.push(
    "-filter_complex", filter, "-map", "[v]", "-map", amap,
    "-c:v", "libx264", "-profile:v", "high", "-level:v", "4.2", "-pix_fmt", "yuv420p",
    "-crf", "21", "-preset", "medium", "-maxrate", "6M", "-bufsize", "12M",
    "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k", `out/final/${id}.mp4`
  );
  execFileSync(FFMPEG, args, { stdio: "ignore" });
  console.log(`   ✅ out/final/${id}.mp4`);
}
console.log("\n✅ Masters en out/final/");
