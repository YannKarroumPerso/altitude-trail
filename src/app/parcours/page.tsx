import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/ui/JsonLd";
import ParcoursClient from "@/components/parcours/ParcoursClient";
import { parcours } from "@/lib/parcours-database";
import { traces } from "@/lib/traces-database";
import {
  SITE_URL,
  SITE_NAME,
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildHikingTrailJsonLd,
} from "@/lib/seo";

const title = "Parcours trail et randonnée en France";
const description = `Carte interactive et liste filtrable de ${parcours.length} parcours emblématiques trail, randonnée et ultra en France (GR20, Tour du Mont-Blanc, GR54, GR10, Stevenson, Sentier Cathare, Ventoux…) enrichie de ${traces.length} traces OpenStreetMap. Fond IGN Géoportail, profil altimétrique, téléchargement GPX.`;

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
    { label: "Parcours" },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    breadcrumb.map((b) => ({ label: b.label, url: b.href ? absoluteUrl(b.href) : undefined }))
  );
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description,
    numberOfItems: parcours.length,
    itemListElement: parcours.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: buildHikingTrailJsonLd(p),
    })),
  };
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd data={[breadcrumbJsonLd, itemListJsonLd]} />
      <div className="border-b-2 border-navy pb-6 mb-10">
        <Breadcrumb items={breadcrumb} />
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">Parcours</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          {parcours.length} parcours curés trail, randonnée et ultra{traces.length > 0 ? ` + ${traces.length.toLocaleString("fr-FR")} traces OpenStreetMap` : ""} en France. Carte sur fond IGN Géoportail. Les tracés sont approximatifs et indicatifs — ne remplacent pas une cartographie officielle pour la navigation.
        </p>
      </div>
      <ParcoursClient parcours={parcours} traces={traces} />
    </div>
  );
}
