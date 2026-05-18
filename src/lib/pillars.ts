import { utmb } from "@/data/pillars/utmb";
import { westernStates100 } from "@/data/pillars/western-states-100";
import { hardrock100 } from "@/data/pillars/hardrock-100";
import { diagonaleDesFous } from "@/data/pillars/diagonale-des-fous";
import { zegamaAizkorri2026 } from "@/data/pillars/zegama-aizkorri-2026";
import type { PillarDossier } from "@/data/pillars/types";
import type { Article } from "@/types";
import { articles } from "@/lib/data";
import { getArticlePublishedAt } from "@/lib/seo";

/**
 * Registre complet des dossiers courses publies.
 * Ordre alphabetique par nom officiel pour la page index.
 */
export const PILLARS: PillarDossier[] = [
  diagonaleDesFous,
  hardrock100,
  utmb,
  westernStates100,
  zegamaAizkorri2026,
];

/**
 * Lookup par slug.
 */
export function getPillarBySlug(slug: string): PillarDossier | null {
  return PILLARS.find((p) => p.slug === slug) ?? null;
}

/**
 * Retourne les articles lies a un dossier course, tries par date desc.
 * Strategie : on combine hotEventSlug match + fallback fuzzy sur les tags
 * ou le titre (utile pour les articles anciens qui n ont pas ete tagues
 * hotEventSlug a la creation).
 */
export function getRelatedArticles(pillar: PillarDossier, limit = 30): Article[] {
  const tagged = articles.filter((a) => a.hotEventSlug === pillar.slug);
  const taggedSlugs = new Set(tagged.map((a) => a.slug));

  // Fuzzy match : matche le nom (sans accents) dans le title ou les tags
  const needle = pillar.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const shortNeedle = needle.split(/\s+/).slice(0, 2).join(" "); // "zegama aizkorri" -> "zegama"
  const fuzzy = articles.filter((a) => {
    if (taggedSlugs.has(a.slug)) return false;
    const hay = `${a.title} ${(a.tags || []).join(" ")}`.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
    return hay.includes(shortNeedle) || hay.includes(needle.split(" ")[0]);
  });

  const all = [...tagged, ...fuzzy];
  return all
    .sort((a, b) => getArticlePublishedAt(b).getTime() - getArticlePublishedAt(a).getTime())
    .slice(0, limit);
}

/**
 * Compteur d articles par dossier pour la page index.
 */
export function countRelatedArticles(pillar: PillarDossier): number {
  return getRelatedArticles(pillar, 1000).length;
}

export type { PillarDossier };
