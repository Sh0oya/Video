import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease, fmt } from "../theme";
import { localLines, prog } from "../lib/timeline";
import { Chip, Counter, FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { INSTALLS } from "../data/facts";

const BASE = 800;
const PER = 460 / 600_000;

export const Installs: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("installs");
  const exit = useExit(duration);
  const bars = INSTALLS.slice(1);
  const numAt = L[1].subs[1].from;
  const grow25 = prog(f, numAt, 40, ease.out);
  const day = prog(f, L[2].from + 3, 14, ease.out);
  const thump = interpolate(f, [L[2].from + 3, L[2].from + 7, L[2].from + 18], [0.92, 1.04, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Installations annuelles</div>
        </Reveal>
        <div style={{ height: 10 }} />
        <FadeUp at={6}>
          <Label size={21}>nouveaux robots industriels installés dans le monde</Label>
        </FadeUp>
      </div>

      <div style={{ position: "absolute", left: 140, top: 330 }}>
        <div style={{ opacity: prog(f, L[1].from, 12) }}>
          <Label size={24} color={C.orange} style={{ letterSpacing: "0.2em" }}>
            En 2025 · plus de
          </Label>
        </div>
        <div style={{ opacity: prog(f, numAt - 2, 8), fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 170, color: C.ink, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          <Counter to={600_000} at={numAt} dur={40} step={1000} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 6, opacity: prog(f, numAt + 10, 12) }}>
          <div style={{ fontFamily: F.body, fontSize: 36, fontWeight: 500, color: C.ink }}>robots installés</div>
          <Chip at={L[1].subs[2]?.from ?? L[1].from + 60} text="▲ +11 % sur un an" size={30} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 640,
          display: "flex",
          alignItems: "center",
          gap: 30,
          padding: "22px 34px",
          borderRadius: 18,
          background: C.panel,
          border: `1px solid ${C.line}`,
          opacity: day,
          transform: `translateY(${(1 - day) * 30}px) scale(${thump})`,
          transformOrigin: "left center",
        }}
      >
        <div>
          <Label size={20} color={C.orange} style={{ marginBottom: 4 }}>
            plus de
          </Label>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 84, color: C.orange, lineHeight: 1 }}>
            <Counter to={1600} at={L[2].from + 3} dur={24} step={10} />
          </div>
        </div>
        <div>
          <div style={{ fontFamily: F.body, fontSize: 32, fontWeight: 600, color: C.ink, lineHeight: 1.2 }}>
            robots mis en service
            <br />
            chaque jour, en moyenne
          </div>
          <Label size={22} style={{ marginTop: 8 }}>
            soit plus d’un par minute
          </Label>
        </div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", opacity: prog(f, 0, 14) }}>
        <line x1={1180} x2={1780} y1={BASE} y2={BASE} stroke={C.steelHi} strokeWidth={2} />
        {bars.map((d, i) => {
          const last = d.year === 2025;
          const p = last ? grow25 : prog(f, 8 + i * 5, 22);
          const h = d.v * PER * p;
          const x = 1220 + i * 190;
          return (
            <g key={d.year}>
              <rect x={x} y={BASE - h} width={140} height={h} rx={5} fill={last ? C.orange : C.steelHi} opacity={last ? 1 : 0.9} />
              <text x={x + 70} y={BASE - h - 18} textAnchor="middle" fontFamily={F.mono} fontSize={last ? 30 : 24} fontWeight={last ? 600 : 400} fill={last ? C.orange : C.muted} opacity={p > 0.2 ? 1 : 0}>
                {last ? (p > 0.99 ? "plus de 600 000" : fmt(Math.round((d.v * p) / 1000) * 1000)) : fmt(d.v)}
              </text>
              <text x={x + 70} y={BASE + 42} textAnchor="middle" fontFamily={F.mono} fontSize={24} fill={last ? C.ink : C.textDim}>
                {d.year}
              </text>
            </g>
          );
        })}
        <g opacity={prog(f, L[0].from + 20, 14) * (1 - grow25)}>
          <path d={`M 1220 ${BASE - 452} L 1220 ${BASE - 462} L 1550 ${BASE - 462} L 1550 ${BASE - 452}`} fill="none" stroke={C.muted} strokeWidth={2} />
          <text x={1385} y={BASE - 478} textAnchor="middle" fontFamily={F.mono} fontSize={22} letterSpacing="2.6" fill={C.muted}>
            DEUX ANNÉES DE PLATEAU
          </text>
        </g>
        {/* Emplacement 2025 en pointillés : l'accélération annoncée, avant le chiffre. */}
        <g opacity={prog(f, L[0].from + 28, 14) * (1 - grow25)}>
          <rect x={1600} y={BASE - 460} width={140} height={460} rx={5} fill="none" stroke={C.orange} strokeWidth={3} strokeDasharray="10 9" opacity={0.55} />
          <path d={`M 1670 ${BASE - 120} L 1670 ${BASE - 330} M 1640 ${BASE - 300} L 1670 ${BASE - 332} L 1700 ${BASE - 300}`} fill="none" stroke={C.orange} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
