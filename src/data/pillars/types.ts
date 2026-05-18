/**
 * Type d'un "dossier course" = pillar page agregant tout ce qu'Altitude Trail
 * a a dire sur un evenement majeur (UTMB, Western States, Hardrock, etc.).
 *
 * Strategie SEO : capter l'intent "comment suivre X", "qui gagne X", "histoire X",
 * "comment se qualifier pour X" sur un seul URL faisant autorite.
 */
export type Winner = { year: number; men: string; women: string; menTime?: string; womenTime?: string };

export type GlossaryItem = { term: string; definition: string };

export type FaqItem = { question: string; answer: string };

export type PillarDossier = {
  /** Slug = exactement le hotEventSlug du calendrier (zegama-aizkorri-2026, utmb...) */
  slug: string;
  /** Nom officiel de l'evenement */
  name: string;
  /** Slogan ou tagline courte (1 ligne) */
  tagline: string;
  /** Description longue, 2-4 paragraphes (peut contenir des liens markdown internes) */
  intro: string;
  /** Image hero pleine largeur (peut etre /logo-square.png en attendant) */
  heroImage: string;
  /** Specs cles : distance, denivele, etc. */
  specs: { label: string; value: string }[];
  /** Programme de la prochaine edition (ex : "Vendredi 28 aout, depart 18h") */
  programme: { label: string; value: string }[];
  /** Palmares condense (5 derniers vainqueurs) */
  palmares: Winner[];
  /** Glossaire 4-8 termes specifiques a cet event (ex pour UTMB : ITRA Index, TDS, OCC) */
  glossary: GlossaryItem[];
  /** FAQ courte 3-6 questions */
  faq: FaqItem[];
  /** Section "comment suivre" : liste de moyens (live YouTube, suivi GPS, presse) */
  howToWatch: { label: string; url?: string; description: string }[];
  /** Site officiel pour le lien sortant */
  officialUrl: string;
  /** Date prochaine edition (ISO) pour affichage compte a rebours */
  nextEditionDate: string;
};
