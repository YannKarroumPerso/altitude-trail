import { articles, categories } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import ArticleCard from "@/components/ui/ArticleCard";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  const categoryArticles = articles.filter((a) => a.categorySlug === slug);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <div className="border-b-2 border-navy pb-6 mb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-headline uppercase tracking-wide">
          <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
          <span>/</span>
          <span>{category.label}</span>
        </div>
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">{category.label}</h1>
        <p className="text-slate-500 mt-2">{category.description}</p>
      </div>
      <div className="flex flex-wrap gap-3 mb-12">
        {categories.map((cat) => (
          <Link key={cat.slug} href={"/categories/" + cat.slug}
            className={"px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide transition-colors " + (cat.slug === slug ? "bg-navy text-white" : "bg-surface-container text-navy hover:bg-navy hover:text-white")}>
            {cat.label}
          </Link>
        ))}
      </div>
      {categoryArticles.length === 0 ? (
        <p className="text-slate-500 text-center py-20">Aucun article dans cette catégorie pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {categoryArticles.map((article) => <ArticleCard key={article.slug} article={article} variant="default" />)}
        </div>
      )}
    </div>
  );
}
