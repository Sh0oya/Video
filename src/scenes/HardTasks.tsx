import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { findSub, localLines, prog } from "../lib/timeline";
import { FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { Gear, Repeat, Robot, Tablet, Warning, Weight, Worker, Shield } from "../components/Icons";

const CARDS = [
  { key: "rep", title: "Répétitives", Icon: Repeat },
  { key: "hard", title: "Pénibles", Icon: Weight },
  { key: "danger", title: "Dangereuses", Icon: Warning },
];
const CW = 500;
const GAP = 70;
const X0 = (1920 - (3 * CW + 2 * GAP)) / 2;

export const HardTasks: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("hardtasks");
  const exit = useExit(duration);
  const at = (i: number) => L[0].subs[i]?.from ?? L[0].from + i * 30;
  const roles = L[1].from;
  const roleSubs = L[1].subs;
  const shift = prog(f, roles - 4, 18, ease.inOut);
  const accAt = findSub("hardtasks", /accident/i);
  const exAt = findSub("hardtasks", /contrôle|programmation|maintenance/i) ?? (roleSubs[1]?.from ?? roles + 20);
  const trainAt = findSub("hardtasks", /form(er|ation)/i);
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Moins de tâches ingrates</div>
        </Reveal>
        <FadeUp at={6}>
          <Label size={22} style={{ marginTop: 10 }}>
            ce que les robots peuvent prendre en charge
          </Label>
        </FadeUp>
      </div>

      {CARDS.map((c, i) => {
        const t = at(i);
        const p = prog(f, t - 4, 16, ease.out);
        const swap = prog(f, t + 16, 14, ease.inOut);
        const x = X0 + i * (CW + GAP);
        const lift = interpolate(shift, [0, 1], [0, -40]);
        return (
          <div
            key={c.key}
            style={{
              position: "absolute",
              left: x,
              top: 300 + lift,
              width: CW,
              height: accAt !== undefined ? 470 : 360,
              borderRadius: 22,
              background: C.panel,
              border: `2px solid ${swap > 0.5 ? C.orange : C.line}`,
              opacity: p,
              transform: `translateY(${(1 - p) * 40}px)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingTop: 36,
              boxShadow: swap > 0.5 ? `0 0 40px ${C.orange}22` : "none",
            }}
          >
            <c.Icon size={92} color={swap > 0.5 ? C.orange : C.ink} stroke={6} />
            <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 50, color: C.ink, marginTop: 22 }}>{c.title}</div>
            <div style={{ position: "relative", width: 240, height: 80, marginTop: 20 }}>
              <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", gap: 14, opacity: 1 - swap, transform: `translateX(${-30 * swap}px)` }}>
                <Worker size={70} color={C.muted} stroke={6} />
                <Label size={22} color={C.muted}>humain</Label>
              </div>
              <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", gap: 14, opacity: swap, transform: `translateX(${30 * (1 - swap)}px)` }}>
                <Robot size={70} color={C.orange} stroke={6} />
                <Label size={22} color={C.orange}>robot</Label>
              </div>
            </div>
            {i === 2 && accAt !== undefined && (
              <div
                style={{
                  marginTop: 6,
                  padding: "8px 16px",
                  borderRadius: 12,
                  background: `${C.orange}22`,
                  border: `2px solid ${C.orange}`,
                  textAlign: "center",
                  opacity: prog(f, accAt + 45, 14),
                  transform: `scale(${interpolate(prog(f, accAt + 45, 14), [0, 0.6, 1], [0.7, 1.06, 1])})`,
                }}
              >
                <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 26, color: C.orange }}>≈ 1,2 accident de moins</div>
                <div style={{ fontFamily: F.mono, fontSize: 18, color: C.ink, marginTop: 4 }}>pour 100 salariés par an</div>
                <div style={{ fontFamily: F.mono, fontSize: 18, color: C.muted, marginTop: 2 }}>zones plus robotisées · étude É.-U., 2022</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Nuance dite par la voix : certains emplois disparaissent, d'autres métiers peuvent naître (selon l'IFR). */}
      <div style={{ position: "absolute", left: X0, top: (accAt !== undefined ? 812 : 700) - 52, display: "flex", gap: 40, opacity: shift }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: prog(f, roleSubs[0]?.from ?? roles, 12) }}>
          <Worker size={30} color={C.red} stroke={8} />
          <Label size={22} color={C.red}>certains emplois disparaissent</Label>
        </div>
        <div style={{ opacity: prog(f, roleSubs[1]?.from ?? roles + 30, 12) }}>
          <Label size={22} color={C.cyan}>nouveaux métiers possibles · selon l’IFR</Label>
        </div>
      </div>
      {/* Les humains passent à des rôles plus qualifiés. */}
      <div style={{ position: "absolute", left: X0, top: accAt !== undefined ? 812 : 700, width: 3 * CW + 2 * GAP, display: "flex", alignItems: "center", gap: 34, opacity: shift }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Worker size={72} color={C.cyan} stroke={6} />
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 40, color: C.cyan }}>→</div>
        </div>
        {[
          { t: "Contrôle", I: Shield },
          { t: "Programmation", I: Tablet },
          { t: "Maintenance", I: Gear },
        ].map((r, k) => {
          const rp = prog(f, exAt + k * 9, 14, ease.out);
          return (
            <div
              key={r.t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 24px",
                borderRadius: 16,
                border: `2px solid ${C.cyan}`,
                background: `${C.cyan}14`,
                opacity: rp,
                transform: `translateY(${(1 - rp) * 20}px)`,
              }}
            >
              <r.I size={44} color={C.cyan} stroke={7} />
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 32, color: C.ink }}>{r.t}</div>
            </div>
          );
        })}
        {trainAt !== undefined && (
          <div
            style={{
              marginLeft: 10,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 22px",
              borderRadius: 16,
              background: C.cyan,
              opacity: prog(f, trainAt, 14),
              transform: `scale(${interpolate(prog(f, trainAt, 14), [0, 0.6, 1], [0.7, 1.06, 1])})`,
            }}
          >
            <div style={{ fontFamily: F.body, fontWeight: 700, fontSize: 28, color: C.bg }}>à condition de former</div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
