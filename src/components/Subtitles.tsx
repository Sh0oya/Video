import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F } from "../theme";
import { TL } from "../lib/timeline";

const ALL = TL.scenes.flatMap((s) => s.lines.flatMap((l) => l.subs));

// Sous-titres incrustés : un bloc à la fois, calé sur la voix.
export const Subtitles: React.FC = () => {
  const f = useCurrentFrame();
  const i = ALL.findIndex((s, k) => f >= s.from && f < (ALL[k + 1] && ALL[k + 1].from - s.to < 8 ? ALL[k + 1].from : s.to + 6));
  if (i < 0) return null;
  const s = ALL[i];
  const inP = interpolate(f, [s.from, s.from + 5], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70, pointerEvents: "none" }}>
      <div
        style={{
          maxWidth: 1500,
          textAlign: "center",
          fontFamily: F.body,
          fontWeight: 600,
          fontSize: 40,
          lineHeight: 1.3,
          color: C.ink,
          padding: "10px 26px 12px",
          borderRadius: 12,
          background: "rgba(5,7,10,0.62)",
          backdropFilter: "blur(6px)",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          opacity: inP,
          transform: `translateY(${(1 - inP) * 6}px)`,
        }}
      >
        {s.text}
      </div>
    </AbsoluteFill>
  );
};
