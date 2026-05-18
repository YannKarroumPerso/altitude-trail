import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/types";
import { articles } from "@/lib/data";
import { getArticlePublishedAt } from "@/lib/seo";

type Props = { article: Article };

/**
 * Bloc "Lire aussi" en pied d'article. Selectionne 3 articles pertinents :
 * priorite 1 = meme hotEventSlug (cocon event), priorite 2 = meme
 * categorySlug, exclus l'article courant. Renforce internal linking.
 */
function pickRelated(current: Article, n = 3): Article[] {
  const seen = new Set<string>([current.slug]);
  const pool: Article[] = [];

  if (current.hotEventSlug) {
    const sameDossier = articles.filter(
      (a) => a.hotEventSlug === current.hotEventSlug && !seen.has(a.slug)
    );
    for (const a of sameDossier) { pool.push(a); seen.add(a.slug); if (pool.length >= n) break; }
  }
  if (pool.length < n) {
    const sameCat = articles.filter(
      (a) => a.categorySlug === current.categorySlug && !seen.has(a.slug)
    );
    sameCat.sort((a, b) => getArticlePublishedAt(b).getTime() - getArticlePublishedAt(a).getTime());
    for (const a of sameCat) { pool.push(a); seen.add(a.slug); if (pool.length >= n) break; }
  }
  return pool.slice(0, n);
}

export default function RelatedArticles({ article }: Props) {
  const related = pickRelated(article, 3);
  if (related.length === 0) return null;
  return (
    <section className="mt-12 pt-8 border-t-2 border-surface-container">
      <h2 className="font-headline text-xs font-black uppercase tracking-widest text-slate-500 mb-6">
        Lire aussi
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((a) => (
          <Link key={a.slug} href={`/articles/${a.slug}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden mb-3 bg-slate-100">
              <Image
                src={a.image}
                alt={a.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-primary font-headline font-black">
              {a.category}
            </span>
            <h3 className="mt-1 font-headline font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-3">
              {a.title}
            </h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
