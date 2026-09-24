import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, random } from "remotion";
import { C } from "../theme";
import { TL } from "../lib/timeline";

// Fond continu sous toutes les scènes : dégradé, trame de plan technique, halos lents, grain.
export const Background: React.FC = () => {
  const f = useCurrentFrame();
  // La trame défile de plus en plus vite au fil de la vidéo : vitesse 0,15 -> 0,75 px par image.
  const T = TL.durationInFrames;
  const drift = (0.15 * f + (0.6 * f ** 3) / (3 * T * T)) % 80;
  // Grain renouvelé toutes les 3 images : texture pellicule sans exploser le débit vidéo.
  const g = Math.floor(f / 3);
  const gx = Math.round(random(`gx${g}`) * 270);
  const gy = Math.round(random(`gy${g}`) * 210);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${C.bg2} 0%, ${C.bg} 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          backgroundPosition: `${drift}px ${drift * 0.5}px`,
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 50%, black 20%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 50%, black 20%, transparent 85%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1100,
          height: 1100,
          left: 900 + Math.sin(f / 140) * 160,
          top: -380 + Math.cos(f / 170) * 90,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,106,19,0.10) 0%, transparent 62%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          left: -380 + Math.cos(f / 160) * 120,
          top: 380 + Math.sin(f / 190) * 80,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(56,210,255,0.06) 0%, transparent 62%)`,
        }}
      />
      <AbsoluteFill style={{ opacity: 0.045, mixBlendMode: "overlay" }}>
        <Img
          src={staticFile("img/noise.png")}
          style={{ position: "absolute", left: -gx, top: -gy, width: 2200, height: 1300 }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 100% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)" }} />
    </AbsoluteFill>
  );
};
