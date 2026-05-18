import Link from "next/link";
import { getPillarBySlug } from "@/lib/pillars";

type Props = { hotEventSlug?: string };

/**
 * Bandeau "Cet article fait partie du dossier X" en tete d'article.
 * Renforce le cocon semantique : signal explicite a Google que cet article
 * appartient a la hierarchie pillar / satellite. Ameliore le CTR sur les
 * pillar pages depuis les articles satellites.
 */
export default function DossierBanner({ hotEventSlug }: Props) {
  if (!hotEventSlug) return null;
  const pillar = getPillarBySlug(hotEventSlug);
  if (!pillar) return null;
  return (
    <Link
      href={`/dossiers/${pillar.slug}`}
      className="group flex items-center justify-between gap-3 mb-6 bg-navy text-white px-4 py-3 hover:bg-primary transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="shrink-0 text-[10px] font-headline font-black uppercase tracking-widest bg-primary group-hover:bg-white group-hover:text-primary text-white px-2 py-1 transition-colors">
          Dossier
        </span>
        <span className="font-headline font-bold text-sm truncate">{pillar.name}</span>
      </div>
      <span className="shrink-0 text-xs font-headline font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100">
        Tout le dossier →
      </span>
    </Link>
  );
}
