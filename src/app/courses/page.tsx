import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import CoursesClient from "@/components/courses/CoursesClient";
import { races } from "@/lib/races-database";
import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildSportsEventJsonLd,
} from "@/lib/seo";

const title = "Calendrier des courses de trail en France";
const description = `Carte interactive et calendrier de ${races.length} courses de trail en France pour la saison 2026 : UTMB, Diagonale des Fous, SaintéLyon, Templiers, Maxi-Race et plus — filtres par région, département, mois, distance, difficulté.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/courses", languages: { fr: "/courses" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/courses`,
    title: `${title} — ${SITE_NAME}`,
    description,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function CoursesPage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Courses en France" },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    breadcrumb.map((b) => ({ label: b.label, url: b.href ? absoluteUrl(b.href) : undefined }))
  );
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description,
    numberOfItems: races.length,
    itemListElement: races.map((race, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: buildSportsEventJsonLd(race),
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />
      <div className="border-b-2 border-navy pb-6 mb-10">
        <Breadcrumb items={breadcrumb} />
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">Courses de Trail en France</h1>
        <p className="text-slate-500 mt-2">
          Calendrier 2026 — {races.length} courses référencées. Cliquez sur un marqueur pour voir le détail.
        </p>
      </div>
      <CoursesClient races={races} />

      <div className="mt-16 bg-navy text-white p-8 text-center space-y-4">
        <h2 className="font-headline text-2xl font-black uppercase">Votre course n&apos;est pas dans la liste ?</h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Ce calendrier est en cours d&apos;enrichissement. Contactez-nous pour référencer votre événement trail.
        </p>
        <a
          href="/contact"
          className="inline-block bg-primary text-white px-8 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          Nous contacter
        </a>
      </div>
    </div>
  );
}
