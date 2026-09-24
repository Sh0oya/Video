import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { localLines, paramsOf, prog } from "../lib/timeline";
import { Chip, FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { STOCK } from "../data/facts";

const X0 = 300;
const X1 = 1620;
const BASE = 850;
const PER_M = 94; // pixels par million
const BW = 82;

export const Stock: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("stock");
  const exit = useExit(duration);
  const n = STOCK.length;
  const step = (X1 - X0 - BW) / (n - 1);
  const chipAt = L[0].to - 22;
  const hl = prog(f, L[1].from, 20, ease.out);
  // Comparaison affichée : K copies de la barre de l'année de base s'empilent dans la barre 2025.
  const { base, times, caption } = paramsOf("stock", { base: 2018, times: 2, caption: "depuis 2018" });
  const i18 = STOCK.findIndex((d) => d.year === base);
  const x18 = X0 + i18 * step;
  const x25 = X0 + (n - 1) * step;
  const h18 = STOCK[i18].v * PER_M;
  const h25 = STOCK[n - 1].v * PER_M;
  const gs = Array.from({ length: times }, (_, k) => prog(f, L[1].from + 2 + k * 8, 22, ease.inOut));
  const ghost = (p: number, k: number) => {
    if (p <= 0) return null;
    const gx = interpolate(p, [0, 1], [x18, x25]);
    const gy = interpolate(p, [0, 1], [BASE - h18, BASE - h18 * k]);
    const lift = Math.sin(p * Math.PI) * 70;
    return <rect x={gx + 3 * p} y={gy - lift} width={BW - 6 * p} height={h18} rx={4} fill={C.cyan} fillOpacity={0.14 * (1 - p)} stroke={C.cyan} strokeWidth={3} />;
  };
  const lab = prog(f, L[1].from + 26, 16, ease.out);

  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Robots en service dans le monde</div>
        </Reveal>
        <div style={{ height: 10 }} />
        <FadeUp at={6}>
          <Label size={22}>parc opérationnel mondial · en millions d’unités · valeurs publiées chaque année par l’IFR</Label>
        </FadeUp>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {[1, 2, 3, 4, 5].map((m) => (
          <g key={m} opacity={prog(f, 4 + m * 2, 16)}>
            <line x1={X0 - 30} x2={X1 + 20} y1={BASE - m * PER_M} y2={BASE - m * PER_M} stroke={C.line} strokeWidth={1.5} strokeDasharray="4 8" />
            <text x={X0 - 50} y={BASE - m * PER_M + 8} fill={C.textDim} fontFamily={F.mono} fontSize={22} textAnchor="end">
              {m} M
            </text>
          </g>
        ))}
        <line x1={X0 - 30} x2={X1 + 20} y1={BASE} y2={BASE} stroke={C.steelHi} strokeWidth={2} />
        {STOCK.map((d, i) => {
          const p = prog(f, 13 + i * 2.7, 20, ease.out);
          const h = d.v * PER_M * p;
          const x = X0 + i * step;
          const last = i === n - 1;
          const is18 = i === i18;
          const on18 = is18 && hl > 0.5;
          const dimOthers = !last && !is18 ? 1 - 0.5 * hl : 1;
          return (
            <g key={d.year} opacity={dimOthers}>
              <rect x={x} y={BASE - h} width={BW} height={h} rx={4} fill={last ? C.orange : on18 ? C.cyan : C.steelHi} opacity={last || on18 ? 1 : 0.85} />
              {last && <rect x={x} y={BASE - h} width={BW} height={6} rx={3} fill="#FFD2B0" opacity={0.7} />}
              <text
                x={x + BW / 2}
                y={BASE - h - 16}
                fill={last ? C.orange : on18 ? C.cyan : C.muted}
                fontFamily={F.mono}
                fontWeight={last || on18 ? 600 : 400}
                fontSize={last ? 30 : on18 ? 26 : 21}
                textAnchor="middle"
                opacity={prog(f, 22 + i * 2.7, 12) * (i === 0 || is18 || last ? 1 : 0)}
              >
                {d.label}
              </text>
              <text x={x + BW / 2} y={BASE + 40} fill={last || on18 ? C.ink : C.textDim} fontFamily={F.mono} fontSize={22} textAnchor="middle">
                {d.year}
              </text>
            </g>
          );
        })}
        {gs.map((g, k) => <React.Fragment key={k}>{ghost(g, k + 1)}</React.Fragment>)}
        <g opacity={lab}>
          <line x1={x25 + BW + 18} x2={x25 + BW + 18} y1={BASE} y2={BASE - times * h18} stroke={C.cyan} strokeWidth={3} />
          {Array.from({ length: times + 1 }, (_, k) => (
            <line key={k} x1={x25 + BW + 8} x2={x25 + BW + 28} y1={BASE - k * h18} y2={BASE - k * h18} stroke={C.cyan} strokeWidth={3} />
          ))}
        </g>
      </svg>
      <div
        style={{
          position: "absolute",
          left: x25 + BW + 44,
          top: BASE - (times * h18) / 2 - 70,
          opacity: lab,
          transform: `translateX(${(1 - lab) * -16}px)`,
        }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "125%", fontSize: 88, color: C.ink, lineHeight: 1 }}>×{times}</div>
        <Label size={23} color={C.cyan} style={{ marginTop: 8 }}>
          {caption}
        </Label>
      </div>
      <div style={{ position: "absolute", right: 1920 - (x25 + BW), top: BASE - h25 - 118 }}>
        <Chip at={chipAt} text="▲ +9 % sur un an" size={30} style={{ transformOrigin: "right center" }} />
      </div>
    </AbsoluteFill>
  );
};
