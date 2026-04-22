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
    bio: "Journaliste trail, couvre le circuit international depuis plus de dix ans. Spécialisé dans l'actualité des courses majeures (UTMB, Western States, Tor des Géants), les portraits de coureurs et l'analyse des enjeux structurants du trail mondial.",
    jobTitle: "Rédacteur — Actualités & courses",
    specialties: ["actualites", "courses-recits"],
  },
  {
    slug: "yann-karroum",
    name: "Yann Karroum",
    bio: "Passionné et pratiquant de trail. Fondateur d'Altitude Trail, il signe des articles sur les sujets qui le touchent de près dans la pratique quotidienne du trail running en France.",
    jobTitle: "Rédacteur",
    specialties: ["actualites", "entrainement", "nutrition", "courses-recits"],
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

// Choix d'un auteur pour un nouvel article selon la catégorie + rotation.
// Utilisé par scripts/veille.mjs quand on publie un article.
// Logique :
//   1. On ne garde que les auteurs dont `specialties` contient la categorySlug
//   2. Si plusieurs matchent, rotation basée sur la date (hash simple) pour
//      éviter que ce soit toujours le même qui signe.
//   3. Si aucun ne matche, fallback sur Yann Karroum (polyvalent).
export function pickAuthorForCategory(
  categorySlug: string,
  seed: string = new Date().toISOString()
): Author {
  const matching = AUTHORS.filter((a) => a.specialties.includes(categorySlug));
  if (!matching.length) {
    return getAuthorBySlug("yann-karroum")!;
  }
  // Hash simple du seed pour picker déterministe
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return matching[Math.abs(h) % matching.length];
}

export function authorUrl(slug: string): string {
  return `${SITE_URL}/auteurs/${slug}`;
}
