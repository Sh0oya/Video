import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { TL, chapterOf } from "../lib/timeline";

// Habillage permanent : source en haut à gauche, chapitre en haut à droite, barre de progression.
export const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const scene = [...TL.scenes].reverse().find((s) => f >= s.from) ?? TL.scenes[0];
  const idx = TL.scenes.indexOf(scene);
  const chapter = chapterOf(scene.id);
  const local = f - scene.from;
  const show = interpolate(f, [TL.scenes[2].from, TL.scenes[2].from + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outro = TL.scenes[TL.scenes.length - 1];
  const hide = interpolate(f, [outro.from + outro.duration - 156, outro.from + outro.duration - 138], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chapIn = interpolate(local, [4, 22], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  const prevChapter = idx > 0 ? chapterOf(TL.scenes[idx - 1].id) : "";
  const chapOpacity = chapter === prevChapter ? 1 : chapIn;
  const progress = f / TL.durationInFrames;
  return (
    <AbsoluteFill style={{ opacity: show * hide, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 72, top: 56, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 12, height: 12, background: C.orange, borderRadius: 2 }} />
        <div style={{ fontFamily: F.mono, fontSize: 19, letterSpacing: "0.16em", color: C.muted }}>IFR · WORLD ROBOTICS 2026</div>
      </div>
      {chapter && (
        <div
          style={{
            position: "absolute",
            right: 72,
            top: 52,
            fontFamily: F.mono,
            fontSize: 19,
            letterSpacing: "0.16em",
            color: C.ink,
            textTransform: "uppercase",
            opacity: chapOpacity,
            transform: `translateY(${(1 - chapOpacity) * -10}px)`,
            display: "flex",
            gap: 14,
            alignItems: "center",
          }}
        >
          <span style={{ color: C.orange }}>{chapter.split(" · ")[0]}</span>
          <span>{chapter.split(" · ")[1]}</span>
        </div>
      )}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 4, width: "100%", background: "rgba(255,255,255,0.06)" }}>
        <div style={{ height: 4, width: `${progress * 100}%`, background: C.orange, opacity: 0.85 }} />
      </div>
    </AbsoluteFill>
  );
};
