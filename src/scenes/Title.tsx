import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { localLines, paramsOf, prog } from "../lib/timeline";
import { Bar, FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { RobotArm, ik, poseAt } from "../components/RobotArm";

const big: React.CSSProperties = {
  fontFamily: F.display,
  fontWeight: 900,
  fontStretch: "125%",
  fontSize: 128,
  lineHeight: 0.98,
  letterSpacing: "-0.025em",
  color: C.ink,
  whiteSpace: "nowrap",
};

export const Title: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const exit = useExit(duration);
  const L = localLines("title");
  const P = paramsOf("title", { kicker: "Rapport World Robotics 2026", line1: "5 MILLIONS", line2: "DE ROBOTS", sub: "travaillent désormais dans les usines du monde" });
  const ifrAt = L[0].subs[1]?.from ?? 30;
  const reportAt = L[0].subs[2]?.from ?? 60;
  // Taille du titre adaptée à la ligne la plus longue, pour ne jamais empiéter sur le bras.
  const titleSize = Math.min(128, Math.floor(1080 / (0.8 * Math.max(P.line1.length, P.line2.length))));
  const pulse = interpolate(f, [reportAt, reportAt + 5, reportAt + 20], [1, 1.07, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rise = prog(f, 0, 40, ease.out);
  const BX = 1330;
  const BY = 855;
  const SC = 0.92;
  const PICK = [1545, BY - 26] as const;
  const DROP = [1790, BY - 26] as const;
  const pose = poseAt(f, [
    { f: 0, s: -8, e: 150, w: 30, g: 1 },
    { f: 42, ...ik(PICK[0], PICK[1] - 90, BX, BY, SC, 1) },
    { f: 64, ...ik(PICK[0], PICK[1], BX, BY, SC, 1) },
    { f: 80, ...ik(PICK[0], PICK[1], BX, BY, SC, 0.12) },
    { f: 104, ...ik(PICK[0] + 20, PICK[1] - 210, BX, BY, SC, 0.12) },
    { f: 160, ...ik(DROP[0] - 40, DROP[1] - 170, BX, BY, SC, 0.12) },
    { f: 190, ...ik(DROP[0], DROP[1], BX, BY, SC, 0.12) },
    { f: 205, ...ik(DROP[0], DROP[1], BX, BY, SC, 1) },
    { f: 240, ...ik(DROP[0] - 150, DROP[1] - 230, BX, BY, SC, 1) },
  ]);
  const holding = f > 80 && f < 205;
  return (
    <AbsoluteFill style={exit}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <line x1={1180} x2={1880} y1={BY} y2={BY} stroke={C.line} strokeWidth={2} />
        <g transform={`translate(0 ${(1 - rise) * 500})`}>
          <RobotArm
            id="title-arm"
            x={BX}
            y={BY}
            scale={SC}
            pose={pose}
            glow={0.6}
            payload={holding ? <rect x={-26} y={-26} width={52} height={52} rx={6} fill={C.cyan} opacity={0.95} /> : undefined}
          />
        </g>
        {!holding && f <= 80 && <rect x={PICK[0] - 26} y={PICK[1] - 26} width={52} height={52} rx={6} fill={C.cyan} opacity={0.95} />}
        {f >= 205 && <rect x={DROP[0] - 26} y={DROP[1] - 26} width={52} height={52} rx={6} fill={C.cyan} opacity={0.95} />}
      </svg>
      <div style={{ position: "absolute", left: 140, top: 250 }}>
        <Reveal at={2} dur={18}>
          <Label size={24} color={f >= reportAt ? C.orangeHi : C.orange} style={{ letterSpacing: "0.2em", transform: `scale(${pulse})`, transformOrigin: "left center" }}>
            {P.kicker}
          </Label>
        </Reveal>
        <div style={{ height: 26 }} />
        <Reveal at={6}>
          <div style={{ ...big, fontSize: titleSize, color: C.orange }}>{P.line1}</div>
        </Reveal>
        <Reveal at={11}>
          <div style={{ ...big, fontSize: titleSize }}>{P.line2}</div>
        </Reveal>
        <div style={{ height: 26 }} />
        <Reveal at={17} dur={20}>
          <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 44, color: C.ink, opacity: 0.92 }}>
            {P.sub}
          </div>
        </Reveal>
        <div style={{ height: 40 }} />
        <Bar at={ifrAt - 6} width={180} />
        <div style={{ height: 28 }} />
        <FadeUp at={ifrAt}>
          <Label size={28} color={C.ink}>
            International Federation of Robotics (IFR)
          </Label>
        </FadeUp>
        <div style={{ height: 10 }} />
        <FadeUp at={ifrAt + 8}>
          <Label size={22} color={C.textDim}>
            Communiqué du 24 septembre 2026
          </Label>
        </FadeUp>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          background: `linear-gradient(90deg, rgba(7,9,13,${interpolate(f, [0, 30], [0.6, 0], { extrapolateRight: "clamp" })}) 0%, transparent 60%)`,
        }}
      />
    </AbsoluteFill>
  );
};
