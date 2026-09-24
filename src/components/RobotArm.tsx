import React from "react";
import { interpolate } from "remotion";
import { C, ease } from "../theme";

export type Pose = { s: number; e: number; w: number; g: number; base?: number };
export type Key = Pose & { f: number };

// Interpolation entre poses clés (angles en degrés, pince 0 = fermée, 1 = ouverte).
export const poseAt = (frame: number, keys: Key[]): Pose => {
  const fs = keys.map((k) => k.f);
  const get = (p: keyof Pose) =>
    interpolate(frame, fs, keys.map((k) => (k[p] as number) ?? 0), {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease.inOut,
    });
  return { s: get("s"), e: get("e"), w: get("w"), g: get("g"), base: get("base") };
};

const L1 = 300;
const L2 = 250;
const TOOL = 110;
const SHOULDER = 164;

const deg = (r: number) => (r * 180) / Math.PI;

// Cinématique inverse (coude en haut) : pose qui amène le centre de la charge au point (tx, ty),
// pince orientée vers le bas. (x, y, scale) = position et échelle du socle.
export const ik = (tx: number, ty: number, x: number, y: number, scale: number, g = 0): Pose => {
  const sx = x;
  const sy = y - SHOULDER * scale;
  const wx = tx;
  const wy = ty - TOOL * scale;
  const vx = (wx - sx) / scale;
  const vy = (wy - sy) / scale;
  const d = Math.min(Math.hypot(vx, vy), L1 + L2 - 1);
  const phi = deg(Math.atan2(vx, -vy));
  const gamma = deg(Math.acos((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2)));
  const beta = deg(Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const s = vx >= 0 ? phi - beta : phi + beta;
  const e = vx >= 0 ? 180 - gamma : -(180 - gamma);
  // Pas de repli modulo 360 : l'angle absolu de la pince reste 180° pendant les interpolations.
  return { s, e, w: 180 - s - e, g };
};

// Bras industriel 6 axes stylisé (vue de profil), dessiné en SVG à cinématique directe.
export const RobotArm: React.FC<{
  pose: Pose;
  id: string;
  x: number;
  y: number;
  scale?: number;
  color?: string;
  opacity?: number;
  glow?: number;
  payload?: React.ReactNode;
}> = ({ pose, id, x, y, scale = 1, color = C.orange, opacity = 1, glow = 0, payload }) => {
  const g = 10 + pose.g * 22;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <defs>
        <linearGradient id={`${id}-link`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="1" />
          <stop offset="0.45" stopColor={color} />
          <stop offset="1" stopColor="#B8430A" />
        </linearGradient>
        <linearGradient id={`${id}-steel`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#3A4556" />
          <stop offset="1" stopColor="#1A212C" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      {glow > 0 && <ellipse cx={0} cy={-260} rx={260} ry={320} fill={color} opacity={0.12 * glow} filter={`url(#${id}-glow)`} />}
      {/* Socle */}
      <ellipse cx={0} cy={6} rx={170} ry={16} fill="#000" opacity={0.45} />
      <path d="M -120 0 L -84 -72 L 84 -72 L 120 0 Z" fill={`url(#${id}-steel)`} stroke="#4A5566" strokeWidth={2} />
      <rect x={-120} y={-8} width={240} height={10} rx={3} fill="#1B222D" />
      <g transform={`translate(0 -72) rotate(${pose.base ?? 0})`}>
        <rect x={-86} y={-58} width={172} height={58} rx={12} fill="#1F2733" stroke="#4A5566" strokeWidth={2} />
        <rect x={-86} y={-58} width={172} height={10} rx={5} fill={color} opacity={0.9} />
        <g transform="translate(0 -92)">
          {/* Épaule */}
          <circle r={56} fill="#161C25" stroke="#4A5566" strokeWidth={2} />
          <g transform={`rotate(${pose.s})`}>
            <path d={`M -40 0 L -31 ${-L1} L 31 ${-L1} L 40 0 Z`} fill={`url(#${id}-link)`} />
            <path d={`M -14 -30 C -26 ${-L1 * 0.4} -24 ${-L1 * 0.7} -12 ${-L1 + 26}`} stroke="#1A1F28" strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.75} />
            <rect x={18} y={-L1 * 0.62} width={8} height={L1 * 0.38} rx={4} fill="#fff" opacity={0.18} />
            <circle r={40} fill={color} />
            <circle r={24} fill="#161C25" />
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 32} cy={Math.sin((a * Math.PI) / 180) * 32} r={3} fill="#161C25" />
            ))}
            <g transform={`translate(0 ${-L1}) rotate(${pose.e})`}>
              {/* Coude + avant-bras */}
              <circle r={44} fill="#161C25" stroke="#4A5566" strokeWidth={2} />
              <path d={`M -30 0 L -22 ${-L2} L 22 ${-L2} L 30 0 Z`} fill={`url(#${id}-link)`} />
              <rect x={12} y={-L2 * 0.7} width={7} height={L2 * 0.45} rx={3.5} fill="#fff" opacity={0.18} />
              <circle r={30} fill={color} />
              <circle r={16} fill="#161C25" />
              <g transform={`translate(0 ${-L2}) rotate(${pose.w})`}>
                {/* Poignet + pince */}
                <circle r={28} fill="#161C25" stroke="#4A5566" strokeWidth={2} />
                <rect x={-18} y={-58} width={36} height={58} rx={6} fill="#262F3C" stroke="#4A5566" strokeWidth={1.5} />
                <circle r={17} fill={color} />
                <rect x={-44} y={-72} width={88} height={16} rx={4} fill="#2F3947" stroke="#4A5566" strokeWidth={1.5} />
                <rect x={-g - 10} y={-128} width={12} height={58} rx={3} fill="#C9D1DC" />
                <rect x={g - 2} y={-128} width={12} height={58} rx={3} fill="#C9D1DC" />
                {payload && <g transform="translate(0 -110)">{payload}</g>}
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
  );
};
