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
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Moins de tâches ingrates</div>
        </Reveal>
        <FadeUp at={6}>
          <Label size={21} style={{ marginTop: 10 }}>
            ce que les robots prennent en charge
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
              height: 360,
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
            <div style={{ position: "relative", width: 240, height: 110, marginTop: 20 }}>
              <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", gap: 14, opacity: 1 - swap, transform: `translateX(${-30 * swap}px)` }}>
                <Worker size={70} color={C.red} stroke={6} />
                <Label size={21} color={C.red}>humain</Label>
              </div>
              <div style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", gap: 14, opacity: swap, transform: `translateX(${30 * (1 - swap)}px)` }}>
                <Robot size={70} color={C.orange} stroke={6} />
                <Label size={21} color={C.orange}>robot</Label>
              </div>
            </div>
          </div>
        );
      })}

      {accAt !== undefined && (
        <div style={{ position: "absolute", right: 140, top: 128, textAlign: "right", opacity: prog(f, accAt, 14), transform: `translateY(${(1 - prog(f, accAt, 14)) * 12}px)` }}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "115%", fontSize: 44, color: C.orange }}>▼ accidents du travail</div>
          <Label size={19} style={{ marginTop: 4 }}>là où les robots sont plus présents · étude États-Unis, 2022</Label>
        </div>
      )}
      {/* Les humains passent à des rôles plus qualifiés. */}
      <div style={{ position: "absolute", left: X0, top: 680, width: 3 * CW + 2 * GAP, display: "flex", alignItems: "center", gap: 34, opacity: shift }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Worker size={72} color={C.cyan} stroke={6} />
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 40, color: C.cyan }}>→</div>
        </div>
        {[
          { t: "Contrôle", I: Shield },
          { t: "Programmation", I: Tablet },
          { t: "Maintenance", I: Gear },
        ].map((r, k) => {
          const rp = prog(f, (roleSubs[1]?.from ?? roles + 20) + k * 9, 14, ease.out);
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
      </div>
    </AbsoluteFill>
  );
};
