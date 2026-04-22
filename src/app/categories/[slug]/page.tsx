import type { Metadata } from "next";
import { articles, categories } from "@/lib/data";
import {
  SITE_NAME,
  categoryUrl,
} from "@/lib/seo";
import CategoryPageLayout from "@/components/categories/CategoryPageLayout";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Catégorie introuvable" };
  const canonicalPath = `/categories/${category.slug}`;
  const title = `${category.label} — Trail running & ultra-trail`;
  return {
    title,
    description: category.description,
    alternates: { canonical: canonicalPath, languages: { fr: canonicalPath } },
    openGraph: {
      type: "website",
      url: categoryUrl(category.slug),
      title,
      description: category.description,
      siteName: SITE_NAME,
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: category.description,
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CategoryPageLayout slug={slug} page={1} />;
}
