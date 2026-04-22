import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ArticleCard from "@/components/ui/ArticleCard";
import JsonLd from "@/components/ui/JsonLd";
import { AUTHORS, getAuthorBySlug, authorUrl } from "@/lib/authors";
import { articles } from "@/lib/data";
import { resolveAuthor } from "@/lib/authors";
import {
  SITE_URL,
  SITE_NAME,
  buildPersonJsonLd,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
} from "@/lib/seo";

export function generateStaticParams() {
  return AUTHORS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: "Auteur introuvable" };
  const title = `${author.name} — ${SITE_NAME}`;
  const description = `${author.bio} Articles signés ${author.name} sur Altitude Trail.`;
  const url = authorUrl(author.slug);
  return {
    title: author.name,
    description,
    alternates: { canonical: `/auteurs/${author.slug}` },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      siteName: SITE_NAME,
      locale: "fr_FR",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  // Articles signés par cet auteur (via resolveAuthor sur le champ author de l'article)
  const authored = articles.filter((a) => {
    const r = resolveAuthor(a.author);
    return r.author?.slug === author.slug;
  });

  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Rédaction", href: "/auteurs" },
    { label: author.name },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd
        data={buildPersonJsonLd({
          name: author.name,
          url: authorUrl(author.slug),
          jobTitle: author.jobTitle,
          description: author.bio,
          sameAs: author.sameAs,
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Rédaction", url: `${SITE_URL}/auteurs` },
          { label: author.name, url: authorUrl(author.slug) },
        ])}
      />
      {authored.length > 0 && (
        <JsonLd
          data={buildCollectionPageJsonLd({
            name: `Articles de ${author.name}`,
            description: `Articles signés ${author.name} sur Altitude Trail`,
            url: authorUrl(author.slug),
            articles: authored,
          })}
        />
      )}
      <Breadcrumb items={breadcrumb} />

      <div className="border-b-2 border-surface-container pb-8 mb-10">
        <div className="text-[10px] font-headline font-black uppercase tracking-widest text-primary mb-2">
          {author.jobTitle}
        </div>
        <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-4">
          {author.name}
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-2xl">
          {author.bio}
        </p>
      </div>

      <h2 className="font-headline text-2xl font-black uppercase tracking-tighter mb-6">
        Articles signés
      </h2>

      {authored.length === 0 ? (
        <p className="text-slate-500 italic">
          Aucun article publié pour le moment.{" "}
          <Link href="/" className="text-primary hover:underline">
            Retour à la une
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {authored.slice(0, 12).map((a, i) => (
            <ArticleCard
              key={a.slug}
              article={a}
              variant="default"
              hideExcerpt={i % 3 === 2}
            />
          ))}
        </div>
      )}

      {authored.length > 12 && (
        <p className="mt-8 text-sm text-slate-500">
          {authored.length} articles au total.
        </p>
      )}
    </div>
  );
}
