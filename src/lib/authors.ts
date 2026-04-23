// Système d'auteurs d'Altitude Trail.
// 4 personas éditoriales. Bios volontairement courtes (1 phrase) pour rester
// crédibles et éviter l'effet "fake". Pas de photos.

import { SITE_URL, SITE_NAME } from "./seo";

export interface Author {
  slug: string;
  name: string;
  bio: string;           // Une phrase courte
  jobTitle: string;
  specialties: string[]; // Catégories pour routage éditorial automatique
  sameAs?: string[];
}

export const AUTHORS: Author[] = [
  {
    slug: "thomas-rouvier",
    name: "Thomas Rouvier",
    bio: "Coach trail et finisher UTMB, passionné de la préparation physique spécifique montagne. Il couvre sur Altitude Trail la physiologie de l'endurance, la périodisation et les méthodes de renforcement adaptées aux coureurs de montagne.",
    jobTitle: "Rédacteur — Entraînement & physiologie",
    specialties: ["entrainement", "blessures-preventions"],
  },
  {
    slug: "claire-mercier",
    name: "Claire Mercier",
    bio: "Diététicienne du sport et ultra-traileuse, spécialisée dans la nutrition d'endurance. Elle signe les articles dédiés à l'alimentation en course, l'hydratation, la gestion des troubles digestifs et la récupération nutritionnelle.",
    jobTitle: "Rédactrice — Nutrition & récupération",
    specialties: ["nutrition"],
  },
  {
    slug: "marc-blanc",
    name: "Marc Blanc",
    bio: "Journaliste trail, couvre le circuit international depuis plus de dix ans. Spécialisé dans l'actualité des courses majeures (UTMB, Western States, Tor des Géants), les portraits de coureurs, l'actualité des marques et du matériel, et l'analyse des enjeux structurants du trail mondial.",
    jobTitle: "Rédacteur — Actualités, courses & industrie",
    // Marc couvre l'éditorial de fond (actualites, courses-recits) et les
    // brèves actu sur les trois verticales (athletes, marques-industrie,
    // equipement). Sur equipement, partage avec Yann 80/20 pour l'angle
    // consumer-oriented (prix en France, dispo, premier achat).
    specialties: ["actualites", "courses-recits", "athletes", "marques-industrie", "equipement"],
  },
  {
    slug: "yann-karroum",
    name: "Yann Karroum",
    bio: "Passionné et pratiquant de trail. Fondateur d'Altitude Trail, il signe les articles d'actualité, les contenus pour les coureurs qui débutent et les brèves équipement avec l'angle marché français (prix, disponibilité, choix pour commencer).",
    jobTitle: "Rédacteur — Actualités, Débuter & Équipement",
    // Yann intervient sur les actualités (partage 80/20 avec Marc), sur
    // "débuter" (seul responsable) et en cosigne 80/20 sur "equipement" avec
    // Marc pour l'angle consumer-oriented.
    specialties: ["actualites", "debuter", "equipement"],
  },
];

export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

export function getAuthorByName(name: string): Author | undefined {
  // Recherche tolérante (accents, casse)
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  const target = norm(name);
  return AUTHORS.find((a) => norm(a.name) === target);
}

// Résout un auteur depuis la frontmatter d'article. Si la frontmatter porte
// "Rédaction Altitude Trail" ou "Rédaction Altitude" (fallback historique),
// on reste sur ces libellés sans lier à un auteur — ça évite de réécrire
// toute la base pendant la migration.
export function resolveAuthor(rawName: string | undefined): {
  display: string;
  author?: Author;
} {
  if (!rawName) return { display: `Rédaction ${SITE_NAME}` };
  const match = getAuthorByName(rawName);
  if (match) return { display: match.name, author: match };
  // Libellés rédaction collectifs : pas d'auteur lié
  if (/^\s*rédaction\s/i.test(rawName)) return { display: rawName };
  return { display: rawName };
}

// Attribution d'auteur. Règles :
//   - Yann n'intervient que sur les catégories listées dans ses specialties
//     (actualités, débuter).
//   - Sur "actualités", partage 80/20 avec Marc Blanc (spécialiste principal).
//   - Sur "débuter", Yann est seul spécialiste → 100%.
//   - Sur les autres catégories (entraînement, nutrition, blessures,
//     courses-récits), Yann n'intervient jamais.
const YANN_SHARE_WHEN_COSIGN = 1 / 5;

export function pickAuthorForCategory(
  categorySlug: string,
  seed: string = new Date().toISOString()
): Author {
  const yann = getAuthorBySlug("yann-karroum")!;
  const yannCovers = yann.specialties.includes(categorySlug);
  const otherSpecialists = AUTHORS.filter(
    (a) => a.slug !== "yann-karroum" && a.specialties.includes(categorySlug)
  );

  // Hash déterministe du seed pour un choix reproductible
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
  // Cas 3 : autres spécialistes sans Yann → 100% spécialiste
  if (otherSpecialists.length > 0) {
    return otherSpecialists[absHash % otherSpecialists.length];
  }
  // Cas 4 (rare) : personne ne couvre la catégorie → fallback Yann
  return yann;
}

export function authorUrl(slug: string): string {
  return `${SITE_URL}/auteurs/${slug}`;
}
