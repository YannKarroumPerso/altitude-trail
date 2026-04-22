import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ui/ArticleCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import Pagination, { ARTICLES_PER_PAGE, totalPagesForCount } from "@/components/ui/Pagination";
import { articles, categories } from "@/lib/data";
import {
  SITE_NAME,
  SITE_URL,
  categoryUrl,
  buildCollectionPageJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";

/**
 * Rend une page catégorie paginée. Partagée entre :
 *   - /categories/[slug]/page.tsx               → page 1 (canonique)
 *   - /categories/[slug]/page/[page]/page.tsx   → pages 2+
 *
 * Paramètres :
 * - `slug`       : slug de catégorie
 * - `page`       : numéro de page (>= 1)
 *
 * Appelle notFound() si la catégorie n'existe pas ou si page > totalPages.
 */
export default function CategoryPageLayout({
  slug,
  page,
}: {
  slug: string;
  page: number;
}) {
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const allCategoryArticles = articles.filter((a) => a.categorySlug === slug);
  const totalPages = totalPagesForCount(allCategoryArticles.length);
  if (page < 1 || page > totalPages) notFound();

  const startIdx = (page - 1) * ARTICLES_PER_PAGE;
  const endIdx = startIdx + ARTICLES_PER_PAGE;
  const pageArticles = allCategoryArticles.slice(startIdx, endIdx);

  const breadcrumb = [
    { label: "Accueil", href: "/" },
    ...(page === 1
      ? [{ label: category.label }]
      : [
          { label: category.label, href: `/categories/${category.slug}` },
          { label: `Page ${page}` },
        ]),
  ];

  const currentUrl =
    page === 1
      ? categoryUrl(category.slug)
      : `${SITE_URL}/categories/${category.slug}/page/${page}`;

  const hrefForPage = (p: number) =>
    p === 1
      ? `/categories/${category.slug}`
      : `/categories/${category.slug}/page/${p}`;

  const collectionJsonLd = buildCollectionPageJsonLd({
    name:
      page === 1
        ? `${category.label} — ${SITE_NAME}`
        : `${category.label} — page ${page} — ${SITE_NAME}`,
    description: category.description,
    url: currentUrl,
    articles: pageArticles,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    page === 1
      ? [
          { label: "Accueil", url: SITE_URL },
          { label: category.label, url: categoryUrl(category.slug) },
        ]
      : [
          { label: "Accueil", url: SITE_URL },
          { label: category.label, url: categoryUrl(category.slug) },
          { label: `Page ${page}`, url: currentUrl },
        ]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={collectionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="border-b-2 border-navy pb-6 mb-12">
        <Breadcrumb items={breadcrumb} />
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">
          {category.label}
          {page > 1 && (
            <span className="ml-3 text-2xl text-slate-400 align-baseline">
              · Page {page}
            </span>
          )}
        </h1>
        <p className="text-slate-500 mt-2">{category.description}</p>
        <p className="text-xs text-slate-400 mt-2">
          {allCategoryArticles.length} article{allCategoryArticles.length > 1 ? "s" : ""}
          {totalPages > 1 ? ` · ${totalPages} pages` : ""}
        </p>
      </div>

      {/* Navigation inter-catégories */}
      <div className="flex flex-wrap gap-3 mb-12">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={"/categories/" + cat.slug}
            className={
              "px-4 py-2 text-xs font-headline font-bold uppercase tracking-wide transition-colors " +
              (cat.slug === slug
                ? "bg-navy text-white"
                : "bg-surface-container text-navy hover:bg-navy hover:text-white")
            }
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {pageArticles.length === 0 ? (
        <p className="text-slate-500 text-center py-20">
          Aucun article dans cette catégorie pour le moment.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {pageArticles.map((article, i) => (
              <ArticleCard
                key={article.slug}
                article={article}
                variant="default"
                hideExcerpt={i % 3 === 2}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            hrefForPage={hrefForPage}
          />
        </>
      )}
    </div>
  );
}
