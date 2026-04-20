import { articles } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ArticleCard from "@/components/ui/ArticleCard";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();
  const related = articles.filter((a) => a.categorySlug === article.categorySlug && a.slug !== slug).slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-8 font-headline uppercase tracking-wide">
        <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
        <span>/</span>
        <Link href={"/categories/" + article.categorySlug} className="hover:text-primary transition-colors">{article.category}</Link>
        <span>/</span>
        <span className="text-on-surface truncate max-w-xs">{article.title}</span>
      </div>
      <div className="mb-4">
        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 tracking-tighter uppercase font-headline">{article.category}</span>
      </div>
      <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-6">{article.title}</h1>
      <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold uppercase tracking-wide mb-8 border-b border-surface-container pb-6">
        <span>Par {article.author}</span><span>·</span><span>{article.date}</span><span>·</span><span>{article.readTime} de lecture</span>
      </div>
      <div className="mb-8 overflow-hidden">
        <Image src={article.image} alt={article.title} width={1200} height={675} className="w-full aspect-video object-cover" />
      </div>
      <p className="text-xl text-slate-600 italic border-l-4 border-primary pl-6 mb-8 leading-relaxed">{article.excerpt}</p>
      <div className="space-y-6 text-slate-700 leading-relaxed text-lg">
        <p>Le trail running est bien plus qu'un sport — c'est une philosophie de vie, une façon d'appréhender la montagne et ses défis. Dans cet article, nous explorons en profondeur tous les aspects de ce sujet passionnant qui touche des milliers de coureurs en France et dans le monde entier.</p>
        <p>Que vous soyez débutant cherchant vos premiers kilomètres en nature ou ultra-traileur expérimenté visant les plus grandes courses mondiales, les enjeux restent les mêmes : repousser ses limites, se connecter à la nature, et partager cette passion avec une communauté extraordinaire.</p>
        <h2 className="font-headline text-3xl font-black mt-10 mb-4">Les fondamentaux</h2>
        <p>La préparation est la clé de tout. Sans une base solide d'entraînement progressif, aucun objectif ambitieux ne peut être atteint durablement. Les meilleurs traileurs du monde consacrent des années à construire leur moteur aérobie avant de viser les podiums.</p>
        <h2 className="font-headline text-3xl font-black mt-10 mb-4">En pratique</h2>
        <p>Sur le terrain, la théorie laisse place à l'instinct. Des années d'entraînement cristallisées en quelques heures d'effort intense, où chaque décision peut faire la différence entre une belle performance et un abandon.</p>
      </div>
      {article.tags && (
        <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-surface-container">
          {article.tags.map((tag) => (
            <span key={tag} className="bg-surface-container text-xs font-bold px-3 py-1 font-headline uppercase tracking-wide">{tag}</span>
          ))}
        </div>
      )}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="newspaper-divider mb-10"><span>ARTICLES SIMILAIRES</span></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {related.map((a) => <ArticleCard key={a.slug} article={a} variant="default" />)}
          </div>
        </div>
      )}
    </div>
  );
}
