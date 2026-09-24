import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease, fmt } from "../theme";
import { localLines, prog } from "../lib/timeline";
import { Chip, FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { TOP6 } from "../data/facts";

const Y0 = 322;
const ROW = 90;
const BX = 560;
const BMAX = 1040;

export const Ranking: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("ranking");
  const exit = useExit(duration);
  const max = TOP6[0].v;
  const usW = (TOP6[1].v / max) * BMAX;
  const nine = L[0].subs[1].from;
  // Mise en avant successive : Corée, Allemagne, Allemagne (UE), Inde.
  const focus = (() => {
    if (f >= L[3].from) return 6;
    if (f >= L[1].subs[1].from) return 5;
    if (f >= L[1].from) return 4;
    return 0;
  })();
  const focusP = prog(f, L[1].from, 14);
  const eu = prog(f, L[2].from + 3, 20, ease.out);
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Les six premiers marchés en 2025</div>
        </Reveal>
        <FadeUp at={6}>
          <Label size={21} style={{ marginTop: 10 }}>
            robots industriels installés en 2025, en unités
          </Label>
        </FadeUp>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {TOP6.map((d, i) => {
          const y = Y0 + i * ROW;
          const p = prog(f, 12 + i * 3.6, 30, ease.out);
          const w = Math.max(6, (d.v / max) * BMAX * p);
          const isFocus = focus === d.rank;
          const dim = focus > 0 && !isFocus && d.rank !== 1 ? 1 - 0.5 * focusP : 1;
          // Pendant la comparaison « neuf fois plus », la barre des États-Unis sert d'unité : en cyan.
          const unit = d.rank === 2 && f >= nine && f < L[1].from;
          const col = d.rank === 1 ? C.orange : unit ? C.cyan : isFocus ? C.ink : C.steelHi;
          const unitDim = f >= nine && f < L[1].from && d.rank > 2 ? 1 - 0.5 * prog(f, nine, 10) : 1;
          return (
            <g key={d.rank} opacity={dim * unitDim}>
              {isFocus && <rect x={120} y={y - 4} width={d.rank === 5 ? 1000 : 1660} height={ROW - 8} rx={12} fill="#FFFFFF" opacity={0.05} />}
              <text x={150} y={y + 50} fontFamily={F.mono} fontSize={30} fill={d.rank === 1 ? C.orange : C.muted}>
                {d.rank}
              </text>
              <text x={200} y={y + 52} fontFamily={F.body} fontWeight={600} fontSize={36} fill={C.ink}>
                {d.name}
              </text>
              <rect x={BX} y={y + 14} width={w} height={52} rx={6} fill={col} />
              <text x={BX + w + 18} y={y + 51} fontFamily={F.mono} fontWeight={600} fontSize={28} fill={d.rank === 1 ? C.orange : unit ? C.cyan : C.ink} opacity={prog(f, 24 + i * 3.6, 12)}>
                {d.rank === 1 ? "≈ 354 000" : `≈ ${fmt(Math.round(d.v / 100) * 100)}`}
              </text>
            </g>
          );
        })}
        {/* Neuf fois la barre des États-Unis dans celle de la Chine */}
        {Array.from({ length: 9 }, (_, k) => {
          const x = BX + usW * (k + 1);
          const p = prog(f, nine + k * 3, 8);
          return <line key={k} x1={x} x2={x} y1={Y0 + 8} y2={Y0 + 72} stroke={C.bg} strokeWidth={4} opacity={p} />;
        })}
        {(() => {
          const p = prog(f, nine + 30, 16);
          return (
            <g opacity={p}>
              <path d={`M ${BX} ${Y0 - 4} L ${BX} ${Y0 - 22} L ${BX + usW * 9} ${Y0 - 22} L ${BX + usW * 9} ${Y0 - 4}`} fill="none" stroke={C.ink} strokeWidth={2} />
              <text x={BX + usW * 4.5} y={Y0 - 36} textAnchor="middle" fontFamily={F.mono} fontWeight={600} fontSize={24} letterSpacing="2.5" fill={C.ink}>
                ≈ 9 FOIS LES ÉTATS-UNIS
              </text>
            </g>
          );
        })()}
      </svg>
      {/* Allemagne : 41 % des installations de l'UE */}
      <div style={{ position: "absolute", left: 1150, top: Y0 + 4 * ROW + ROW / 2 - 95, display: "flex", alignItems: "center", gap: 30, padding: "0 30px 0 0", borderRadius: 20, opacity: eu * (f < L[3].from ? 1 : 1 - prog(f, L[3].from, 10)) }}>
        <svg width={190} height={190}>
          <circle cx={95} cy={95} r={78} fill="none" stroke={C.steel} strokeWidth={26} />
          <circle
            cx={95}
            cy={95}
            r={78}
            fill="none"
            stroke={C.orange}
            strokeWidth={26}
            strokeDasharray={`${2 * Math.PI * 78}`}
            strokeDashoffset={2 * Math.PI * 78 * (1 - 0.41 * eu)}
            transform="rotate(-90 95 95)"
            strokeLinecap="butt"
          />
          <text x={95} y={108} textAnchor="middle" fontFamily={F.display} fontWeight={900} fontSize={44} fill={C.ink}>
            {Math.round(41 * eu)} %
          </text>
        </svg>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 44, color: C.ink, lineHeight: 1.05 }}>Allemagne</div>
          <div style={{ fontFamily: F.body, fontSize: 28, color: C.ink, marginTop: 8, maxWidth: 420 }}>part des installations de l’Union européenne</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: BX + (TOP6[5].v / max) * BMAX + 190, top: Y0 + 5 * ROW + 20 }}>
        <Chip at={L[3].subs[1].from} text="▲ +15 % sur un an" size={28} />
      </div>
      <div style={{ position: "absolute", left: BX + (TOP6[3].v / max) * BMAX + 190, top: Y0 + 3 * ROW + 20, opacity: focus === 4 ? focusP : 0 }}>
        <Label size={21} color={C.ink}>quatrième marché mondial</Label>
      </div>
      <div style={{ position: "absolute", left: BX + (TOP6[4].v / max) * BMAX + 190, top: Y0 + 4 * ROW + 26, opacity: focus === 5 ? prog(f, L[1].subs[1].from, 12) * (1 - eu) : 0 }}>
        <Label size={21} color={C.ink}>premier marché européen</Label>
      </div>
    </AbsoluteFill>
  );
};
