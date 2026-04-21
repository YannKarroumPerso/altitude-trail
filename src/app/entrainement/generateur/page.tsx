import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PlanGenerator from "@/components/entrainement/PlanGenerator";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

const title = "Générateur de plan d'entraînement trail";
const description =
  "Plan d'entraînement trail personnalisé généré par une intelligence artificielle entraînée sur les méthodes de Kilian Jornet, François D'Haene et les coaches UTMB. Périodisation, gestion de la charge, nutrition, renforcement.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/entrainement/generateur", languages: { fr: "/entrainement/generateur" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/entrainement/generateur`,
    title: `${title} — ${SITE_NAME}`,
    description,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title, description },
};

export default function GenerateurPage() {
  const breadcrumb = [
    { label: "Accueil", href: "/" },
    { label: "Entraînement", href: "/categories/entrainement" },
    { label: "Générateur de plan" },
  ];
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
      <div className="border-b-2 border-navy pb-6 mb-10">
        <Breadcrumb items={breadcrumb} />
        <h1 className="font-headline text-5xl font-black uppercase tracking-tighter">Générateur de plan d&apos;entraînement</h1>
        <p className="text-slate-500 mt-2 max-w-2xl">
          Remplis le formulaire ci-dessous et reçois en 30 à 90 secondes un plan complet, semaine par semaine,
          calé sur les règles physiologiques et méthodologies des coaches trail de référence. Utilisation
          indicative — ne remplace pas un suivi par un préparateur diplômé.
        </p>
      </div>
      <PlanGenerator />
    </div>
  );
}
