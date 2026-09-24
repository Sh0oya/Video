import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { findSub, localLines, prog } from "../lib/timeline";
import { Chip, Counter, FadeUp, Label, Reveal, useExit } from "../components/Ui";

const CX = 140;
const CW = 1640;
const SLOT2 = 400;
const SLOT3 = 610;
const CH = 180;

const Card: React.FC<{
  y: number;
  rank: number;
  name: string;
  highlight: number;
  right?: React.ReactNode;
  accent: string;
}> = ({ y, rank, name, highlight, right, accent }) => (
  <div
    style={{
      position: "absolute",
      left: CX,
      top: y,
      width: CW,
      height: CH,
      borderRadius: 22,
      background: C.panel,
      border: `2px solid ${interpolate(highlight, [0, 1], [0, 1]) > 0.5 ? accent : C.line}`,
      boxShadow: `0 0 ${50 * highlight}px ${accent}33`,
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
    }}
  >
    <div style={{ width: 170, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.03)", borderRight: `1px solid ${C.line}` }}>
      <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 110, color: C.ink, lineHeight: 1 }}>{rank}</div>
    </div>
    <div style={{ flex: 1, paddingLeft: 44, fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 64, color: C.ink, whiteSpace: "nowrap" }}>{name}</div>
    <div style={{ paddingRight: 40, display: "flex", alignItems: "center", gap: 26 }}>{right}</div>
  </div>
);

export const UsaJapan: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("usajapan");
  const exit = useExit(duration);
  const swapAt = L[0].subs[1].from + 5;
  const sw = prog(f, swapAt, 26, ease.inOut);
  const settle = interpolate(f, [swapAt + 26, swapAt + 30, swapAt + 38], [0, 6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const usY = interpolate(sw, [0, 1], [SLOT3, SLOT2]) + settle;
  const jpY = interpolate(sw, [0, 1], [SLOT2, SLOT3]) - settle;
  const usX = Math.sin(sw * Math.PI) * -60;
  const jpX = Math.sin(sw * Math.PI) * 60;
  const year = sw < 0.5 ? "2024" : "2025";
  const yearFlip = Math.abs(Math.cos(sw * Math.PI));
  // Calage sur les mots : 38 400 / 12 % pour les États-Unis, 19 % pour le Japon (facultatif).
  const usAt = findSub("usajapan", /38|12\s?%/) ?? L[0].to - 10;
  const upAt = findSub("usajapan", /12\s?%/) ?? usAt + 30;
  const jpAt = findSub("usajapan", /19\s?%/);
  const usHL = prog(f, usAt, 14);
  const jpHL = jpAt !== undefined ? prog(f, jpAt, 14) : 0;
  const jpVal = prog(f, jpAt ?? usAt + 24, 14);
  const usRank = sw < 0.5 ? 3 : 2;
  const jpRank = sw < 0.5 ? 2 : 3;
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Les premiers marchés mondiaux</div>
        </Reveal>
        <FadeUp at={6}>
          <Label size={21} style={{ marginTop: 10 }}>
            classement par installations annuelles
          </Label>
        </FadeUp>
      </div>
      <div style={{ position: "absolute", right: 140, top: 128, textAlign: "right" }}>
        <Label size={22}>année</Label>
        <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 72, color: sw >= 0.5 ? C.orange : C.muted, transform: `scaleY(${Math.max(0.05, yearFlip)})` }}>{year}</div>
      </div>
      <div style={{ opacity: prog(f, 4, 16) }}>
        <div style={{ position: "absolute", left: CX, top: 296, width: CW, height: 76, borderRadius: 16, border: `1px dashed ${C.line}`, display: "flex", alignItems: "center", paddingLeft: 36, gap: 26 }}>
          <div style={{ fontFamily: F.mono, fontSize: 30, color: C.muted }}>1</div>
          <div style={{ fontFamily: F.body, fontSize: 30, fontWeight: 600, color: C.muted }}>Chine</div>
          <div style={{ fontFamily: F.mono, fontSize: 22, color: C.muted }}>{sw < 0.5 ? "≈ 295 000" : "≈ 354 000"} · loin devant</div>
        </div>
      </div>
      <div style={{ opacity: prog(f, 6, 18), transform: `translateX(${jpX}px)` }}>
        <Card
          y={jpY}
          rank={jpRank}
          name="Japon"
          accent={C.red}
          highlight={jpHL}
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: jpVal }}>
              <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "115%", fontSize: 64, color: C.ink }}>
                <span style={{ color: C.muted, fontWeight: 500 }}>≈ </span>
                <Counter to={36_200} at={(jpAt ?? usAt + 24) + 2} dur={24} step={100} />
              </div>
              {jpAt !== undefined && <Chip at={jpAt + 8} text="▼ −19 %" color={C.red} size={30} />}
            </div>
          }
        />
      </div>
      <div style={{ opacity: prog(f, 10, 18), transform: `translateX(${usX}px)` }}>
        <Card
          y={usY}
          rank={usRank}
          name="États-Unis"
          accent={C.orange}
          highlight={Math.max(usHL * (1 - 0.7 * jpHL), sw > 0.99 ? 0.3 : 0)}
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 26, opacity: usHL }}>
              <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "115%", fontSize: 64, color: C.ink }}>
                <span style={{ color: C.muted, fontWeight: 500 }}>≈ </span>
                <Counter to={38_400} at={usAt + 2} dur={28} step={100} />
              </div>
              <Chip at={upAt} text="▲ +12 %" size={30} />
            </div>
          }
        />
      </div>
      <div style={{ position: "absolute", left: CX, top: SLOT3 + CH + 34, opacity: prog(f, usAt + 20, 14) }}>
        <Label size={20}>installations 2025 · variation sur un an</Label>
      </div>
    </AbsoluteFill>
  );
};
