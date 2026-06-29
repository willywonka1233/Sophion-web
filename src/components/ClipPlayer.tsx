import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Reproduce un clip a pantalla completa (cover), con Ken Burns y fade de entrada.
export const ClipPlayer: React.FC<{
  src: string;
  startFrom: number; // frames dentro del clip fuente
  durationInFrames: number;
  index: number;
}> = ({ src, startFrom, durationInFrames, index }) => {
  const frame = useCurrentFrame();

  // Alterna dirección del zoom para que no se sienta repetitivo.
  const zoomIn = index % 2 === 0;
  const from = zoomIn ? 1.08 : 1.22;
  const to = zoomIn ? 1.22 : 1.08;
  const scale = interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateRight: "clamp",
  });

  // Fade + leve empuje al entrar en cada corte (dinamismo).
  const enter = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const pushY = interpolate(frame, [0, 8], [40, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: enter,
          transform: `translateY(${pushY}px) scale(${scale})`,
        }}
      >
        <OffthreadVideo
          src={staticFile(`clips/${src}`)}
          startFrom={startFrom}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
