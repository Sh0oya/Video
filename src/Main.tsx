import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { Background } from "./components/Background";
import { Hud } from "./components/Hud";
import { Subtitles } from "./components/Subtitles";
import { TL } from "./lib/timeline";
import { ColdOpen } from "./scenes/ColdOpen";
import { Title } from "./scenes/Title";
import { Stock } from "./scenes/Stock";
import { Installs } from "./scenes/Installs";
import { Quote } from "./scenes/Quote";
import { China } from "./scenes/China";
import { UsaJapan } from "./scenes/UsaJapan";
import { Ranking } from "./scenes/Ranking";
import { Forecast } from "./scenes/Forecast";
import { Outro } from "./scenes/Outro";
import { Labour } from "./scenes/Labour";
import { HardTasks } from "./scenes/HardTasks";
import { Sectors } from "./scenes/Sectors";

const SCENES: Record<string, React.FC<{ duration: number }>> = {
  coldopen: ColdOpen,
  title: Title,
  stock: Stock,
  installs: Installs,
  quote: Quote,
  china: China,
  usajapan: UsaJapan,
  ranking: Ranking,
  forecast: Forecast,
  labour: Labour,
  hardtasks: HardTasks,
  sectors: Sectors,
  outro: Outro,
};

// Léger travelling avant continu sur chaque scène, pour garder l'image vivante.
const Drift: React.FC<{ duration: number; children: React.ReactNode }> = ({ duration, children }) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, duration], [1, 1.025]);
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>;
};

export const Main: React.FC<{ subtitles?: boolean }> = ({ subtitles = true }) => (
  <AbsoluteFill>
    <Background />
    {TL.scenes.map((s) => {
      const Comp = SCENES[s.id];
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id}>
          <Drift duration={s.duration}>
            <Comp duration={s.duration} />
          </Drift>
        </Sequence>
      );
    })}
    <Hud />
    {subtitles && <Subtitles />}
  </AbsoluteFill>
);
