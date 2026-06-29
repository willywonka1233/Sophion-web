import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Cierre con llamada a la acción: "Comentá <KEYWORD>".
export const CtaCard: React.FC<{ keyword: string; accent: string; tail: string }> = ({
  keyword,
  accent,
  tail,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const scale = interpolate(pop, [0, 1], [0.7, 1]);
  // Pulso continuo sutil.
  const pulse = 1 + Math.sin(frame / 6) * 0.02;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        fontFamily: "'Helvetica Neue', 'HelveticaNeue', Helvetica, Arial, sans-serif",
        transform: `scale(${scale})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          fontSize: 46,
          fontWeight: 700,
          color: "#FFFFFF",
          letterSpacing: "-1px",
          textShadow: "0 6px 20px rgba(0,0,0,0.9)",
        }}
      >
        👇 COMENTÁ
      </div>
      <div
        style={{
          fontSize: 150,
          fontWeight: 800,
          color: accent,
          letterSpacing: "-4px",
          lineHeight: 0.9,
          transform: `scale(${pulse})`,
          textShadow: `0 0 40px ${accent}AA, 0 8px 28px rgba(0,0,0,0.9)`,
          WebkitTextStroke: "2px rgba(0,0,0,0.35)",
          padding: "18px 44px",
          border: `4px solid ${accent}`,
          borderRadius: 28,
          boxShadow: `0 0 50px ${accent}55, inset 0 0 30px ${accent}22`,
        }}
      >
        {keyword}
      </div>
      <div
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: "#FFFFFF",
          letterSpacing: "-1px",
          textShadow: "0 6px 20px rgba(0,0,0,0.9)",
          maxWidth: 760,
          textAlign: "center",
        }}
      >
        {tail}
      </div>
    </div>
  );
};
