import React from "react";
import map from "../data/map.json";
import { C } from "../theme";

type Dot = [number, number, string, number];
export const MAP = map as unknown as { width: number; height: number; step: number; dots: Dot[]; anchors: Record<string, [number, number]>; chinaPath: string };

// Carte du monde en points. `level(region, countryId)` renvoie [couleur, opacité, rayon relatif].
export const DotMap: React.FC<{
  level: (region: string, id: number, x: number, y: number) => [string, number, number];
  x: number;
  y: number;
  scale: number;
}> = ({ level, x, y, scale }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {MAP.dots.map(([dx, dy, r, id], i) => {
      const [col, op, rad] = level(r, id, dx, dy);
      return <circle key={i} cx={dx} cy={dy} r={(MAP.step * 0.34) * rad} fill={col} opacity={op} />;
    })}
  </g>
);

export const NEUTRAL: [string, number, number] = ["#2A3342", 0.9, 1];
export const REGION_COLOR: Record<string, string> = { A: C.orange, M: C.cyan, E: "#C4CEDD", O: "#2A3342" };
