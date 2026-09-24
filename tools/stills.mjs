// Rend des images de contrôle aux moments clés de chaque scène : out/stills/<scene>-<n>.jpg
// Usage : node tools/stills.mjs [scene ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const tl = JSON.parse(readFileSync("src/data/timeline.json", "utf8"));
const only = process.argv.slice(2);
const scale = Number(process.env.STILL_SCALE ?? 0.6);

const shots = [];
for (const s of tl.scenes) {
  if (only.length && !only.includes(s.id)) continue;
  const pts = [s.from + 12];
  for (const l of s.lines) pts.push(Math.round(l.from + (l.to - l.from) * 0.55), l.to + 4);
  pts.push(s.from + s.duration - 16);
  [...new Set(pts)].sort((a, b) => a - b).forEach((frame, i) => shots.push({ name: `${s.id}-${String(i).padStart(2, "0")}`, frame }));
}

mkdirSync("out/stills", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { browserExecutable });
const composition = await selectComposition({ serveUrl, id: "Main", puppeteerInstance: browser });
for (const { name, frame } of shots) {
  await renderStill({ composition, serveUrl, frame, output: `out/stills/${name}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale, puppeteerInstance: browser });
  console.log(`${name}  image ${frame}`);
}
await browser.close({ silent: true });
