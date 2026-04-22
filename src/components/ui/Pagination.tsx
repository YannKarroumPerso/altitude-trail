import Link from "next/link";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Construit l'URL pour une page donnée. Exemples :
   *   (1) → "/categories/entrainement"
   *   (2) → "/categories/entrainement/page/2" */
  hrefForPage: (page: number) => string;
}

/**
 * Pagination accessible avec liens vers pages précédente/suivante et numéros
 * de page. Génère des `<a>` standards (Next.js Link) — crawlables par
 * Googlebot, indexables individuellement.
 *
 * Affiche une fenêtre intelligente sur les grandes paginations :
 * - Si <=7 pages : toutes
 * - Sinon : 1 … currentPage-1, currentPage, currentPage+1 … last
 */
export default function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Construit la liste de numéros de page à afficher avec "…" pour l'ellipsis
  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("…");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 pt-8 border-t border-surface-container flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link
          href={hrefForPage(currentPage - 1)}
          rel="prev"
          className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide bg-surface-container text-navy hover:bg-navy hover:text-white transition-colors"
          aria-label="Page précédente"
        >
          ← Précédent
        </Link>
      ) : (
        <span className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide bg-surface-container text-slate-400 cursor-not-allowed">
          ← Précédent
        </span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 py-2 text-sm text-slate-400"
            aria-hidden="true"
          >
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            aria-current="page"
            className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide bg-primary text-white"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={hrefForPage(p)}
            className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide bg-surface-container text-navy hover:bg-navy hover:text-white transition-colors"
            aria-label={`Page ${p}`}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={hrefForPage(currentPage + 1)}
          rel="next"
          className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide bg-surface-container text-navy hover:bg-navy hover:text-white transition-colors"
          aria-label="Page suivante"
        >
          Suivant →
        </Link>
      ) : (
        <span className="px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide bg-surface-container text-slate-400 cursor-not-allowed">
          Suivant →
        </span>
      )}
    </nav>
  );
}

// Helper partagé : 12 articles par page par défaut.
export const ARTICLES_PER_PAGE = 12;

export function totalPagesForCount(count: number, perPage = ARTICLES_PER_PAGE): number {
  return Math.max(1, Math.ceil(count / perPage));
}
