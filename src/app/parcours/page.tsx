import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import ParcoursClient from "@/components/parcours/ParcoursClient";
import { traces } from "@/lib/traces-database";
import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";

const title = "Traces & parcours de randonnée et trail en France";
const description = `Carte interactive de ${traces.length.toLocaleString("fr-FR")} sentiers de randonnée et de trail en France, importés depuis OpenStreetMap. Fond de carte IGN Géoportail + photos aériennes, clustering, filtres balisage / distance / difficulté, liens vers Waymarked Trails et OSM pour la trace détaillée.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/parcours", languages: { fr: "/parcours" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/parcours`,
    title: `${title} — ${SITE_NAME}`,
    description,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function ParcoursPage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Traces & Parcours" },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    breadcrumb.map((b) => ({ label: b.label, url: b.href ? absoluteUrl(b.href) : undefined }))
  );
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${SITE_URL}/parcours`,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    numberOfItems: traces.length,
    license: "https://opendatacommons.org/licenses/odbl/",
    isBasedOn: {
      "@type": "Dataset",
      name: "OpenStreetMap hiking relations",
      url: "https://www.openstreetmap.org/",
      license: "https://opendatacommons.org/licenses/odbl/",
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={[breadcrumbJsonLd, collectionJsonLd]} />
      <div className="border-b-2 border-navy pb-6 mb-10">
        <Breadcrumb items={breadcrumb} />
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">Traces &amp; Parcours</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          {traces.length.toLocaleString("fr-FR")} sentiers de randonnée et de trail en France, importés depuis OpenStreetMap (licence ODbL). Carte sur fond IGN Géoportail, filtres par balisage, distance et difficulté, popup avec liens vers Waymarked Trails et OSM pour consulter le tracé détaillé.
        </p>
      </div>
      <ParcoursClient traces={traces} />
    </div>
  );
}
