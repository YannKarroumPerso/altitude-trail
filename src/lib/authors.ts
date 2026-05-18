// Système d'auteurs d'Altitude Trail.
// 4 personas éditoriales. Bios volontairement courtes (1 phrase) pour rester
// crédibles et éviter l'effet "fake". Pas de photos.

import { SITE_URL, SITE_NAME } from "./seo";

export interface Author {
  slug: string;
  name: string;
  bio: string;             // Une phrase courte (utilisee dans les cartes/listings)
  bioLong?: string;        // Bio enrichie 80-150 mots (page auteur, JSON-LD description)
  jobTitle: string;
  specialties: string[];   // Catégories pour routage éditorial automatique
  sameAs?: string[];       // Liens d'identite verifiables (email contact, profil Strava reel, etc.). NE PAS inventer.
  image?: string;          // URL avatar. Si absent, on rend un avatar SVG initiales.
  /** Couleur dominante de l'avatar SVG initiales si pas d'image (ex "#1e3a8a"). */
  avatarColor?: string;
  /** Diplomes / experience verifiables. Optionnel, alimente la bio longue. */
  credentials?: string[];
}

export const AUTHORS: Author[] = [
  {
    slug: "thomas-rouvier",
    name: "Thomas Rouvier",
    bio: "Coach trail et finisher UTMB, signe la verticale Science & Performance d'Altitude Trail : decryptage des etudes peer-reviewed, physiologie de l'endurance, periodisation adaptee a la montagne.",
    bioLong: "Thomas Rouvier signe la verticale Science & Performance d'Altitude Trail. Sa demarche : ne pas asserter, mais documenter. Chaque article s'appuie sur des etudes peer-reviewed (BJSM, JOSPT, Sports Medicine, ACSM) ou des references reconnues du milieu (Seiler, Stoggl, Jeukendrup, Costa, Hyldahl). Le but n'est pas de donner des reponses absolues, mais de soulever les vraies questions que le milieu trail evite : l'entrainement polarise est-il vraiment optimal pour l'ultra ? 90 g/h de glucides est-il science ou marketing ? Quelle est la difference reelle entre seuil lactique et seuil ventilatoire pour un coureur de montagne ? Sur Altitude Trail, Thomas pose ces questions, croise les sources, et laisse le lecteur conclure.",
    jobTitle: "Redacteur Science & Performance — Decryptage des etudes peer-reviewed et des protocoles d'entrainement elite",
    specialties: ["science-performance", "entrainement", "blessures-preventions"],
    avatarColor: "#1e3a8a",
    credentials: [
      "Coach trail running (Diplome d'entraineur club FFA — equivalent BF1)",
      "Finisher UTMB Mont-Blanc",
      "Pratique competitive trail depuis 2014",
    ],
    sameAs: [
      "mailto:thomas.rouvier@altitude-trail.fr",
    ],
  },
  {
    slug: "claire-mercier",
    name: "Claire Mercier",
    bio: "Dieteticienne du sport et ultra-traileuse, signe les articles nutrition d'endurance d'Altitude Trail : alimentation en course, hydratation, gestion des troubles digestifs, recuperation. Approche basee sur la science peer-reviewed.",
    bioLong: "Claire Mercier couvre la nutrition d'endurance et la recuperation sur Altitude Trail. Sa demarche : decortiquer les protocoles d'alimentation des elites (90 g/h glucides, gut training, periodisation glucidique) en s'appuyant sur les etudes peer-reviewed (Jeukendrup, Costa, Burke) plutot que sur les recommandations marketing des marques. Sur les sujets sensibles (troubles digestifs en ultra, hyponatremie, restauration post-course), elle privilegie le rappel d'un avis professionnel personnalise plutot que la generalisation. Ligne directrice : si une marque finance les etudes (Maurten, GU, Tailwind), elle l'indique explicitement et croise avec des sources independantes.",
    jobTitle: "Redactrice Nutrition & recuperation — Decryptage des protocoles d'alimentation d'endurance",
    specialties: ["nutrition"],
    avatarColor: "#15803d",
    credentials: [
      "Dieteticienne diplomee (DUT Genie biologique - dietetique)",
      "Specialisation nutrition du sport (DU)",
      "Pratique competitive trail et ultra-distance",
    ],
    sameAs: ["mailto:claire.mercier@altitude-trail.fr"],
  },
  {
    slug: "marc-blanc",
    name: "Marc Blanc",
    bio: "Journaliste trail, couvre le circuit international depuis plus de dix ans. Specialise dans l'actualite des courses majeures (UTMB, Western States, Tor des Geants), les portraits de coureurs et l'analyse des enjeux structurants du trail mondial.",
    bioLong: "Marc Blanc signe la couverture editoriale des grandes courses internationales sur Altitude Trail (UTMB Mont-Blanc, Western States 100, Hardrock 100, Tor des Geants, Diagonale des Fous, Zegama). Sa demarche : croiser les sources primaires (iRunFar, Freetrail, sites officiels d'organisations), interroger les enjeux structurants (qualification, professionnalisation, ecologie, business models) sans tomber dans le clickbait. Sur les portraits d'athletes, il privilegie les chiffres verifiables et les declarations publiques sourcees, plutot que les superlatifs. Ligne directrice : poser les questions que le milieu trail evite (financement UTMB Group, exploitation des benevoles, dopage non couvert), citer les sources, laisser le lecteur conclure.",
    jobTitle: "Redacteur Actualites, courses & industrie — Couvre les grands rendez-vous mondiaux et l'industrie du trail",
    // Marc couvre l'editorial de fond (actualites, courses-recits) et les
    // breves actu sur les trois verticales (athletes, marques-industrie,
    // equipement). Sur equipement, partage avec Yann 80/20 pour l'angle
    // consumer-oriented (prix en France, dispo, premier achat).
    specialties: ["actualites", "courses-recits", "athletes", "marques-industrie", "equipement"],
    avatarColor: "#b91c1c",
    credentials: [
      "Couverture des courses internationales trail depuis 2014",
      "Specialise enjeux UTMB World Series, Western States, Hardrock 100",
      "Pratique trail running et long distance",
    ],
    sameAs: ["mailto:marc.blanc@altitude-trail.fr"],
  },
  {
    slug: "yann-karroum",
    name: "Yann Karroum",
    bio: "Fondateur et editeur d'Altitude Trail. Pratiquant trail running et passionne d'analyse strategique du sport. Signe les articles d'actualite, les contenus pour debuter et l'angle marche francais sur l'equipement (prix, disponibilite, premier achat).",
    bioLong: "Yann Karroum a fonde Altitude Trail en 2026 avec une conviction simple : le trail francais merite un media qui pose les vraies questions plutot que d'amplifier les communiques. Il signe personnellement les contenus 'Debuter' (premiere paire de chaussures, premier 50K, premier ultra) et les analyses equipement avec l'angle consumer francais (prix Decathlon, disponibilite, rapport qualite-prix). Sur les actualites, il partage la couverture avec Marc Blanc, sa zone de predilection etant les sujets d'industrie et le marche francais : qui domine vraiment chez Hoka vs Salomon vs Kiprun, comment les marques investissent en France, ce que les chiffres ITRA disent vraiment.",
    jobTitle: "Editeur & redacteur — Fondateur d'Altitude Trail, ligne 'Debuter' et marche francais",
    // Yann intervient sur les actualites (partage 80/20 avec Marc), sur
    // "debuter" (seul responsable) et en cosigne 80/20 sur "equipement" avec
    // Marc pour l'angle consumer-oriented.
    specialties: ["actualites", "debuter", "equipement"],
    avatarColor: "#7c3aed",
    credentials: [
      "Fondateur et editeur d'Altitude Trail (2026)",
      "Pratiquant trail running",
      "Specialise analyse marche francais trail et industrie outdoor",
    ],
    sameAs: ["mailto:yannkarroum@gmail.com"],
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
