import React from "react";
import { Composition } from "remotion";
import { Main } from "./Main";
import { TL } from "./lib/timeline";
import { W, H } from "./theme";

export const Root: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={TL.durationInFrames} fps={TL.fps} width={W} height={H} defaultProps={{ subtitles: true }} />
    <Composition id="Clean" component={Main} durationInFrames={TL.durationInFrames} fps={TL.fps} width={W} height={H} defaultProps={{ subtitles: false }} />
  </>
);
