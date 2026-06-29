import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { VideoScript } from "./data/scripts";
import { framesPerSegment } from "./data/timing";
import { ClipPlayer } from "./components/ClipPlayer";
import { Subtitle } from "./components/Subtitle";
import { CtaCard } from "./components/CtaCard";
import { BottomScrim, Grain, ProgressBar, Vignette } from "./components/Overlays";

const FPS = 30;

// Pista de audio de fondo (bed) ~75s. Reemplazable por tu propia música.
const BED_SRC = "bed.mp3";

export const VideoTemplate: React.FC<{
  script: VideoScript;
  hasVoice: boolean;
}> = ({ script, hasVoice }) => {
  let cursor = 0;
  const lastIndex = script.segments.length - 1;
  const durations = framesPerSegment(script, hasVoice);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Audio de fondo (se reemplaza por music.mp3 / voz de ElevenLabs luego) */}
      <Audio src={staticFile(BED_SRC)} volume={hasVoice ? 0.1 : 0.22} />

      {/* Voz en off (ElevenLabs con eco). Se activa al renderizar con voz. */}
      {hasVoice && (
        <Audio src={staticFile(`voice/${script.id}.mp3`)} volume={1} />
      )}

      {script.segments.map((seg, i) => {
        const dur = durations[i];
        const from = cursor;
        cursor += dur;
        const isCta = i === lastIndex;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <ClipPlayer
              src={seg.clip}
              startFrom={Math.round(seg.start * FPS)}
              durationInFrames={dur}
              index={i}
            />
            <Vignette />
            <BottomScrim />
            {isCta ? (
              <CtaCard
                keyword={script.keyword}
                accent={script.accent}
                tail="y te envío el acceso 📩"
              />
            ) : (
              <Subtitle text={seg.text} accent={script.accent} durationInFrames={dur} />
            )}
          </Sequence>
        );
      })}

      {/* Overlays globales encima de todo */}
      <Grain />
      <ProgressBar accent={script.accent} />
    </AbsoluteFill>
  );
};
