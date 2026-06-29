import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

// Degradado inferior para legibilidad del subtítulo + viñeta para foco.
export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 90% at 50% 38%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
      pointerEvents: "none",
    }}
  />
);

export const BottomScrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 22%, rgba(0,0,0,0) 48%)",
      pointerEvents: "none",
    }}
  />
);

// Grano de película sutil (mix-blend) para textura "pro".
export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = (frame % 8) + 1; // varía levemente para que "viva"
  const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${seed}'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`
  )}`;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${svg}")`,
        backgroundSize: "300px 300px",
        opacity: 0.07,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

// Barra de progreso fina arriba.
export const ProgressBar: React.FC<{ accent: string }> = ({ accent }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        height: 8,
        width: `${w}%`,
        background: accent,
        boxShadow: `0 0 16px ${accent}`,
      }}
    />
  );
};
