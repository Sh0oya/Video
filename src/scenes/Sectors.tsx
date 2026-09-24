import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, F, ease } from "../theme";
import { localLines, prog } from "../lib/timeline";
import { FadeUp, Label, Reveal, useExit } from "../components/Ui";
import { Box, Car, Chip, Factory, Food, Gear, Health } from "../components/Icons";

// Début (image locale) du premier bloc de sous-titre qui correspond au motif, sinon repli.
const when = (L: ReturnType<typeof localLines>, re: RegExp, fallback: number) => {
  for (const l of L) for (const s of l.subs) if (re.test(s.text)) return s.from;
  return fallback;
};
// Variante calée vers la fin du bloc, quand le mot clé termine la phrase.
const whenLate = (L: ReturnType<typeof localLines>, re: RegExp, fallback: number) => {
  for (const l of L) for (const s of l.subs) if (re.test(s.text)) return Math.round(s.from + 0.7 * (s.to - s.from));
  return fallback;
};

const TW = 300;
const TH = 190;
const TG = 24;
const TX = 1780 - (3 * TW + 2 * TG);
const TY = 340;

export const Sectors: React.FC<{ duration: number }> = ({ duration }) => {
  const f = useCurrentFrame();
  const L = localLines("sectors");
  const exit = useExit(duration);
  const last = L[L.length - 1];
  const tProd = whenLate(L, /productiv/i, L[0].from + 10);
  const tComp = whenLate(L, /compétitiv/i, tProd + 25);
  const tPrice = whenLate(L, /prix/i, tProd + 12);
  const tRelo = when(L, /relocalis/i, last.from);
  const tiles = [
    { name: "Automobile", Icon: Car, t: 6, fresh: false },
    { name: "Électronique", Icon: Chip, t: 9, fresh: false },
    { name: "Métal et machines", Icon: Gear, t: 12, fresh: false },
    { name: "Agroalimentaire", Icon: Food, t: when(L, /agroalimentaire|alimentaire/i, last.from + 10), fresh: true },
    { name: "Logistique", Icon: Box, t: when(L, /logistique|entrep/i, last.from + 30), fresh: true },
    { name: "Médical", Icon: Health, t: when(L, /santé|médical/i, last.from + 50), fresh: true },
  ];
  const stat = (label: string, t: number, y: number, down = false, note = "") => {
    const p = prog(f, t, 16, ease.out);
    const arrow = interpolate(p, [0, 1], [30, 0]);
    return (
      <div style={{ position: "absolute", left: 140, top: y, display: "flex", alignItems: "center", gap: 22, opacity: p }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `${C.orange}22`, border: `2px solid ${C.orange}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: F.display, fontWeight: 900, fontSize: 38, color: C.orange, transform: `translateY(${down ? -arrow : arrow}px)` }}>{down ? "▼" : "▲"}</div>
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 54, color: C.ink, lineHeight: 1 }}>{label}</div>
          {note && (
            <Label size={20} style={{ marginTop: 6 }}>
              {note}
            </Label>
          )}
        </div>
      </div>
    );
  };
  const relo = prog(f, tRelo, 18, ease.out);
  const deAt = L.flatMap((l) => l.subs).find((s) => /Allemagne|services/i.test(s.text))?.from;
  return (
    <AbsoluteFill style={exit}>
      <div style={{ position: "absolute", left: 140, top: 130 }}>
        <Reveal at={0}>
          <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 62, color: C.ink }}>Des usines plus fortes</div>
        </Reveal>
        <FadeUp at={6}>
          <Label size={21} style={{ marginTop: 10 }}>
            productivité · compétitivité · nouveaux secteurs
          </Label>
        </FadeUp>
      </div>

      {stat("Productivité", tProd, 320, false, "≈ +0,36 point par an · 17 pays, 1993-2007")}
      {stat("Prix", tPrice, 440, true, "même étude, publiée en 2018")}
      {stat("Compétitivité", tComp, 560, false, "selon l’IFR")}
      <div style={{ position: "absolute", left: 140, top: 690, display: "flex", alignItems: "center", gap: 22, opacity: relo, transform: `translateX(${(1 - relo) * -30}px)` }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `${C.cyan}22`, border: `2px solid ${C.cyan}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Factory size={40} color={C.cyan} stroke={8} />
        </div>
        <div style={{ fontFamily: F.display, fontWeight: 800, fontStretch: "110%", fontSize: 40, color: C.ink, lineHeight: 1 }}>
          Relocalisation
          <Label size={20} style={{ marginTop: 6 }}>
            aux États-Unis · selon l’IFR
          </Label>
        </div>
      </div>

      {tiles.map((tile, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const p = prog(f, tile.fresh ? tile.t : tile.t, 14, ease.out);
        const lit = tile.fresh ? prog(f, tile.t, 12, ease.out) : 0;
        const pop = tile.fresh ? interpolate(f, [tile.t, tile.t + 5, tile.t + 16], [1, 1.06, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
        const color = tile.fresh ? (lit > 0.5 ? C.orange : C.dim) : C.muted;
        return (
          <div
            key={tile.name}
            style={{
              position: "absolute",
              left: TX + col * (TW + TG),
              top: TY + row * (TH + TG + 40),
              width: TW,
              height: TH,
              borderRadius: 18,
              background: tile.fresh && lit > 0.5 ? `${C.orange}18` : C.panel,
              border: `2px ${tile.fresh && lit < 0.5 ? "dashed" : "solid"} ${tile.fresh && lit > 0.5 ? C.orange : C.line}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              opacity: tile.fresh ? Math.max(0.3 * prog(f, 10, 14), p) : p,
              transform: `scale(${pop})`,
            }}
          >
            <div style={{ opacity: tile.fresh ? lit : 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <tile.Icon size={70} color={color} stroke={6} />
              <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 28, color: C.ink }}>{tile.name}</div>
            </div>
          </div>
        );
      })}
      {deAt !== undefined && (
        <div style={{ position: "absolute", left: 140, top: 680, maxWidth: 640, opacity: prog(f, deAt, 14) }}>
          <div style={{ fontFamily: F.body, fontWeight: 600, fontSize: 30, color: C.ink, lineHeight: 1.3 }}>
            Allemagne : emplois industriels perdus compensés par de nouveaux emplois dans les services
          </div>
          <Label size={18} style={{ marginTop: 6 }}>étude 1994-2014, publiée en 2021</Label>
        </div>
      )}
      <div style={{ position: "absolute", left: TX, top: TY - 44, opacity: prog(f, 10, 14) }}>
        <Label size={20}>secteurs historiques</Label>
      </div>
      <div style={{ position: "absolute", left: TX, top: TY + TH + TG - 4, opacity: prog(f, tiles[3].t - 6, 12) }}>
        <Label size={20} color={C.orange}>
          en plein essor aux États-Unis
        </Label>
      </div>
    </AbsoluteFill>
  );
};
