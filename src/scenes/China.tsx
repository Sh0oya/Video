import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { findSub, localLines, prog } from "../lib/timeline";
import { Chip, Counter, Label, Reveal, useExit } from "../components/Ui";
import { MAP } from "../components/DotMap";

const GX = 1100;
const GY = 205;
const CELL = 54;
const GAP = 10;

export const China: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("china");
  const exit = useExit(duration);
  const draw = prog(f, 4, 50, ease.inOut);
  const fillIn = prog(f, 40, 30, ease.out);
  // Calage sur les mots : le nombre (350 000 / 354 000), la hausse (20 %), la part (59 %).
  const last = L[L.length - 1];
  const numAt = findSub("china", /35\d/) ?? L[Math.min(1, L.length - 1)].from;
  const upAt = findSub("china", /20\s?%/) ?? numAt + 40;
  const pctLine = L.find((l) => l.subs.some((s) => /59/.test(s.text))) ?? last;
  const pctAt = pctLine.subs.find((s) => /59/.test(s.text))?.from ?? pctLine.from;
  const sayAt = findSub("china", /trois|3 nouveaux|3 robots/i) ?? pctAt + 60;
  const toWaffle = prog(f, pctAt - 16, 16, ease.inOut);
  const fillStart = pctAt - 3;
  const land = pctAt + 22;
  const pop = interpolate(f, [land, land + 4, land + 18], [1, 1.1, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const numDim = interpolate(toWaffle, [0, 1], [1, 0.4]);
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 165 }}>
        <Reveal at={0} dur={16}>
          <Label size={24} color={C.orange} style={{ letterSpacing: "0.2em" }}>
            Premier marché mondial
          </Label>
        </Reveal>
        <Reveal at={4}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 190, lineHeight: 1, color: C.ink, letterSpacing: "-0.02em" }}>CHINE</div>
        </Reveal>
        <div style={{ height: 36 }} />
        <div style={{ opacity: prog(f, numAt - 4, 12) * numDim, transform: `translateY(${-20 * toWaffle}px)` }}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "120%", fontSize: 112, lineHeight: 1, color: C.ink }}>
            <span style={{ color: C.muted, fontWeight: 500 }}>≈ </span>
            <Counter to={354_000} at={numAt} dur={34} step={1000} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 12 }}>
            <div style={{ fontFamily: F.body, fontSize: 34, fontWeight: 500, color: C.ink }}>robots installés en 2025</div>
            <Chip at={upAt + 4} text="▲ +20 % sur un an" size={30} />
          </div>
        </div>
        <div style={{ height: 36 }} />
        <div style={{ opacity: prog(f, land - 4, 8), transform: `scale(${pop})`, transformOrigin: "left center" }}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 150, lineHeight: 1, color: C.orange }}>59 %</div>
          <div style={{ fontFamily: F.body, fontSize: 32, fontWeight: 500, color: C.ink, marginTop: 8 }}>des installations mondiales</div>
        </div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <g transform="translate(1070 200) scale(0.92)" opacity={1 - toWaffle}>
          <path d={MAP.chinaPath} fill={C.orange} fillOpacity={0.14 * fillIn} stroke={C.orange} strokeWidth={3} strokeDasharray="6000" strokeDashoffset={6000 * (1 - draw)} strokeLinejoin="round" />
        </g>
        <g opacity={toWaffle}>
          {Array.from({ length: 100 }, (_, i) => {
            const cx = i % 10;
            const cy = Math.floor(i / 10);
            const order = cy * 10 + cx;
            const on = order < 59 && f >= fillStart + order * (24 / 59);
            const p = on ? prog(f, fillStart + order * (24 / 59), 6) : 0;
            return (
              <rect
                key={i}
                x={GX + cx * (CELL + GAP)}
                y={GY + cy * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={8}
                fill={on ? C.orange : C.steel}
                opacity={on ? 0.55 + 0.45 * p : 0.7}
                transform={`translate(${CELL / 2 * (1 - (0.8 + 0.2 * (on ? p : 1)))} 0)`}
              />
            );
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: GX, top: GY + 10 * (CELL + GAP) + 14, width: 10 * (CELL + GAP) - GAP, textAlign: "center", opacity: prog(f, Math.max(sayAt, land), 14) }}>
        <Label size={22} color={C.ink}>
          <span style={{ color: C.orange }}>■</span> près de trois nouveaux robots sur cinq
        </Label>
      </div>
    </AbsoluteFill>
  );
};
