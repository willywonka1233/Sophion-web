import React from "react";
import { Composition } from "remotion";
import { SCRIPTS } from "./data/scripts";
import { totalFrames } from "./data/timing";
import { VideoTemplate } from "./VideoTemplate";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

// ¿Existe ya la voz generada? Se setea por env al renderizar (VOICE=1).
const HAS_VOICE = process.env.REMOTION_HAS_VOICE === "1";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {SCRIPTS.map((script) => (
        <Composition
          key={script.id}
          id={script.id}
          component={VideoTemplate}
          durationInFrames={totalFrames(script, HAS_VOICE)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ script, hasVoice: HAS_VOICE }}
        />
      ))}
    </>
  );
};
