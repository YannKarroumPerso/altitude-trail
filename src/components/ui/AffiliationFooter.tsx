import type { Article } from "@/types";
import { detectBrandsInArticle, pickAffiliationFor } from "@/lib/affiliation";

type Props = { article: Article };

/**
 * Bloc d'affiliation en fin d'article. S'affiche UNIQUEMENT si l'article
 * mentionne explicitement une ou plusieurs marques outdoor reconnues.
 *
 * Ligne editoriale : discret, factuel, signaling clairement le partenariat.
 * Contrairement aux concurrents qui empilent les encarts agressifs dans le
 * corps de l'article, Altitude Trail signale honnetement le lien.
 */
export default function AffiliationFooter({ article }: Props) {
  const brands = detectBrandsInArticle({
    title: article.title,
    content: article.content,
    tags: article.tags,
  });
  const picked = pickAffiliationFor(brands);
  if (!picked) return null;

  const { program, relevantBrands } = picked;
  // Affichage max 3 marques pour ne pas surcharger la phrase
  const displayBrands = relevantBrands.slice(0, 3).join(", ");
  const moreSuffix = relevantBrands.length > 3 ? ` et autres marques` : "";

  return (
    <aside
      className="mt-12 mb-8 border-l-2 border-primary bg-surface-container p-5 not-prose"
      aria-label="Lien partenaire"
    >
      <p className="text-[10px] font-headline font-black uppercase tracking-widest text-slate-500 mb-2">
        Lien partenaire
      </p>
      <p className="text-sm text-slate-700 leading-relaxed">
        {program.cta} <span className="font-bold">{program.merchantLabel}</span> :{" "}
        <a
          href={program.url}
          target="_blank"
          rel="sponsored nofollow noopener"
          className="text-primary font-bold hover:underline"
        >
          {displayBrands}
          {moreSuffix}
        </a>
        .
      </p>
      <p className="text-[11px] text-slate-500 mt-2 italic">
        Altitude Trail peut percevoir une commission sur les achats effectues via ce lien.
        Ce partenariat n&apos;influence pas notre ligne editoriale, ni le contenu de l&apos;article ci-dessus.
      </p>
    </aside>
  );
}
