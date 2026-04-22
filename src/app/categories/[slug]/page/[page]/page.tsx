import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, categories } from "@/lib/data";
import { SITE_NAME, SITE_URL, categoryUrl } from "@/lib/seo";
import { ARTICLES_PER_PAGE, totalPagesForCount } from "@/components/ui/Pagination";
import CategoryPageLayout from "@/components/categories/CategoryPageLayout";

/**
 * Pages paginées 2+ d'une catégorie. La page 1 reste sur /categories/[slug]
 * (URL canonique). Cette route ne génère que les numéros valides (page 2+)
 * via generateStaticParams pour être pré-rendue et parfaitement indexable.
 */
export function generateStaticParams() {
  const params: { slug: string; page: string }[] = [];
  for (const c of categories) {
    const count = articles.filter((a) => a.categorySlug === c.slug).length;
    const totalPages = totalPagesForCount(count, ARTICLES_PER_PAGE);
    for (let p = 2; p <= totalPages; p++) {
      params.push({ slug: c.slug, page: String(p) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Catégorie introuvable" };
  const pageNum = parseInt(page, 10);
  if (!pageNum || pageNum < 2) return { title: "Page introuvable" };

  const canonicalPath = `/categories/${category.slug}/page/${pageNum}`;
  const title = `${category.label} — Page ${pageNum} — Trail running & ultra-trail`;
  const description = `${category.description} Page ${pageNum} des publications Altitude Trail dans la catégorie ${category.label.toLowerCase()}.`;
  return {
    title,
    description,
    alternates: { canonical: canonicalPath, languages: { fr: canonicalPath } },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${canonicalPath}`,
      title,
      description,
      siteName: SITE_NAME,
      locale: "fr_FR",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPagedPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  const pageNum = parseInt(page, 10);
  if (!pageNum || pageNum < 2) notFound();
  return <CategoryPageLayout slug={slug} page={pageNum} />;
}
