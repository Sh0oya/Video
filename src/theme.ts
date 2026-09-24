import { Easing } from "remotion";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/600.css";

export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#07090D",
  bg2: "#0D121A",
  panel: "#111824",
  line: "rgba(255,255,255,0.08)",
  ink: "#F2F4F7",
  muted: "#8B95A7",
  dim: "#4A5363", // traits et éléments décoratifs uniquement
  textDim: "#7A8496", // texte secondaire lisible (contraste ≈ 5:1)
  steel: "#2A3342",
  steelHi: "#3A4556",
  orange: "#FF6A13",
  orangeHi: "#FF8A3D",
  cyan: "#38D2FF",
  red: "#FF4F5E",
  green: "#3DDC97",
};

export const F = {
  display: "'Archivo Variable', 'Archivo', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// Courbes de mouvement communes à toute la vidéo.
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
};

export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
