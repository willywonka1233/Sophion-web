import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Token = { text: string; emphasis: boolean };

// Parte el texto en palabras y marca las que vienen entre *asteriscos*.
const tokenize = (raw: string): Token[] => {
  const parts = raw.split(/(\*[^*]+\*)/g).filter(Boolean);
  const tokens: Token[] = [];
  for (const part of parts) {
    const emphasis = part.startsWith("*") && part.endsWith("*");
    const clean = emphasis ? part.slice(1, -1) : part;
    for (const w of clean.split(/\s+/).filter(Boolean)) {
      tokens.push({ text: w, emphasis });
    }
  }
  return tokens;
};

export const Subtitle: React.FC<{
  text: string;
  accent: string;
  durationInFrames: number;
}> = ({ text, accent, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tokens = tokenize(text);

  // Reparte la aparición de palabras en el primer ~55% del segmento.
  const revealWindow = Math.max(durationInFrames * 0.55, 1);
  const perWord = revealWindow / Math.max(tokens.length, 1);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 360,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        gap: "14px 18px",
        padding: "0 90px",
        textAlign: "center",
      }}
    >
      {tokens.map((tok, i) => {
        const appear = i * perWord;
        const enter = spring({
          frame: frame - appear,
          fps,
          config: { damping: 200, stiffness: 220, mass: 0.6 },
          durationInFrames: 12,
        });
        const y = interpolate(enter, [0, 1], [26, 0]);
        const opacity = interpolate(enter, [0, 1], [0, 1]);
        const scale = interpolate(enter, [0, 1], [0.86, 1]);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `translateY(${y}px) scale(${scale})`,
              opacity,
              fontFamily:
                "'Helvetica Neue', 'HelveticaNeue', Helvetica, Arial, sans-serif",
              fontWeight: 700,
              fontSize: 78,
              lineHeight: 1.02,
              letterSpacing: "-1.5px",
              textTransform: "uppercase",
              color: tok.emphasis ? accent : "#FFFFFF",
              textShadow: tok.emphasis
                ? `0 0 24px ${accent}99, 0 6px 18px rgba(0,0,0,0.9)`
                : "0 6px 20px rgba(0,0,0,0.92), 0 2px 6px rgba(0,0,0,0.95)",
              WebkitTextStroke: "1.5px rgba(0,0,0,0.45)",
            }}
          >
            {tok.text}
          </span>
        );
      })}
    </div>
  );
};
