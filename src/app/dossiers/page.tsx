import type { Metadata } from "next";
import Link from "next/link";
import { PILLARS, countRelatedArticles } from "@/lib/pillars";
import { formatRelativeEventDate } from "@/lib/hot-events";
import { SITE_URL, SITE_NAME, absoluteUrl } from "@/lib/seo";
import JsonLd from "@/components/ui/JsonLd";

export const metadata: Metadata = {
  title: `Dossiers courses — ${SITE_NAME}`,
  description: "Toute la couverture éditoriale Altitude Trail rassemblée par grande course : UTMB Mont-Blanc, Western States 100, Hardrock 100, Diagonale des Fous, Zegama-Aizkorri. Programme, palmarès, comment regarder, articles.",
  alternates: { canonical: absoluteUrl("/dossiers") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/dossiers"),
    title: `Dossiers courses — ${SITE_NAME}`,
    description: "Les grands rendez-vous du trail mondial, agrégés par dossier complet.",
    siteName: SITE_NAME,
  },
};

export const revalidate = 3600;

export default function DossiersIndex() {
  const sorted = [...PILLARS].sort((a, b) => new Date(a.nextEditionDate).getTime() - new Date(b.nextEditionDate).getTime());
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Dossiers courses", item: absoluteUrl("/dossiers") },
    ],
  };
  return (
    <div className="bg-surface min-h-screen">
      <JsonLd data={breadcrumb} />
      <header className="bg-navy text-white">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <h1 className="font-headline font-black text-4xl md:text-5xl lg:text-6xl tracking-tighter uppercase">
            Dossiers courses
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Toute la couverture éditoriale Altitude Trail rassemblée, course par course. Programme, palmarès, glossaire, comment regarder et tous les articles dans un seul endroit.
          </p>
        </div>
      </header>
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        {sorted.map((p) => {
          const articleCount = countRelatedArticles(p);
          return (
            <Link
              key={p.slug}
              href={`/dossiers/${p.slug}`}
              className="group border border-surface-container p-6 hover:border-navy transition-colors bg-white flex flex-col gap-3"
            >
              <span className="text-[10px] uppercase tracking-widest text-primary font-headline font-black">
                {formatRelativeEventDate({ slug: p.slug, name: p.name, start: p.nextEditionDate, location: "" })}
              </span>
              <h2 className="font-headline font-black text-2xl tracking-tight leading-tight group-hover:text-primary transition-colors">
                {p.name}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{p.tagline}</p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-surface-container">
                <span className="text-xs text-slate-500">{p.specs.find((s) => s.label === "Distance")?.value} · {p.specs.find((s) => s.label === "Dénivelé positif")?.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-navy font-headline font-bold group-hover:text-primary">
                  {articleCount} {articleCount > 1 ? "articles" : "article"} →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
