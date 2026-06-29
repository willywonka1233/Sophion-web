import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
// yuv420p (rango limitado) para máxima compatibilidad con celulares/reproductores.
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
// Chromium is pre-installed in this environment (no download needed).
Config.setChromiumOpenGlRenderer("angle");
Config.setBrowserExecutable(
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"
);
