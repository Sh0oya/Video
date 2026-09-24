import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease, fmt } from "../theme";
import { findSub, localLines, prog } from "../lib/timeline";
import { Chip, FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { FORECAST, INSTALLS } from "../data/facts";

const X0 = 260;
const X1 = 1660;
const YB = 830;
const PER = 560 / 900_000;
const x = (year: number) => X0 + ((year - 2022) / 7) * (X1 - X0);
const y = (v: number) => YB - v * PER;

// Tracé progressif d'une polyligne (0 -> 1).
const partial = (pts: [number, number][], p: number) => {
  const segs = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = total * p;
  const out: [number, number][] = [pts[0]];
  for (let i = 0; i < segs.length; i++) {
    if (left <= 0) break;
    const t = Math.min(1, left / segs[i]);
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]);
    left -= segs[i];
  }
  return out.map((q) => q.join(",")).join(" ");
};

export const Forecast: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("forecast");
  const exit = useExit(duration);
  const actual = INSTALLS.map((d) => [x(d.year), y(d.v)] as [number, number]);
  const p26 = [x(2026), y(FORECAST[0].v)] as [number, number];
  const p29 = [x(2029), y(FORECAST[1].v)] as [number, number];
  const a = prog(f, L[0].from, 34, ease.inOut);
  const b = prog(f, L[1].from + 4, 16, ease.inOut);
  const cAt = L[2].from + 2;
  const c = prog(f, cAt, 25, ease.in);
  const land = cAt + 25;
  const glow = interpolate(f, [land, land + 3, land + 40], [0, 1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const zone = prog(f, L[1].from, 20);
  const n655 = findSub("forecast", /655/) ?? L[1].from + 18;
  // « un bond d'environ un tiers » : niveau 2025 prolongé et accolade jusqu'à 2029.
  const third = prog(f, findSub("forecast", /tiers/) ?? L[2].to, 16, ease.out);
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Installations : les prévisions</div>
        </Reveal>
        <FadeUp at={6}>
          <Label size={22} style={{ marginTop: 10 }}>
            robots installés par an · données 2022–2025 · prévisions IFR
          </Label>
        </FadeUp>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="#FFFFFF" strokeWidth="2" opacity="0.1" />
          </pattern>
          <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={C.orange} stopOpacity="0.28" />
            <stop offset="1" stopColor={C.orange} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={(x(2025) + x(2026)) / 2} y={250} width={X1 + 60 - (x(2025) + x(2026)) / 2} height={YB - 250} fill="url(#hatch)" opacity={zone} />
        <text x={(x(2025) + x(2026)) / 2 + 20} y={YB - 18} fontFamily={F.mono} fontSize={22} fill={C.orange} opacity={zone} letterSpacing="2">
          PRÉVISIONS
        </text>
        {[200_000, 400_000, 600_000, 800_000].map((v) => (
          <g key={v} opacity={prog(f, 6, 16)}>
            <line x1={X0 - 40} x2={X1 + 60} y1={y(v)} y2={y(v)} stroke={C.line} strokeWidth={1.5} strokeDasharray="4 8" />
            <text x={X0 - 60} y={y(v) + 8} textAnchor="end" fontFamily={F.mono} fontSize={22} fill={C.textDim}>
              {fmt(v)}
            </text>
          </g>
        ))}
        <line x1={X0 - 40} x2={X1 + 60} y1={YB} y2={YB} stroke={C.steelHi} strokeWidth={2} />
        {[2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029].map((yr) => (
          <text key={yr} x={x(yr)} y={YB + 42} textAnchor="middle" fontFamily={F.mono} fontSize={24} fill={yr >= 2026 ? C.muted : C.ink} opacity={prog(f, 4, 14)}>
            {yr}
          </text>
        ))}
        <polygon points={`${actual[0][0]},${YB} ${partial(actual, a)} ${actual[0][0] + (actual[3][0] - actual[0][0]) * a},${YB}`} fill="url(#area)" opacity={0.9} />
        <polyline points={partial(actual, a)} fill="none" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
        {actual.map((pt, i) => (
          <circle key={i} cx={pt[0]} cy={pt[1]} r={i === 3 ? 11 : 9} fill={C.bg} stroke={C.ink} strokeWidth={4} opacity={a * 3 >= i - 1e-6 && a > 0 ? 1 : 0} />
        ))}
        <polyline points={partial([actual[3], p26], b)} fill="none" stroke={C.orange} strokeWidth={5} strokeDasharray="14 12" strokeLinecap="round" />
        <polyline points={partial([p26, p29], c)} fill="none" stroke={C.orange} strokeWidth={5} strokeDasharray="14 12" strokeLinecap="round" />
        <circle cx={p26[0]} cy={p26[1]} r={11} fill={C.orange} opacity={b > 0.98 ? 1 : 0} />
        <circle cx={p29[0]} cy={p29[1]} r={14 + 40 * glow} fill={C.orange} opacity={0.25 * glow} />
        <circle cx={p29[0]} cy={p29[1]} r={13} fill={C.orange} opacity={c > 0.98 ? 1 : 0} />
        <g opacity={third}>
          <line x1={actual[3][0]} x2={p29[0] + 30} y1={actual[3][1]} y2={actual[3][1]} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" />
          <path d={`M ${p29[0] + 22} ${actual[3][1]} L ${p29[0] + 38} ${actual[3][1]} M ${p29[0] + 30} ${actual[3][1]} L ${p29[0] + 30} ${p29[1]} M ${p29[0] + 22} ${p29[1]} L ${p29[0] + 38} ${p29[1]}`} stroke={C.orange} strokeWidth={4} fill="none" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: actual[3][0] - 110, top: actual[3][1] + 26, opacity: prog(f, L[0].from + 30, 12) }}>
        <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 28, color: C.ink }}>plus de 600 000</div>
        <Label size={22}>2025</Label>
      </div>
      <div style={{ position: "absolute", left: p26[0] - 70, top: p26[1] - 100, opacity: prog(f, n655, 12) }}>
        <div style={{ fontFamily: F.mono, fontWeight: 600, fontSize: 30, color: C.ink, lineHeight: 1 }}>655 000</div>
        <Label size={22} style={{ marginTop: 6 }}>
          prévus en 2026
        </Label>
      </div>
      <div style={{ position: "absolute", left: p26[0] + 10, top: actual[3][1] + 14 }}>
        <Chip at={L[1].to - 30} text="▲ +9 % en 2026" size={24} />
      </div>
      {/* Sous le niveau 2025 prolongé, calé à droite sur l'accolade : reste dans le cadre. */}
      <div style={{ position: "absolute", right: 1920 - (p29[0] + 38), top: actual[3][1] + 16, opacity: third, transform: `translateY(${(1 - third) * -10}px)` }}>
        <Chip at={findSub("forecast", /tiers/) ?? L[2].to} text="▲ ≈ +⅓ en 4 ans" size={26} />
      </div>
      <div
        style={{
          position: "absolute",
          right: 1920 - p29[0] - 20,
          top: p29[1] - 132,
          textAlign: "right",
          whiteSpace: "nowrap",
          opacity: prog(f, land - 2, 8),
          transform: `scale(${interpolate(f, [land, land + 4, land + 16], [0.9, 1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
          transformOrigin: "right bottom",
        }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 900, fontStretch: "120%", fontSize: 80, color: C.orange, lineHeight: 1, textShadow: `0 0 ${40 * glow}px rgba(255,106,19,0.6)` }}>806 000</div>
        <Label size={23} color={C.ink} style={{ marginTop: 8 }}>
          prévus en 2029
        </Label>
      </div>
    </AbsoluteFill>
  );
};
