import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { localLines, prog } from "../lib/timeline";
import { Label, useExit } from "../components/Ui";
import { DotMap, MAP, NEUTRAL, REGION_COLOR } from "../components/DotMap";

const QUOTE = "L’automatisation industrielle progresse à grande vitesse.\u00a0»";
const MX = 222;
const MY = 215;
const MS = 0.9;

export const Quote: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("quote");
  const exit = useExit(duration);
  const q = L[0].subs[0];
  const words = QUOTE.split(" ");
  const bigOut = prog(f, L[1].from - 14, 16, ease.in);
  const mapIn = prog(f, L[1].from - 4, 22, ease.out);
  const s1 = L[1].subs;
  const tA = s1[0].from + 12;
  const tM = s1[1].to - 16;
  const tE = s1[2].from + 4;
  const times: Record<string, number> = { A: tA, M: tM, E: tE };
  const anchor: Record<string, [number, number]> = { A: MAP.anchors.asia, M: MAP.anchors.americas, E: MAP.anchors.europe };
  const level = (r: string, _id: number, x: number, y: number): [string, number, number] => {
    const t = times[r];
    if (t === undefined) return NEUTRAL;
    const [ax, ay] = anchor[r];
    const d = Math.hypot(x - ax, y - ay);
    const p = interpolate(f, [t + d / 22, t + d / 22 + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const max = r === "A" ? 1 : r === "M" ? 0.85 : 0.8;
    const pulse = r === "A" ? 1 + 0.18 * Math.max(0, Math.sin((f - t) / 6 - d / 30)) * p : 1;
    return [p > 0.02 ? REGION_COLOR[r] : NEUTRAL[0], 0.9 * (1 - p) + max * p, pulse];
  };
  const tag = (r: string, title: string, sub: string, color: string, dx: number, dy: number) => {
    const [ax, ay] = anchor[r];
    const p = prog(f, times[r] + 6, 16, ease.out);
    return (
      <div
        style={{
          position: "absolute",
          left: MX + ax * MS + dx,
          top: MY + ay * MS + dy,
          opacity: p,
          transform: `translateY(${(1 - p) * 14}px)`,
          padding: "8px 16px 10px",
          borderRadius: 12,
          background: "rgba(7,9,13,0.8)",
          borderLeft: `4px solid ${color}`,
        }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "120%", fontSize: 44, color, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontFamily: F.mono, fontSize: 21, letterSpacing: "0.1em", color: C.ink, textTransform: "uppercase" }}>{sub}</div>
      </div>
    );
  };
  return (
    <AbsoluteFill style={exit}>
      {/* Citation plein écran */}
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 200, paddingRight: 200, opacity: 1 - bigOut, transform: `translateY(${-40 * bigOut}px)` }}>
        <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 260, lineHeight: 0.6, color: C.orange, height: 150, opacity: prog(f, 0, 14) }}>«</div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "105%", fontSize: 88, lineHeight: 1.1, color: C.ink, letterSpacing: "-0.015em", maxWidth: 1600 }}>
          {words.map((w, i) => {
            const at = q.from + (i / words.length) * (q.to - q.from) - 4;
            const p = prog(f, at, 12, ease.out);
            return (
              <span key={i} style={{ display: "inline-block", marginRight: "0.26em", opacity: 0.12 + 0.88 * p, transform: `translateY(${(1 - p) * 18}px)` }}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ height: 50 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 22, opacity: prog(f, L[0].subs[1].from, 16), transform: `translateX(${(1 - prog(f, L[0].subs[1].from, 16)) * -20}px)` }}>
          <div style={{ width: 60, height: 4, background: C.orange }} />
          <div>
            <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 40, color: C.ink }}>Jane Heffner</div>
            <Label size={20} style={{ marginTop: 4 }}>
              présidente de l’IFR · citation traduite de l’anglais
            </Label>
          </div>
        </div>
      </AbsoluteFill>

      {/* Carte : où la croissance est la plus forte */}
      <AbsoluteFill style={{ opacity: mapIn }}>
        <div style={{ position: "absolute", left: 140, top: 130, transform: `translateY(${(1 - mapIn) * 20}px)` }}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Où la croissance est la plus forte</div>
          <Label size={21} style={{ marginTop: 10 }}>
            d’après Jane Heffner, présidente de l’IFR
          </Label>
        </div>
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <DotMap level={level} x={MX} y={MY} scale={MS} />
          {(() => {
            const [ax, ay] = MAP.anchors.asia;
            const p = prog(f, tA, 40, ease.out);
            return (
              <circle cx={MX + ax * MS} cy={MY + ay * MS} r={30 + 260 * p} fill="none" stroke={C.orange} strokeWidth={3} opacity={(1 - p) * 0.8 * (f > tA ? 1 : 0)} />
            );
          })()}
        </svg>
        {tag("A", "ASIE", "▲ croissance la plus forte", C.orange, -175, -190)}
        {tag("M", "AMÉRIQUES", "▲ en deuxième position", C.cyan, -312, 88)}
        {tag("E", "EUROPE", "▸ avance plus lentement", REGION_COLOR.E, -103, 75)}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
