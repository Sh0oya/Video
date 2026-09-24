import timeline from "../data/timeline.json";
import narration from "../../script/narration.json";
import { interpolate } from "remotion";
import { ease } from "../theme";

export type Sub = { text: string; from: number; to: number };
export type Line = { from: number; to: number; subs: Sub[]; key: string };
export type Scene = { id: string; from: number; duration: number; lines: Line[] };

export const TL = timeline as { fps: number; durationInFrames: number; scenes: Scene[] };

const chapters: Record<string, string> = Object.fromEntries(
  (narration.scenes as { id: string; chapter?: string }[]).map((s) => [s.id, s.chapter ?? ""])
);

export const chapterOf = (id: string) => chapters[id] ?? "";

export const sceneById = (id: string): Scene => {
  const s = TL.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`scène inconnue : ${id}`);
  return s;
};

// Images locales (relatives au début de la scène) du début de chaque réplique et de chaque bloc.
export const localLines = (id: string) => {
  const s = sceneById(id);
  return s.lines.map((l) => ({
    from: l.from - s.from,
    to: l.to - s.from,
    subs: l.subs.map((b) => ({ ...b, from: b.from - s.from, to: b.to - s.from })),
  }));
};

// Progression 0 -> 1 à partir de l'image `start`, sur `dur` images.
export const prog = (frame: number, start: number, dur: number, easing = ease.out) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
