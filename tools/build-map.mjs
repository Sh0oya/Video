// Précalcule la carte du monde en points (dot-matrix) et le contour de la Chine.
// Sortie : src/data/map.json
import { readFileSync, writeFileSync } from "node:fs";
import { geoNaturalEarth1, geoContains, geoPath, geoMercator } from "d3-geo";
import { feature } from "topojson-client";

const topo = JSON.parse(readFileSync(new URL("../node_modules/world-atlas/countries-110m.json", import.meta.url)));
const countries = feature(topo, topo.objects.countries).features.filter((f) => f.id !== "010");
const W = 1640, H = 800, STEP = 10.5;

const projection = geoNaturalEarth1().fitExtent([[0, 20], [W, H]], { type: "FeatureCollection", features: countries });

// Régions de lecture pour la citation de J. Heffner (Asie / Amériques / Europe).
function region(lon, lat, id) {
  if (id === "643") return "O"; // Russie : neutre
  if (id === "304") return "M"; // Groenland : rattaché aux Amériques
  if (lon < -25) return "M";
  if (lat >= 35 && lon >= -25 && lon <= 40) return "E";
  if (lon >= 60 && lon <= 150 && lat >= -11 && lat <= 56) return "A";
  return "O";
}

const dots = [];
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const ll = projection.invert([x, y]);
    if (!ll || Number.isNaN(ll[0])) continue;
    // Écarte les points hors du contour de la projection (l'inversion y replie la longitude).
    const back = projection(ll);
    if (!back || Math.hypot(back[0] - x, back[1] - y) > 1) continue;
    const c = countries.find((f) => geoContains(f, ll));
    if (!c) continue;
    dots.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10, region(ll[0], ll[1], c.id), Number(c.id)]);
  }
}

// Positions projetées de quelques repères (étiquettes).
const anchors = Object.fromEntries(
  Object.entries({ asia: [105, 32], americas: [-95, 18], europe: [12, 50], china: [104, 35] }).map(([k, ll]) => [k, projection(ll).map((v) => Math.round(v))])
);

// Contour de la Chine, cadré dans une boîte 760 x 600.
const china = countries.find((f) => f.id === "156");
const cp = geoMercator().fitExtent([[10, 10], [750, 590]], china);
const chinaPath = geoPath(cp)(china);

writeFileSync(
  new URL("../src/data/map.json", import.meta.url),
  JSON.stringify({ width: W, height: H, step: STEP, dots, anchors, chinaPath })
);
console.log(`${dots.length} points, contour Chine ${chinaPath.length} caractères`);
