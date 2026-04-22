import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import PlanGenerator from "@/components/entrainement/PlanGenerator";
import JsonLd from "@/components/ui/JsonLd";
import {
  SITE_URL,
  SITE_NAME,
  buildHowToJsonLd,
  buildFaqPageJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";

const title = "Générateur de plan d'entraînement trail";
const description =
  "Plan d'entraînement trail personnalisé généré par une intelligence artificielle entraînée sur les méthodes de Kilian Jornet, François D'Haene et les coaches UTMB. Périodisation, gestion de la charge, nutrition, renforcement.";

const GENERATOR_URL = `${SITE_URL}/entrainement/generateur`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/entrainement/generateur", languages: { fr: "/entrainement/generateur" } },
  openGraph: {
    type: "website",
    url: GENERATOR_URL,
    title: `${title} — ${SITE_NAME}`,
    description,
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
  twitter: { card: "summary_large_image", title, description },
};

const HOW_TO_STEPS = [
  {
    name: "Profil coureur",
    text: "Indique ton prénom, ton âge, ton sexe et ta région : le plan s'adapte à ton terrain d'entraînement et à ton profil physiologique.",
  },
  {
    name: "Course cible",
    text: "Renseigne la date, la distance et le dénivelé de ton objectif. Le moteur calcule la périodisation inverse à partir de cette échéance.",
  },
  {
    name: "Volume et niveau actuels",
    text: "Déclare ton kilométrage hebdo actuel et ta VMA (ou ton allure 10 km). Le plan part de ton niveau réel, pas d'un niveau théorique.",
  },
  {
    name: "Réception par email",
    text: "Renseigne ton email et valide le consentement RGPD. Tu reçois en moins de 2 minutes un plan complet, semaine par semaine, consultable en ligne et exportable en PDF.",
  },
];

const FAQ = [
  {
    q: "Le générateur de plan d'entraînement trail est-il vraiment gratuit ?",
    a: "Oui. Le plan est 100 % gratuit, sans limite d'usage. Altitude Trail finance le service via sa ligne éditoriale et ses partenaires. Ton email reste confidentiel et n'est jamais revendu.",
  },
  {
    q: "Sur combien de semaines le plan est-il construit ?",
    a: "Le plan s'étend de 4 à 16 semaines selon ta date d'objectif. Au-delà de 16 semaines, une phase de base est proposée. En deçà de 4 semaines, l'outil recommande un affûtage plutôt qu'un plan complet.",
  },
  {
    q: "Sur quelles méthodes l'algorithme s'appuie-t-il ?",
    a: "Sur la physiologie de l'endurance (Seiler, Billat), la périodisation inverse, la méthodologie des coaches UTMB et les principes d'entraînement des traileurs d'élite comme Kilian Jornet et François D'Haene. L'approche combine endurance fondamentale (80 %), seuil et VMA spécifique (15 %) et sorties longues à dénivelé progressif.",
  },
  {
    q: "Le plan remplace-t-il un coach ?",
    a: "Non. Un coach humain analyse ta gestuelle, tes réponses aux charges, ton sommeil, ton mental et adapte chaque semaine. Le générateur donne un cadre solide et cohérent, particulièrement utile pour les coureurs autonomes ou comme base de discussion avec un préparateur.",
  },
  {
    q: "Puis-je exporter le plan en PDF ?",
    a: "Oui. Une fois le plan généré, un bouton d'export PDF permet de l'imprimer ou de le conserver hors ligne. Le plan est aussi accessible via un lien privé envoyé par email.",
  },
  {
    q: "Combien de temps faut-il attendre ?",
    a: "Entre 30 et 90 secondes en moyenne. Le plan est généré en arrière-plan ; tu peux fermer la page, le lien d'accès t'est envoyé par email dès que c'est prêt.",
  },
];

const breadcrumb = [
  { label: "Accueil", href: "/" },
  { label: "Entraînement", href: "/categories/entrainement" },
  { label: "Générateur de plan" },
];

export default function GenerateurPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-12">
      <JsonLd
        data={buildHowToJsonLd({
          name: "Comment générer son plan d'entraînement trail personnalisé",
          description,
          url: GENERATOR_URL,
          totalTime: "PT90S",
          steps: HOW_TO_STEPS,
        })}
      />
      <JsonLd data={buildFaqPageJsonLd(FAQ)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { label: "Accueil", url: SITE_URL },
          { label: "Entraînement", url: `${SITE_URL}/categories/entrainement` },
          { label: "Générateur de plan", url: GENERATOR_URL },
        ])}
      />
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

      {/* FAQ visible (aide au rich result FAQ + contenu textuel pour le SEO) */}
      <section className="mt-20 pt-10 border-t-2 border-navy">
        <h2 className="font-headline text-3xl font-black uppercase tracking-tighter mb-8">
          Questions fréquentes
        </h2>
        <div className="space-y-6">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-surface-container pb-6">
              <summary className="cursor-pointer font-headline font-bold text-lg text-navy marker:text-primary hover:text-primary transition-colors">
                {f.q}
              </summary>
              <p className="mt-3 text-slate-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
