import { Segment, VideoScript } from "./scripts";
import voiceTiming from "../../public/voice/timing.json";

const FPS = 30;

// Frames base de un segmento (sin voz).
export const baseSegFrames = (s: Segment) => Math.round(s.sec * FPS);

// Frames por segmento. Si hay voz generada para este video (timing.json),
// se usan esas duraciones para sincronizar con la narración.
export const framesPerSegment = (
  script: VideoScript,
  hasVoice: boolean
): number[] => {
  const t = (voiceTiming as Record<string, number[]>)[script.id];
  if (hasVoice && t && t.length === script.segments.length) {
    return t;
  }
  return script.segments.map(baseSegFrames);
};

export const totalFrames = (script: VideoScript, hasVoice: boolean): number =>
  framesPerSegment(script, hasVoice).reduce((a, b) => a + b, 0);
