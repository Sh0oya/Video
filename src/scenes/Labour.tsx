import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { localLines, prog } from "../lib/timeline";
import { FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { Robot, Worker } from "../components/Icons";

const COLS = 8;
const ROWS = 2;
const CELL = 150;
const GX = (1920 - COLS * CELL) / 2;
const GY = 330;
// Postes qui se vident puis sont repris par des robots (ordre d'apparition).
const GAPS = [3, 12, 6, 9, 1, 14];

export const Labour: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("labour");
  const exit = useExit(duration);
  const empty = L[1].subs[1]?.from ?? L[1].from + 30;
  const fill = L[2].from + 4;
  const prodDip = prog(f, empty, 30, ease.inOut);
  const prodBack = prog(f, fill + 10, 36, ease.out);
  const level = 1 - 0.38 * prodDip + 0.38 * prodBack;
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Quand les bras viennent à manquer</div>
        </Reveal>
        <FadeUp at={6}>
          <Label size={21} style={{ marginTop: 10 }}>
            vieillissement de la population active · pénurie de main-d’œuvre
          </Label>
        </FadeUp>
      </div>

      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const cx = GX + (i % COLS) * CELL + CELL / 2;
        const cy = GY + Math.floor(i / COLS) * 190 + 70;
        const g = GAPS.indexOf(i);
        const appear = prog(f, 4 + i * 1.5, 14);
        const gone = g >= 0 ? prog(f, empty + g * 7, 14, ease.inOut) : 0;
        const robot = g >= 0 ? prog(f, fill + g * 8, 12, ease.out) : 0;
        const pop = g >= 0 ? interpolate(f, [fill + g * 8, fill + g * 8 + 5, fill + g * 8 + 14], [0.6, 1.12, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
        return (
          <div key={i} style={{ position: "absolute", left: cx - 50, top: cy - 50, width: 100, height: 100, opacity: appear }}>
            <div style={{ position: "absolute", inset: 0, opacity: 1 - gone * (1 - 0.18), transform: `translateY(${gone * 10}px)` }}>
              <Worker size={100} color={gone > 0.5 ? C.dim : C.ink} stroke={5.5} />
            </div>
            {g >= 0 && gone > 0.02 && (
              <div
                style={{
                  position: "absolute",
                  inset: -10,
                  borderRadius: 16,
                  border: `3px dashed ${C.red}`,
                  opacity: gone * (1 - robot),
                }}
              />
            )}
            {g >= 0 && robot > 0 && (
              <div style={{ position: "absolute", inset: 0, opacity: robot, transform: `scale(${pop})` }}>
                <Robot size={100} color={C.orange} stroke={5} />
              </div>
            )}
          </div>
        );
      })}

      <div style={{ position: "absolute", left: GX + 25, top: 740, width: COLS * CELL - 50 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
          <Label size={22} color={C.ink}>
            production
          </Label>
          <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 26, color: level > 0.97 ? C.orange : C.muted }}>
            {level > 0.97 && f > fill ? "maintenue" : prodDip > 0.1 ? "en difficulté" : ""}
          </div>
        </div>
        <div style={{ height: 18, borderRadius: 9, background: C.steel, overflow: "hidden", opacity: prog(f, 10, 16) }}>
          <div style={{ height: "100%", width: `${level * 100}%`, borderRadius: 9, background: prodBack > 0.1 ? C.orange : level < 0.9 ? C.red : C.steelHi }} />
        </div>
      </div>

      <div style={{ position: "absolute", right: 140, top: 136, display: "flex", gap: 28, opacity: prog(f, empty + 10, 14) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, border: `3px dashed ${C.red}` }} />
          <Label size={20} color={C.ink}>poste vacant</Label>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: prog(f, fill, 12) }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: C.orange }} />
          <Label size={20} color={C.ink}>robot</Label>
        </div>
      </div>
    </AbsoluteFill>
  );
};
