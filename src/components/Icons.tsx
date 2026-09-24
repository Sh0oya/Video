import React from "react";
import { C } from "../theme";

// Pictogrammes au trait, tracés sur une grille de 100 x 100.
type P = { size?: number; color?: string; stroke?: number; style?: React.CSSProperties };

const Svg: React.FC<P & { children: React.ReactNode }> = ({ size = 96, color = C.ink, stroke = 6, style, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    stroke={color}
    strokeWidth={stroke}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ overflow: "visible", ...style }}
  >
    {children}
  </svg>
);

export const Worker: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M30 34 Q50 14 70 34 Z" />
    <line x1="26" y1="34" x2="74" y2="34" />
    <circle cx="50" cy="44" r="10" />
    <path d="M28 92 V74 Q28 60 50 60 Q72 60 72 74 V92" />
  </Svg>
);

export const Robot: React.FC<P> = (p) => (
  <Svg {...p}>
    <line x1="50" y1="10" x2="50" y2="22" />
    <circle cx="50" cy="8" r="4" />
    <rect x="26" y="22" width="48" height="36" rx="10" />
    <circle cx="40" cy="40" r="4" />
    <circle cx="60" cy="40" r="4" />
    <path d="M22 92 V72 Q22 64 30 64 H70 Q78 64 78 72 V92" />
  </Svg>
);

export const Weight: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="22" r="8" />
    <path d="M30 34 H70 L82 88 H18 Z" />
    <path d="M42 60 H58" />
  </Svg>
);

export const Warning: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M50 12 L90 84 H10 Z" />
    <line x1="50" y1="38" x2="50" y2="60" />
    <circle cx="50" cy="72" r="1.5" />
  </Svg>
);

export const Repeat: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M20 46 A30 30 0 0 1 76 30" />
    <path d="M76 12 V30 H58" />
    <path d="M80 54 A30 30 0 0 1 24 70" />
    <path d="M24 88 V70 H42" />
  </Svg>
);

export const Factory: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M10 88 V46 L32 58 V46 L54 58 V46 L76 58 V22 H88 V88 Z" />
    <line x1="24" y1="74" x2="32" y2="74" />
    <line x1="46" y1="74" x2="54" y2="74" />
    <line x1="68" y1="74" x2="76" y2="74" />
  </Svg>
);

export const Chart: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 88 H90" />
    <path d="M18 72 L40 52 L56 62 L86 26" />
    <path d="M70 26 H86 V42" />
  </Svg>
);

export const Shield: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M50 10 L84 22 V48 Q84 76 50 92 Q16 76 16 48 V22 Z" />
    <path d="M34 50 L46 62 L68 38" />
  </Svg>
);

export const Box: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M50 10 L88 28 V72 L50 90 L12 72 V28 Z" />
    <path d="M12 28 L50 46 L88 28" />
    <line x1="50" y1="46" x2="50" y2="90" />
  </Svg>
);

export const Health: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="12" y="12" width="76" height="76" rx="18" />
    <path d="M50 30 V70 M30 50 H70" />
  </Svg>
);

export const Food: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M50 30 Q34 18 22 34 Q12 52 26 74 Q38 92 50 82 Q62 92 74 74 Q88 52 78 34 Q66 18 50 30 Z" />
    <path d="M50 30 Q52 18 62 12" />
  </Svg>
);

export const Car: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M12 66 V52 L24 34 H70 L86 52 V66 Z" />
    <circle cx="30" cy="70" r="8" />
    <circle cx="70" cy="70" r="8" />
    <line x1="24" y1="52" x2="86" y2="52" />
  </Svg>
);

export const Chip: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="26" y="26" width="48" height="48" rx="6" />
    <rect x="40" y="40" width="20" height="20" rx="3" />
    <path d="M38 26 V12 M50 26 V12 M62 26 V12 M38 74 V88 M50 74 V88 M62 74 V88 M26 38 H12 M26 50 H12 M26 62 H12 M74 38 H88 M74 50 H88 M74 62 H88" />
  </Svg>
);

export const Gear: React.FC<P> = (p) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="14" />
    <path d="M50 12 V24 M50 76 V88 M12 50 H24 M76 50 H88 M23 23 L32 32 M68 68 L77 77 M23 77 L32 68 M68 32 L77 23" />
    <circle cx="50" cy="50" r="28" />
  </Svg>
);

export const Home: React.FC<P> = (p) => (
  <Svg {...p}>
    <path d="M14 48 L50 16 L86 48" />
    <path d="M24 40 V86 H76 V40" />
    <path d="M42 86 V62 H58 V86" />
  </Svg>
);

export const Tablet: React.FC<P> = (p) => (
  <Svg {...p}>
    <rect x="18" y="12" width="64" height="76" rx="8" />
    <path d="M30 60 L42 46 L52 54 L68 34" />
    <line x1="44" y1="78" x2="56" y2="78" />
  </Svg>
);

// Horloge dont l'aiguille tourne (angle en degrés).
export const Clock: React.FC<P & { angle: number }> = ({ angle, ...p }) => (
  <Svg {...p}>
    <circle cx="50" cy="50" r="38" />
    <line x1="50" y1="50" x2="50" y2="28" transform={`rotate(${angle} 50 50)`} />
    <line x1="50" y1="50" x2="64" y2="50" transform={`rotate(${angle / 12} 50 50)`} />
    <circle cx="50" cy="50" r="2" />
  </Svg>
);
