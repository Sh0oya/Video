// Chiffres affichés à l'écran. Sources et niveaux de confiance : docs/fiche-faits.md

// Parc mondial en service (millions), valeur publiée au départ par chaque édition de World Robotics.
export const STOCK = [
  { year: 2015, v: 1.63 },
  { year: 2016, v: 1.83 },
  { year: 2017, v: 2.1 },
  { year: 2018, v: 2.44 },
  { year: 2019, v: 2.72 },
  { year: 2020, v: 3.01 },
  { year: 2021, v: 3.48 },
  { year: 2022, v: 3.9 },
  { year: 2023, v: 4.28 },
  { year: 2024, v: 4.66 },
  { year: 2025, v: 5.08 }, // « 5 millions », +9 % sur 4,66 M : environ 5,08 M
].map((d) => ({ ...d, label: d.year === 2025 ? "5 M" : `${d.v.toFixed(2).replace(".", ",")} M` }));

// Installations annuelles dans le monde (unités).
export const INSTALLS = [
  { year: 2022, v: 553_000 },
  { year: 2023, v: 541_000 },
  { year: 2024, v: 542_000 },
  { year: 2025, v: 600_000 }, // « plus de 600 000 »
];
export const FORECAST = [
  { year: 2026, v: 655_000 },
  { year: 2029, v: 806_000 },
];

// Top 6 des installations 2025.
export const TOP6 = [
  { rank: 1, name: "Chine", v: 354_200, delta: "+20 %" },
  { rank: 2, name: "États-Unis", v: 38_400, delta: "+12 %" },
  { rank: 3, name: "Japon", v: 36_219, delta: "−19 %" },
  { rank: 4, name: "Corée du Sud", v: 30_200, delta: "" },
  { rank: 5, name: "Allemagne", v: 24_800, delta: "" },
  { rank: 6, name: "Inde", v: 10_500, delta: "+15 %" },
];
