import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import { races } from "@/lib/races-database";
import FindRaceClient from "@/components/courses/FindRaceClient";
import {
  SITE_URL,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
} from "@/lib/seo";

const TITLE = "Trouver une course de trail";
const DESCRIPTION =
  "Toutes les courses de trail en France filtrables par distance, dénivelé, région et date. Ultra-trails, trails longs, courses découverte : trouve l'épreuve qui correspond à ton profil.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/trouver-une-course", languages: { fr: "/trouver-une-course" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/trouver-une-course`,
    title: `${TITLE} — ${SITE_NAME}`,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function FindRacePage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Trouver une course" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd
        data={buildWebPageJsonLd({
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/trouver-une-course`,
          breadcrumb: [
            { label: "Accueil", url: SITE_URL },
            { label: "Trouver une course", url: `${SITE_URL}/trouver-une-course` },
          ],
        })}
      />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Trouver une course", url: `${SITE_URL}/trouver-une-course` },
        ])}
      />

      <Breadcrumb items={breadcrumb} />

      <div className="border-b-2 border-navy pb-6 mb-10">
        <h1 className="font-headline text-4xl lg:text-6xl font-black leading-none tracking-tighter mb-4">
          Trouver une course de trail
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
          {DESCRIPTION}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          {races.length} courses référencées · mis à jour régulièrement
        </p>
      </div>

      <FindRaceClient races={races} />
    </div>
  );
}
