import { articles } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import ArticleCard from "@/components/ui/ArticleCard";

const markdownComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-headline text-4xl font-black mt-10 mb-4" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-headline text-3xl font-black mt-10 mb-4" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-headline text-2xl font-bold mt-8 mb-3" {...props} />
  ),
  h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className="font-headline text-xl font-bold mt-6 mb-2" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-4" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal pl-6 space-y-2 mb-4" {...props} />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold" {...props} />
  ),
  em: (props: React.HTMLAttributes<HTMLElement>) => (
    <em className="italic" {...props} />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="text-primary underline hover:opacity-80"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="border-l-4 border-primary pl-6 italic text-slate-600 my-6"
      {...props}
    />
  ),
};

function stripLeadingH1(md: string): string {
  return md.replace(/^\s*#\s+[^\n]+\n+/, "");
}

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
      <div className="text-slate-700 leading-relaxed text-lg">
        {article.content ? (
          <ReactMarkdown components={markdownComponents}>
            {stripLeadingH1(article.content)}
          </ReactMarkdown>
        ) : (
          <div className="space-y-6">
            <p>Le trail running est bien plus qu&apos;un sport — c&apos;est une philosophie de vie, une façon d&apos;appréhender la montagne et ses défis. Dans cet article, nous explorons en profondeur tous les aspects de ce sujet passionnant qui touche des milliers de coureurs en France et dans le monde entier.</p>
            <p>Que vous soyez débutant cherchant vos premiers kilomètres en nature ou ultra-traileur expérimenté visant les plus grandes courses mondiales, les enjeux restent les mêmes : repousser ses limites, se connecter à la nature, et partager cette passion avec une communauté extraordinaire.</p>
            <h2 className="font-headline text-3xl font-black mt-10 mb-4">Les fondamentaux</h2>
            <p>La préparation est la clé de tout. Sans une base solide d&apos;entraînement progressif, aucun objectif ambitieux ne peut être atteint durablement. Les meilleurs traileurs du monde consacrent des années à construire leur moteur aérobie avant de viser les podiums.</p>
            <h2 className="font-headline text-3xl font-black mt-10 mb-4">En pratique</h2>
            <p>Sur le terrain, la théorie laisse place à l&apos;instinct. Des années d&apos;entraînement cristallisées en quelques heures d&apos;effort intense, où chaque décision peut faire la différence entre une belle performance et un abandon.</p>
          </div>
        )}
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
