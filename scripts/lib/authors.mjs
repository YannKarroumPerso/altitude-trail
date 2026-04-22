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
    specialties: ["actualites", "courses-recits"],
  },
  {
    slug: "yann-karroum",
    name: "Yann Karroum",
    specialties: ["actualites", "entrainement", "nutrition", "courses-recits", "debuter"],
  },
];

export function pickAuthorForCategory(categorySlug, seed = new Date().toISOString()) {
  const matching = AUTHORS.filter((a) => a.specialties.includes(categorySlug));
  const pool = matching.length ? matching : AUTHORS.filter((a) => a.slug === "yann-karroum");
  // Hash simple déterministe pour rotation
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return pool[Math.abs(h) % pool.length];
}
