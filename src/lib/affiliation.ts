// Systeme d'affiliation outdoor d'Altitude Trail.
//
// Strategie editoriale (decision Yann 2026-05-18) : monetisation discrete et
// honnete. Un seul bloc d'affiliation par article, en fin d'article, avec
// disclaimer transparent. PAS de pop-up, PAS de bandeau saturant, PAS
// d'injection dans le corps de l'article (comme u-trail.com fait avec son
// encart Garmin Forerunner 165 -21% dans chaque article).
//
// Le bloc s'affiche UNIQUEMENT si l'article mentionne explicitement au moins
// une marque outdoor reconnue (detectee via tags ou contenu markdown).
//
// IDs partenaires : a configurer plus tard (variables env publiques). Pour
// l'instant : placeholder TODO_AFFILIATE_ID.

export type AffiliateProgram = {
  /** Identifiant interne du programme */
  slug: string;
  /** Nom du marchand affiche au lecteur */
  merchantLabel: string;
  /** URL de destination (le tag affiliate sera resolu au rendu) */
  url: string;
  /** Marques couvertes par ce programme */
  brands: string[];
  /** Phrase d'accroche (un peu factuel, jamais agressif) */
  cta: string;
};

/**
 * Programmes d'affiliation actifs.
 * - i-Run = catalogue trail running large (Salomon, Hoka, La Sportiva, Brooks,
 *   Saucony, Mizuno, Asics, Adidas Terrex, Altra, NNormal, Scarpa, Garmin,
 *   Coros, Suunto, Polar, Petzl, Black Diamond, etc.)
 * - Decathlon = marques Kiprun, Quechua, Forclaz, Evadict (les marques maison)
 *
 * IDs Awin / partenaire : a recuperer cote backend env public quand on
 * activera le programme. Pour l'instant : URLs nues (deja utiles pour l'UX).
 */
export const AFFILIATE_PROGRAMS: AffiliateProgram[] = [
  {
    slug: "i-run",
    merchantLabel: "i-Run",
    url: "https://www.i-run.fr/",
    brands: [
      "Salomon", "Hoka", "La Sportiva", "Brooks", "Saucony", "Mizuno",
      "Asics", "Adidas", "Adidas Terrex", "Altra", "NNormal", "Scarpa",
      "Garmin", "Coros", "Suunto", "Polar",
      "Petzl", "Black Diamond", "Compressport", "Raidlight", "Millet",
      "Lafuma", "Patagonia", "Arc'teryx", "Norda", "Speedland",
    ],
    cta: "Voir la selection trail chez",
  },
  {
    slug: "decathlon",
    merchantLabel: "Decathlon",
    url: "https://www.decathlon.fr/",
    brands: [
      "Kiprun", "Quechua", "Forclaz", "Evadict", "Decathlon",
    ],
    cta: "Trouver ce produit chez",
  },
];

/**
 * Detecte les marques mentionnees dans un article (content + tags + title).
 * Cherche les correspondances exactes (case-sensitive sur le nom de marque)
 * pour eviter les faux positifs ("Brooks" dans "Pat Brooks" ne match pas
 * la marque Brooks Running).
 *
 * @returns liste de noms de marques detectees, sans doublon
 */
export function detectBrandsInArticle(article: {
  title?: string;
  content?: string;
  tags?: string[];
}): string[] {
  const haystack = [
    article.title || "",
    article.content || "",
    ...(article.tags || []),
  ].join(" \n ");

  const allBrands = AFFILIATE_PROGRAMS.flatMap((p) => p.brands);
  const detected = new Set<string>();
  for (const brand of allBrands) {
    // Match avec word boundary pour eviter substrings parasites
    // Note : on garde la casse (Salomon avec une majuscule), ce qui suffit
    // pour ecarter les coureurs ou produits non-marques.
    const re = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "g");
    if (re.test(haystack)) detected.add(brand);
  }
  return Array.from(detected);
}

/**
 * Selectionne UN programme d'affiliation pertinent pour les marques detectees.
 * Strategie : si une seule des marques est Decathlon-owned, on pousse vers
 * Decathlon (lien direct). Sinon, on pousse vers i-Run (qui catalogue tout
 * le reste). Cas extreme (aucune marque match) : retourne null.
 */
export function pickAffiliationFor(brands: string[]): { program: AffiliateProgram; relevantBrands: string[] } | null {
  if (brands.length === 0) return null;
  const decathlonProgram = AFFILIATE_PROGRAMS.find((p) => p.slug === "decathlon")!;
  const iRunProgram = AFFILIATE_PROGRAMS.find((p) => p.slug === "i-run")!;

  const decathlonBrands = brands.filter((b) => decathlonProgram.brands.includes(b));
  // Si la marque mentionnee est exclusivement Decathlon-owned, on cible Decathlon.
  if (decathlonBrands.length > 0 && decathlonBrands.length === brands.length) {
    return { program: decathlonProgram, relevantBrands: decathlonBrands };
  }
  // Sinon, on regroupe sous i-Run qui catalogue tout.
  const iRunBrands = brands.filter((b) => iRunProgram.brands.includes(b));
  if (iRunBrands.length > 0) {
    return { program: iRunProgram, relevantBrands: iRunBrands };
  }
  return null;
}
