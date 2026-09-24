import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, F, ease, fmt } from "../theme";
import { prog } from "../lib/timeline";

// Texte révélé par un masque : il glisse vers le haut depuis sous sa ligne de base.
export const Reveal: React.FC<{
  at: number;
  dur?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dy?: number;
}> = ({ at, dur = 22, children, style, dy = 110 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur);
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.08em", marginBottom: "-0.08em", ...style }}>
      <div style={{ transform: `translateY(${(1 - p) * dy}%)`, opacity: interpolate(p, [0, 0.3], [0, 1]) }}>{children}</div>
    </div>
  );
};

// Apparition en fondu + léger déplacement.
export const FadeUp: React.FC<{ at: number; dur?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at,
  dur = 18,
  y = 24,
  children,
  style,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur);
  return <div style={{ opacity: p, transform: `translateY(${(1 - p) * y}px)`, ...style }}>{children}</div>;
};

// Compteur animé, format français (espaces entre milliers).
export const Counter: React.FC<{
  from?: number;
  to: number;
  at: number;
  dur?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
  decimals?: number;
  step?: number;
}> = ({ from = 0, to, at, dur = 45, prefix = "", suffix = "", style, decimals = 0, step = 1 }) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, ease.out);
  const v = from + (to - from) * p;
  const txt = decimals > 0 ? v.toFixed(decimals).replace(".", ",") : fmt(Math.round(v / step) * step);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", ...style }}>
      {prefix}
      {txt}
      {suffix}
    </span>
  );
};

// Pastille de variation (+11 %, -19 %...).
export const Chip: React.FC<{ at: number; text: string; color?: string; size?: number; style?: React.CSSProperties }> = ({
  at,
  text,
  color = C.orange,
  size = 34,
  style,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 16, ease.out);
  const s = interpolate(p, [0, 0.6, 1], [0.6, 1.08, 1]);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: `${size * 0.22}px ${size * 0.5}px`,
        borderRadius: 999,
        background: `${color}22`,
        border: `2px solid ${color}`,
        color,
        fontFamily: F.mono,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "-0.02em",
        opacity: p,
        transform: `scale(${s})`,
        transformOrigin: "left center",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// Petite étiquette en capitales, police mono.
export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.muted,
  size = 22,
  style,
}) => (
  <div style={{ fontFamily: F.mono, fontSize: size, letterSpacing: "0.14em", textTransform: "uppercase", color, ...style }}>{children}</div>
);

// Trait d'accent qui se dessine de gauche à droite.
export const Bar: React.FC<{ at: number; width: number; color?: string; height?: number; dur?: number; style?: React.CSSProperties }> = ({
  at,
  width,
  color = C.orange,
  height = 6,
  dur = 24,
  style,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur, ease.inOut);
  return <div style={{ width: width * p, height, background: color, borderRadius: height, ...style }} />;
};

// Fondu de sortie commun en fin de scène.
export const useExit = (duration: number, len = 12) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [duration - len, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.in });
  return { opacity: 1 - p, transform: `scale(${1 + p * 0.03})`, filter: `blur(${p * 8}px)` } as React.CSSProperties;
};

export const useEnter = (len = 14) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  return { opacity: p, transform: `scale(${1.03 - p * 0.03})`, filter: `blur(${(1 - p) * 8}px)` } as React.CSSProperties;
};
