import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, F, ease, fmt } from "../theme";
import { localLines, paramsOf, prog } from "../lib/timeline";
import { Label, Reveal, useExit } from "../components/Ui";

// 5 000 points = 5 millions de robots (1 point = 1 000 robots), allumés du centre vers les bords.
const COLS = 100;
const ROWS = 50;
const GAP = 17;
const OX = (1920 - (COLS - 1) * GAP) / 2;
const OY = (1080 - (ROWS - 1) * GAP) / 2;
const DOTS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const cx = i % COLS;
  const cy = Math.floor(i / COLS);
  const x = OX + cx * GAP;
  const y = OY + cy * GAP;
  const d = Math.hypot((x - 960) / 960, (y - 540) / 540);
  return { x, y, k: d * 0.75 + random(`d${i}`) * 0.6, hot: random(`h${i}`) > 0.93 };
})
  .sort((a, b) => a.k - b.k)
  .map((d, rank) => ({ ...d, rank }));

export const ColdOpen: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("coldopen");
  const P = paramsOf("coldopen", { stamp: "RECORD", label: "robots industriels en service", sublabel: "dans les usines du monde · fin 2025" });
  const land = L[0].from;
  const count = interpolate(f, [8, land], [0, 5_000_000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.soft });
  const lit = count / 1000;
  const hit = prog(f, land, 18);
  const glow = hit * interpolate(f, [land + 18, land + 70], [1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulse = interpolate(f, [land, land + 4, land + 22], [1, 1.07, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const flash = interpolate(f, [land, land + 2, land + 16], [0, 0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push = interpolate(f, [land, duration], [1, 1.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift = prog(f, L[1].from - 6, 26, ease.inOut);
  const black = interpolate(f, [0, 14], [1, 0], { extrapolateRight: "clamp" });
  const stamp = prog(f, L[2].from, 12, ease.out);
  const exit = useExit(duration);

  return (
    <AbsoluteFill style={exit}>
      <svg width={1920} height={1080} style={{ position: "absolute", transform: `scale(${push})`, opacity: 0.9 }}>
        {DOTS.map((d, i) => {
          const on = d.rank < lit;
          const fresh = on ? Math.max(0, 1 - (lit - d.rank) / 350) : 0;
          return (
            <rect
              key={i}
              x={d.x - 2.5}
              y={d.y - 2.5}
              width={5}
              height={5}
              rx={1}
              fill={on ? (d.hot ? C.ink : C.orange) : "#1A212C"}
              opacity={on ? 0.35 + 0.35 * fresh + (d.hot ? 0.2 : 0) + hit * 0.1 : 0.55}
            />
          );
        })}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 48% 34% at 50% 50%, rgba(7,9,13,0.92) 0%, rgba(7,9,13,0.55) 60%, transparent 100%)" }} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `translateY(${-50 * lift}px)` }}>
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 900,
            fontStretch: "125%",
            fontSize: f >= land ? 196 : 232,
            letterSpacing: "-0.02em",
            color: C.ink,
            transform: `scale(${pulse})`,
            textShadow: `0 0 ${60 * glow}px rgba(255,106,19,${0.55 * glow})`,
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {f >= land ? "5 MILLIONS" : fmt(count)}
        </div>
        <div style={{ height: 30 }} />
        <Reveal at={land + 4} dur={20}>
          <Label size={30} color={C.ink} style={{ letterSpacing: "0.22em" }}>
            {P.label}
          </Label>
        </Reveal>
        <div style={{ height: 14 }} />
        <Reveal at={L[1].subs[2]?.from ?? L[1].from + 4} dur={20}>
          <Label size={22} color={C.muted}>
            {P.sublabel}
          </Label>
        </Reveal>
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          right: 150,
          top: 196,
          padding: "14px 26px",
          border: `5px solid ${C.orange}`,
          borderRadius: 10,
          color: C.orange,
          fontFamily: F.display,
          fontWeight: 900,
          fontStretch: "110%",
          fontSize: 54,
          letterSpacing: "0.06em",
          transform: `translateY(${-50 * lift}px) rotate(-8deg) scale(${interpolate(stamp, [0, 1], [1.7, 1])})`,
          opacity: stamp,
          background: "rgba(7,9,13,0.7)",
        }}
      >
        {P.stamp}
      </div>
      <div
        style={{
          position: "absolute",
          left: 72,
          top: 56,
          padding: "8px 14px",
          borderRadius: 8,
          background: "rgba(7,9,13,0.85)",
          border: `1px solid ${C.line}`,
          opacity: interpolate(f, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <Label size={22} color={C.muted}>
          <span style={{ color: C.orange }}>■</span> 1 point = 1 000 robots
        </Label>
      </div>
      <AbsoluteFill style={{ background: "#FFB27A", opacity: flash, mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </AbsoluteFill>
  );
};
