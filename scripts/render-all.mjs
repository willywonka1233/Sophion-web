// Renderiza los 6 videos a out/. Usa la voz si existe (REMOTION_HAS_VOICE=1).
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";

const IDS = [
  "sistema-nervioso-a",
  "sistema-nervioso-b",
  "reset-dopamina-a",
  "reset-dopamina-b",
  "enfoque-profundo-a",
  "enfoque-profundo-b",
];

mkdirSync("out", { recursive: true });

for (const id of IDS) {
  console.log(`\n===== Render ${id} =====`);
  execFileSync("npx", ["remotion", "render", "src/index.ts", id, `out/${id}.mp4`], {
    stdio: "inherit",
    env: { ...process.env, REMOTION_SKIP_BROWSER_DOWNLOAD: "1" },
  });
}
console.log("\n✅ Listo: 6 videos en out/");
