import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { localLines, paramsOf, prog } from "../lib/timeline";
import { Counter, Label, Reveal } from "../components/Ui";
import { RobotArm, ik, poseAt } from "../components/RobotArm";

const BX = 960;
const BY = 845;
const SC = 0.78;

export const Outro: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("outro");
  const P = paramsOf("outro", {
    head1: "L’usine du futur",
    head2: "tourne déjà.",
    sub1: "Et, de plus en plus,",
    sub2: "en Chine.",
    card1: "5 MILLIONS",
    card2: "DE ROBOTS",
  });
  const statsOut = prog(f, L[1].from - 8, 14, ease.in);
  const armIn = prog(f, L[1].from - 10, 26, ease.out);
  const t0 = L[1].from + 6;
  const PICK = [1150, BY - 24] as const;
  const DROP = [1390, BY - 24] as const;
  const pose = poseAt(f, [
    { f: t0 - 20, ...ik(PICK[0] + 40, PICK[1] - 240, BX, BY, SC, 1) },
    { f: t0, ...ik(PICK[0], PICK[1], BX, BY, SC, 1) },
    { f: t0 + 8, ...ik(PICK[0], PICK[1], BX, BY, SC, 0.1) },
    { f: t0 + 30, ...ik(DROP[0] - 60, DROP[1] - 200, BX, BY, SC, 0.1) },
    { f: t0 + 38, ...ik(DROP[0], DROP[1], BX, BY, SC, 0.1) },
    { f: t0 + 44, ...ik(DROP[0], DROP[1], BX, BY, SC, 1) },
    { f: t0 + 80, ...ik(DROP[0] - 170, DROP[1] - 260, BX, BY, SC, 1) },
  ]);
  const holding = f > t0 + 8 && f < t0 + 44;
  const endAt = duration - 141;
  const card = prog(f, endAt, 24, ease.out);
  const sceneOut = interpolate(f, [endAt - 16, endAt + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const black = interpolate(f, [duration - 24, duration - 2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cube = (cx: number, cy: number, label: string) => (
    <g transform={`translate(${cx} ${cy})`}>
      <rect x={-36} y={-36} width={72} height={72} rx={8} fill={C.cyan} />
      <text x={0} y={10} textAnchor="middle" fontFamily={F.mono} fontWeight={600} fontSize={22} fill={C.bg}>
        {label}
      </text>
    </g>
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: sceneOut }}>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - statsOut, transform: `translateY(${-30 * statsOut}px)` }}>
          <div style={{ display: "flex", gap: 160, alignItems: "flex-start" }}>
            <div style={{ opacity: prog(f, 0, 14) }}>
              <Label size={22} color={C.orange} style={{ letterSpacing: "0.2em" }}>
                Fin 2025
              </Label>
              <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 130, color: C.ink, lineHeight: 1.05 }}>
                5 millions
              </div>
              <div style={{ fontFamily: F.body, fontSize: 32, color: C.ink }}>robots en service dans le monde</div>
            </div>
            <div style={{ opacity: prog(f, L[0].subs[1].from, 14) }}>
              <Label size={22} color={C.orange} style={{ letterSpacing: "0.2em" }}>
                Sur l’année 2029
              </Label>
              <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 130, color: C.orange, lineHeight: 1.05 }}>
                <Counter from={600_000} to={806_000} at={L[0].subs[1].from} dur={26} />
              </div>
              <div style={{ fontFamily: F.body, fontSize: 32, color: C.ink }}>installations prévues</div>
              <Label size={22} style={{ marginTop: 8 }}>
                prévisions IFR
              </Label>
            </div>
          </div>
        </AbsoluteFill>
        <AbsoluteFill style={{ opacity: armIn }}>
          <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.28em", fontFamily: F.display, fontWeight: 900, fontStretch: "120%", fontSize: 84 }}>
              <Reveal at={L[1].from}>
                <span style={{ color: C.ink }}>{P.head1}</span>
              </Reveal>
              <Reveal at={L[1].subs[1]?.from ?? L[1].from + 40}>
                <span style={{ color: C.orange }}>{P.head2}</span>
              </Reveal>
            </div>
            <div style={{ height: 18 }} />
            <Reveal at={L[1].subs[2]?.from ?? L[1].to}>
              <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 50, color: C.muted }}>
                {P.sub1} <span style={{ color: C.ink }}>{P.sub2}</span>
              </div>
            </Reveal>
          </div>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <line x1={420} x2={1500} y1={BY + 12} y2={BY + 12} stroke={C.line} strokeWidth={2} />
            <g transform={`translate(0 ${(1 - armIn) * 400})`}>
              <RobotArm id="outro-arm" x={BX} y={BY + 12} scale={SC} pose={pose} glow={0.6} payload={holding ? cube(0, 0, "") : undefined} />
            </g>
            {f <= t0 + 8 && cube(PICK[0], PICK[1], "")}
            {f >= t0 + 44 && cube(DROP[0], DROP[1], "")}
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: card }}>
        <div style={{ textAlign: "center", transform: `translateY(${(1 - card) * 20}px)` }}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 92, color: C.ink, lineHeight: 1 }}>
            <span style={{ color: C.orange }}>{P.card1}</span> {P.card2}
          </div>
          <div style={{ width: 140, height: 5, background: C.orange, margin: "36px auto" }} />
          <Label size={22} color={C.ink} style={{ letterSpacing: "0.12em" }}>
            Source : International Federation of Robotics (IFR)
          </Label>
          <div style={{ height: 10 }} />
          <Label size={20}>World Robotics 2026 · communiqué du 24 septembre 2026 · ifr.org</Label>
          <div style={{ height: 56 }} />
          <Label size={19} color={C.muted}>
            Vidéo entièrement générée par du code · animation Remotion · voix de synthèse Kokoro · musique synthétisée
          </Label>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </AbsoluteFill>
  );
};
