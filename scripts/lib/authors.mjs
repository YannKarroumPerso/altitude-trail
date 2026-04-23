// Version JS du système d'auteurs, utilisable depuis scripts/veille.mjs.
// DOIT rester synchronisée avec src/lib/authors.ts.

export const AUTHORS = [
  {
    slug: "thomas-rouvier",
    name: "Thomas Rouvier",
    specialties: ["entrainement", "blessures-preventions", "blessures"],
  },
  {
    slug: "claire-mercier",
    name: "Claire Mercier",
    specialties: ["nutrition"],
  },
  {
    slug: "marc-blanc",
    name: "Marc Blanc",
    // Marc couvre l'éditorial de fond et les brèves actu sur les 3 verticales.
    specialties: ["actualites", "courses-recits", "athletes", "marques-industrie", "equipement"],
  },
  {
    slug: "yann-karroum",
    name: "Yann Karroum",
    // Yann intervient sur les actualités (80/20 avec Marc), sur "débuter"
    // (seul) et en cosigne 80/20 sur "equipement" avec Marc.
    specialties: ["actualites", "debuter", "equipement"],
  },
];

// Attribution d'auteur. Règles :
//   - Yann n'intervient que sur les catégories listées dans ses specialties
//     (actualités, débuter).
//   - Sur "actualités", partage 80/20 avec Marc Blanc (spécialiste principal).
//   - Sur "débuter", Yann est seul spécialiste → 100%.
//   - Sur les autres catégories (entraînement, nutrition, blessures,
//     courses-récits), Yann n'intervient jamais : le spécialiste de la
//     catégorie signe à 100%.
const YANN_SHARE_WHEN_COSIGN = 1 / 5;

export function pickAuthorForCategory(categorySlug, seed = new Date().toISOString()) {
  const yann = AUTHORS.find((a) => a.slug === "yann-karroum");
  const yannCovers = yann && yann.specialties.includes(categorySlug);
  const otherSpecialists = AUTHORS.filter(
    (a) => a.slug !== "yann-karroum" && a.specialties.includes(categorySlug)
  );

  // Hash déterministe du seed (titre / slug) pour un choix reproductible
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  const absHash = Math.abs(h);

  // Cas 1 : Yann couvre ET d'autres spécialistes existent → 80/20 Yann/spécialiste
  if (yannCovers && otherSpecialists.length > 0) {
    const bucket = absHash % Math.round(1 / YANN_SHARE_WHEN_COSIGN);
    if (bucket === 0) return yann;
    return otherSpecialists[absHash % otherSpecialists.length];
  }
  // Cas 2 : Yann est le seul à couvrir → 100% Yann
  if (yannCovers) return yann;
  // Cas 3 : Yann ne couvre pas, mais des spécialistes existent → 100% spécialiste
  if (otherSpecialists.length > 0) {
    return otherSpecialists[absHash % otherSpecialists.length];
  }
  // Cas 4 (rare) : personne ne couvre la catégorie → fallback Yann
  return yann || AUTHORS[0];
}
